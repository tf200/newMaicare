import { getContext, setContext } from 'svelte';
import { browser, dev } from '$app/environment';
import { PUBLIC_API_URL } from '$env/static/public';
import { api } from '$lib/api/client';
import type { ApiEnvelope } from '$lib/types/api';

const WS_KEY = Symbol('WEBSOCKET');

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'retrying' | 'error';

interface WsTicketData {
	ticket: string;
	expires_at: string;
	ws_path: string;
}

const RECONNECT_MIN_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const RECONNECT_JITTER_MS = 500;

function toWebSocketBaseUrl(url: string): string {
	if (url.startsWith('https://')) return `wss://${url.slice('https://'.length)}`;
	if (url.startsWith('http://')) return `ws://${url.slice('http://'.length)}`;
	return url;
}

function joinUrl(base: string, path: string): string {
	if (path.startsWith('ws://') || path.startsWith('wss://')) {
		return path;
	}

	const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${normalizedBase}${normalizedPath}`;
}

function parseJsonObjects(payload: string): unknown[] {
	const trimmedPayload = payload.trim();
	if (!trimmedPayload) {
		return [];
	}

	try {
		return [JSON.parse(trimmedPayload)];
	} catch {
		// Fallback for concatenated JSON payloads.
	}

	const chunks: string[] = [];
	let cursor = 0;

	while (cursor < trimmedPayload.length) {
		while (cursor < trimmedPayload.length && /\s/.test(trimmedPayload[cursor])) {
			cursor += 1;
		}

		if (cursor >= trimmedPayload.length) {
			break;
		}

		const firstChar = trimmedPayload[cursor];
		if (firstChar !== '{' && firstChar !== '[') {
			throw new Error('Unsupported WebSocket message payload format');
		}

		let inString = false;
		let escaping = false;
		const stack: string[] = [firstChar === '{' ? '}' : ']'];
		let index = cursor + 1;

		for (; index < trimmedPayload.length; index += 1) {
			const char = trimmedPayload[index];

			if (inString) {
				if (escaping) {
					escaping = false;
					continue;
				}

				if (char === '\\') {
					escaping = true;
					continue;
				}

				if (char === '"') {
					inString = false;
				}
				continue;
			}

			if (char === '"') {
				inString = true;
				continue;
			}

			if (char === '{') {
				stack.push('}');
				continue;
			}

			if (char === '[') {
				stack.push(']');
				continue;
			}

			if (char === '}' || char === ']') {
				const expected = stack.pop();
				if (expected !== char) {
					throw new Error('Invalid JSON chunk boundaries in WebSocket payload');
				}

				if (stack.length === 0) {
					chunks.push(trimmedPayload.slice(cursor, index + 1));
					cursor = index + 1;
					break;
				}
			}
		}

		if (stack.length > 0) {
			throw new Error('Incomplete JSON chunk in WebSocket payload');
		}
	}

	return chunks.map((chunk) => JSON.parse(chunk));
}

function isUnauthorizedError(error: unknown): boolean {
	return error instanceof Error && /unauthorized/i.test(error.message);
}

function getReconnectDelay(attempt: number): number {
	const cappedAttempt = Math.max(0, attempt);
	const exponentialDelay = Math.min(
		RECONNECT_MAX_DELAY_MS,
		RECONNECT_MIN_DELAY_MS * 2 ** cappedAttempt
	);
	const jitter = Math.floor(Math.random() * RECONNECT_JITTER_MS);
	return exponentialDelay + jitter;
}

function debugLog(message: string, ...context: unknown[]) {
	if (dev) {
		console.debug(`[ws] ${message}`, ...context);
	}
}

export class WebSocketManager {
	status = $state<WebSocketStatus>('disconnected');
	messages = $state<unknown[]>([]);
	private socket: WebSocket | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private shouldReconnect = false;
	private reconnectAttempts = 0;
	private wsBaseUrl: string;
	private readonly maxMessages = 200;

	constructor(wsBaseUrl = toWebSocketBaseUrl(PUBLIC_API_URL)) {
		this.wsBaseUrl = wsBaseUrl;
		if (browser) {
			window.addEventListener('auth:refresh', this.handleAuthRefresh);
		}
	}

	connect() {
		if (!browser) return;

		this.shouldReconnect = true;
		this.clearReconnectTimer();

		if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
			return;
		}

		void this.openWithFreshTicket();
	}

	send(data: unknown) {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(data));
		}
	}

	disconnect() {
		this.shouldReconnect = false;
		this.clearReconnectTimer();

		if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
			this.socket.close(1000, 'client disconnect');
		}

		this.socket = null;
		this.status = 'disconnected';
	}

	destroy() {
		this.disconnect();
		if (browser) {
			window.removeEventListener('auth:refresh', this.handleAuthRefresh);
		}
	}

	private readonly handleAuthRefresh = () => {
		if (!this.shouldReconnect) {
			return;
		}

		debugLog('auth refresh detected; reconnecting websocket');
		if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
			this.socket.close(1000, 'auth refreshed');
		}
		this.socket = null;
		void this.openWithFreshTicket();
	};

	private async requestTicket(): Promise<WsTicketData> {
		const response = await api.post<ApiEnvelope<WsTicketData>>('/auth/ws-ticket', {});
		if (!response.success) {
			throw new Error(response.message || 'Failed to request websocket ticket');
		}

		return response.data;
	}

	private async openWithFreshTicket() {
		if (!browser || !this.shouldReconnect || this.socket) {
			return;
		}

		this.status = 'connecting';

		let ticket: WsTicketData;
		try {
			ticket = await this.requestTicket();
		} catch (error) {
			if (isUnauthorizedError(error)) {
				debugLog('ticket request unauthorized; stopping websocket');
				this.shouldReconnect = false;
				this.status = 'error';
				this.clearReconnectTimer();
				return;
			}

			debugLog('ticket request failed', error);
			this.status = 'error';
			this.scheduleReconnect();
			return;
		}

		const endpoint = joinUrl(this.wsBaseUrl, ticket.ws_path);
		const socketUrl = `${endpoint}?ticket=${encodeURIComponent(ticket.ticket)}`;
		const socket = new WebSocket(socketUrl);
		this.socket = socket;

		socket.onopen = () => {
			this.reconnectAttempts = 0;
			this.status = 'connected';
			debugLog('connected', { expiresAt: ticket.expires_at });
		};

		socket.onmessage = (event) => {
			void this.handleMessage(event.data);
		};

		socket.onerror = (event) => {
			debugLog('socket error event', event);
		};

		socket.onclose = (event) => {
			if (this.socket === socket) {
				this.socket = null;
			}

			if (!this.shouldReconnect) {
				this.status = 'disconnected';
				return;
			}

			this.status = 'disconnected';
			debugLog('socket closed', { code: event.code, reason: event.reason });

			this.scheduleReconnect();
		};
	}

	private async handleMessage(payload: string | Blob | ArrayBuffer | ArrayBufferView) {
		let textPayload: string;

		if (typeof payload === 'string') {
			textPayload = payload;
		} else if (payload instanceof Blob) {
			textPayload = await payload.text();
		} else if (payload instanceof ArrayBuffer) {
			textPayload = new TextDecoder().decode(payload);
		} else {
			textPayload = new TextDecoder().decode(
				new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)
			);
		}

		try {
			const parsedMessages = parseJsonObjects(textPayload);
			for (const parsedMessage of parsedMessages) {
				this.messages.push(parsedMessage);
			}
			if (this.messages.length > this.maxMessages) {
				this.messages.splice(0, this.messages.length - this.maxMessages);
			}
		} catch (error) {
			debugLog('failed to parse websocket message payload', error);
		}
	}

	private scheduleReconnect() {
		if (!this.shouldReconnect || this.reconnectTimer) {
			return;
		}

		const delay = getReconnectDelay(this.reconnectAttempts);
		this.reconnectAttempts += 1;
		this.status = 'retrying';
		debugLog('scheduling reconnect', { delay, attempt: this.reconnectAttempts });

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			void this.openWithFreshTicket();
		}, delay);
	}

	private clearReconnectTimer() {
		if (!this.reconnectTimer) {
			return;
		}

		clearTimeout(this.reconnectTimer);
		this.reconnectTimer = null;
	}
}

export function setWebSocketState(wsBaseUrl?: string) {
	const ws = new WebSocketManager(wsBaseUrl);
	setContext(WS_KEY, ws);
	return ws;
}

export function getWebSocketState() {
	return getContext<WebSocketManager>(WS_KEY);
}
