import { getContext, setContext } from 'svelte';

const TOAST_KEY = Symbol('TOAST');
const DEFAULT_DURATION = 4000;

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastMessage {
	message: string;
	type: ToastType;
}

export class ToastState {
	current = $state<ToastMessage | null>(null);
	private timer: ReturnType<typeof setTimeout> | null = null;

	show = (message: string, type: ToastType = 'success', duration = DEFAULT_DURATION) => {
		this.clearTimer();
		this.current = { message, type };
		this.timer = setTimeout(() => {
			this.current = null;
			this.timer = null;
		}, duration);
	};

	success = (message: string) => this.show(message, 'success');
	warning = (message: string) => this.show(message, 'warning');
	error = (message: string) => this.show(message, 'error');

	close = () => {
		this.clearTimer();
		this.current = null;
	};

	destroy = () => this.close();

	private clearTimer() {
		if (!this.timer) return;
		clearTimeout(this.timer);
		this.timer = null;
	}
}

export function setToastState(): ToastState {
	const state = new ToastState();
	setContext(TOAST_KEY, state);
	return state;
}

export function getToastState(): ToastState {
	return getContext<ToastState>(TOAST_KEY);
}
