import { getContext, setContext } from 'svelte';
import { browser } from '$app/environment';

const WS_KEY = Symbol('WEBSOCKET');

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export class WebSocketManager {
	status = $state<WebSocketStatus>('disconnected');
	messages = $state<unknown[]>([]);
	private socket: WebSocket | null = null;
	private url: string;
	private reconnectInterval: number = 3000;

	constructor(url: string) {
		this.url = url;
	}

	connect() {
		if (!browser || this.socket) return;

		this.status = 'connecting';
		this.socket = new WebSocket(this.url);

		this.socket.onopen = () => {
			this.status = 'connected';
			console.log('WebSocket Connected');
		};

		this.socket.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.messages.push(data);
			} catch (e) {
				console.error('Failed to parse WebSocket message', e);
			}
		};

		this.socket.onclose = () => {
			this.status = 'disconnected';
			this.socket = null;
			// Simple reconnect logic
			setTimeout(() => this.connect(), this.reconnectInterval);
		};

		this.socket.onerror = (error) => {
			console.error('WebSocket Error', error);
			this.status = 'error';
		};
	}

	send(data: unknown) {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(data));
		} else {
			console.warn('WebSocket is not connected');
		}
	}

	disconnect() {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
			this.status = 'disconnected';
		}
	}
}

export function setWebSocketState(url: string) {
	const ws = new WebSocketManager(url);
	setContext(WS_KEY, ws);
	return ws;
}

export function getWebSocketState() {
	return getContext<WebSocketManager>(WS_KEY);
}
