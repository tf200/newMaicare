import {
	getClientCoordinator,
	listClientInvolvedEmployeeRoles,
	listClientInvolvedEmployees
} from '$lib/api/clients';
import { ApiClientError } from '$lib/api/client';
import { error } from '@sveltejs/kit';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import type {
	ClientCoordinatorAssignment,
	ClientInvolvedEmployee,
	ClientInvolvedEmployeeRole
} from '$lib/types/api';
import type { PageLoad } from './$types';

export interface InvolvedEmployeesLoadResult {
	employees: ClientInvolvedEmployee[];
	loadError: string | null;
}

export interface InvolvedEmployeeRolesLoadResult {
	roles: ClientInvolvedEmployeeRole[];
	loadError: string | null;
}

export interface CoordinatorLoadResult {
	coordinator: ClientCoordinatorAssignment | null;
	loadError: string | null;
}

export const load: PageLoad = ({ params, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_VIEW)) {
		error(403, 'You do not have permission to view involved employees.');
	}
	depends(`app:client:${params.id}:involved-employees`);
	depends(`app:client:${params.id}:coordinator`);
	depends('app:involved-employee-roles');
	const involvedEmployeesData: Promise<InvolvedEmployeesLoadResult> = listClientInvolvedEmployees(
		params.id,
		{ fetchFn: fetch }
	)
		.then((response) => ({ employees: response.data?.results ?? [], loadError: null }))
		.catch((error) => ({
			employees: [],
			loadError: error instanceof Error ? error.message : m.failed_load_involved_employees()
		}));

	const rolesData: Promise<InvolvedEmployeeRolesLoadResult> = listClientInvolvedEmployeeRoles({
		fetchFn: fetch
	})
		.then((response) => ({ roles: response.data ?? [], loadError: null }))
		.catch((error) => ({
			roles: [],
			loadError: error instanceof Error ? error.message : m.failed_load_involved_employee_roles()
		}));
	const coordinatorData: Promise<CoordinatorLoadResult> = getClientCoordinator(params.id, {
		fetchFn: fetch
	})
		.then((response) => ({ coordinator: response.data, loadError: null }))
		.catch((error) => {
			if (error instanceof ApiClientError && error.status === 404)
				return { coordinator: null, loadError: null };
			return {
				coordinator: null,
				loadError: error instanceof Error ? error.message : m.failed_load_coordinator()
			};
		});

	return { involvedEmployeesData, rolesData, coordinatorData };
};
