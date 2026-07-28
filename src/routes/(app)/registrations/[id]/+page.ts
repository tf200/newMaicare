import { getRegistrationForm } from '$lib/api/registration';
import type { GetRegistrationFormResponse } from '$lib/types/api';
import type { PageLoad } from './$types';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { error } from '@sveltejs/kit';

export interface RegistrationDetailLoadResult {
	registration: GetRegistrationFormResponse | null;
	loadError: string | null;
}

async function loadRegistrationDetail(
	id: string,
	fetchFn: typeof fetch
): Promise<RegistrationDetailLoadResult> {
	try {
		const response = await getRegistrationForm(id, { fetchFn });

		return {
			registration: response.data,
			loadError: null
		};
	} catch (error) {
		return {
			registration: null,
			loadError: error instanceof Error ? error.message : 'Failed to load registration.'
		};
	}
}

export const load: PageLoad = ({ params, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAnyPermission([PERMISSIONS.REGISTRATION_FORM.VIEW, PERMISSIONS.CARE_COORDINATION.VIEW])) {
		error(403, 'You do not have permission to view registration details.');
	}

	depends('app:registrations:detail');

	return {
		registrationData: loadRegistrationDetail(params.id, fetch)
	};
};
