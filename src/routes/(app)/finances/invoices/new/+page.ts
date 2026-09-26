import type { PageLoad } from './$types';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';

export const load: PageLoad = () => {
	if (!getAuthState().hasPermission(PERMISSIONS.INVOICE.CREATE)) {
		error(403, m.invoices_create_access_denied());
	}
	return {};
};
