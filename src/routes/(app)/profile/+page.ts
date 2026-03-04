import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime';

export function load() {
	throw redirect(307, localizeHref('/settings'));
}
