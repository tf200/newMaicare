import { redirect, type Handle } from '@sveltejs/kit';
import { readAuthStorage } from '$lib/state/auth.svelte';

const publicPaths = new Set(['/login', '/register', '/forgot-password', '/2fa']);

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const { accessToken, requires2fa } = readAuthStorage();

	if (requires2fa && path !== '/2fa') {
		throw redirect(307, '/2fa');
	}

	const isAuthenticated = Boolean(accessToken) && !requires2fa;

	if (isAuthenticated && (path === '/' || publicPaths.has(path))) {
		throw redirect(307, '/dashboard');
	}

	if (!isAuthenticated && !publicPaths.has(path)) {
		throw redirect(307, '/login');
	}

	return resolve(event);
};

export const handleError = ({ error }: { error: unknown }) => {
	console.error(error);
};

export const init = async () => {};
