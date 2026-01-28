import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { readAuthStorage } from '$lib/state/auth.svelte';

export const ssr = false;
export const prerender = false;
export const trailingSlash = 'always';

const publicPaths = new Set(['/login', '/register', '/forgot-password', '/2fa']);

const normalizePath = (pathname: string) =>
	pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

export const load: LayoutLoad = ({ url }) => {
	const path = normalizePath(url.pathname);
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

	return {};
};
