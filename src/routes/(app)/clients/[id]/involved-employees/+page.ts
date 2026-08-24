import { listClientInvolvedEmployees } from '$lib/api/clients';
import { error } from '@sveltejs/kit';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import type { ClientInvolvedEmployee } from '$lib/types/api';
import type { PageLoad } from './$types';

export interface InvolvedEmployeesLoadResult {
	employees: ClientInvolvedEmployee[];
	loadError: string | null;
}

export const load: PageLoad = ({ params, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_VIEW)) {
		error(403, 'You do not have permission to view involved employees.');
	}
	depends(`app:client:${params.id}:involved-employees`);
	const involvedEmployeesData: Promise<InvolvedEmployeesLoadResult> = listClientInvolvedEmployees(
		params.id,
		{ fetchFn: fetch }
	)
		.then((response) => ({ employees: response.data?.results ?? [], loadError: null }))
		.catch((error) => ({
			employees: [],
			loadError: error instanceof Error ? error.message : m.failed_load_involved_employees()
		}));

	return { involvedEmployeesData };
};
