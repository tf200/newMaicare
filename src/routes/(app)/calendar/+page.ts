import { error } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { getAuthState } from '$lib/state/auth.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.APPOINTMENT.VIEW)) {
		error(403, 'You do not have permission to view this resource.');
	}

	return {
		initial: {
			employeeId: ''
		}
	};
};
