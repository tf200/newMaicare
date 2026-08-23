import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getEmployee, type EmployeeDetail } from '$lib/api/employees';
import { listRoles, type RoleListItem } from '$lib/api/roles';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { getAuthState } from '$lib/state/auth.svelte';

export interface EmployeeDetailLoadResult {
	employee: EmployeeDetail | null;
	loadError: string | null;
}

export interface EmployeeRolesLoadResult {
	roles: RoleListItem[];
	loadError: string | null;
}

export const load: PageLoad = ({ params, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.EMPLOYEE.VIEW)) {
		error(403, m.no_permission_view_employee());
	}

	depends('app:employees:detail');
	const options = { fetchFn: fetch };
	const employeeData: Promise<EmployeeDetailLoadResult> = getEmployee(params.id, options)
		.then((response) => ({
			employee: response.data,
			loadError: null
		}))
		.catch((error): EmployeeDetailLoadResult => {
			const message = error instanceof Error ? error.message : m.failed_load_employee();

			return {
				employee: null,
				loadError: message
			};
		});
	const rolesData: Promise<EmployeeRolesLoadResult> | null =
		auth.hasPermission(PERMISSIONS.ROLES.ASSIGN) && auth.hasPermission(PERMISSIONS.ROLES.VIEW)
			? listRoles(options)
					.then((response) => ({ roles: response.data, loadError: null }))
					.catch((error): EmployeeRolesLoadResult => ({
						roles: [],
						loadError: error instanceof Error ? error.message : m.failed_load_roles()
					}))
			: null;

	return {
		employeeData,
		rolesData
	};
};
