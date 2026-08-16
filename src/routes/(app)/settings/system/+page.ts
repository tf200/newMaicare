import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import {
	getOrganizationProfile,
	listDepartments,
	listPermissionGroups,
	listRoles
} from '$lib/api/settings';
import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
import { mapDepartment, mapOrganizationProfile, mapPermissionGroups, mapRole } from './mappers';
import type {
	Department,
	EmployeeOption,
	OrganizationProfile,
	PermissionGroup,
	Role,
	SystemSettingsTab
} from './types';

export interface OrganizationLoadResult {
	organization: OrganizationProfile | null;
	loadError: string | null;
}

export interface RolesLoadResult {
	roles: Role[];
	loadError: string | null;
}

export interface PermissionGroupsLoadResult {
	permissionGroups: PermissionGroup[];
	loadError: string | null;
}

export interface DepartmentsLoadResult {
	departments: Department[];
	loadError: string | null;
}

export interface EmployeesLoadResult {
	employees: EmployeeOption[];
	loadError: string | null;
}

export interface SystemSettingsPageData {
	initial: { tab: SystemSettingsTab };
	organizationData: Promise<OrganizationLoadResult> | null;
	rolesData: Promise<RolesLoadResult> | null;
	permissionGroupsData: Promise<PermissionGroupsLoadResult> | null;
	departmentsData: Promise<DepartmentsLoadResult> | null;
	employeesData: Promise<EmployeesLoadResult> | null;
}

const tabs = new Set<SystemSettingsTab>(['organization', 'roles', 'departments']);
const message = (reason: unknown, fallback: string) =>
	reason instanceof Error ? reason.message : fallback;

export const load: PageLoad = ({ url, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.SETTINGS.VIEW)) {
		error(403, 'You do not have permission to view system settings.');
	}

	const requestedTab = url.searchParams.get('tab') as SystemSettingsTab | null;
	const permittedTabs: SystemSettingsTab[] = [];
	if (auth.hasPermission(PERMISSIONS.SETTINGS.ORGANIZATION_PROFILE.VIEW)) {
		permittedTabs.push('organization');
	}
	if (
		auth.hasPermission(PERMISSIONS.ROLES.VIEW) &&
		auth.hasPermission(PERMISSIONS.PERMISSION.VIEW)
	) {
		permittedTabs.push('roles');
	}
	if (auth.hasPermission(PERMISSIONS.SETTINGS.DEPARTMENT.VIEW)) {
		permittedTabs.push('departments');
	}
	const tab =
		requestedTab && tabs.has(requestedTab) && permittedTabs.includes(requestedTab)
			? requestedTab
			: (permittedTabs[0] ?? 'organization');
	const options = { fetchFn: fetch };
	const loadSection = <T>(dependency: `${string}:${string}`, request: () => Promise<T>) => {
		depends(dependency);
		return request();
	};

	const organizationData =
		tab === 'organization'
			? loadSection('app:settings-system:organization', () => getOrganizationProfile(options))
					.then((response): OrganizationLoadResult => ({
						organization: mapOrganizationProfile(response.data),
						loadError: null
					}))
					.catch((reason): OrganizationLoadResult => ({
						organization: null,
						loadError: message(reason, 'Failed to load the organization profile.')
					}))
			: null;

	const rolesData =
		tab === 'roles'
			? loadSection('app:settings-system:roles', () => listRoles(options))
					.then((response): RolesLoadResult => ({
						roles: response.data.map((role) => mapRole(role)),
						loadError: null
					}))
					.catch((reason): RolesLoadResult => ({
						roles: [],
						loadError: message(reason, 'Failed to load roles.')
					}))
			: null;

	const permissionGroupsData =
		tab === 'roles' && auth.hasPermission(PERMISSIONS.PERMISSION.VIEW)
			? loadSection('app:settings-system:permissions', () => listPermissionGroups(options))
					.then((response): PermissionGroupsLoadResult => ({
						permissionGroups: mapPermissionGroups(response.data),
						loadError: null
					}))
					.catch((reason): PermissionGroupsLoadResult => ({
						permissionGroups: [],
						loadError: message(reason, 'Failed to load permissions.')
					}))
			: null;

	const departmentsData =
		tab === 'departments'
			? loadSection('app:settings-system:departments', () => listDepartments({}, options))
					.then((response): DepartmentsLoadResult => ({
						departments: response.data.results.map(mapDepartment),
						loadError: null
					}))
					.catch((reason): DepartmentsLoadResult => ({
						departments: [],
						loadError: message(reason, 'Failed to load departments.')
					}))
			: null;

	const employeesData =
		tab === 'departments' && auth.hasPermission(PERMISSIONS.EMPLOYEE.VIEW)
			? loadSection('app:settings-system:employees', () =>
					listEmployees({ page: 1, page_size: 100 }, { fetchFn: fetch })
				)
					.then((response): EmployeesLoadResult => ({
						employees: response.data.results.map((employee: EmployeeListItem) => ({
							id: employee.id,
							name: `${employee.first_name} ${employee.last_name}`.trim()
						})),
						loadError: null
					}))
					.catch((reason): EmployeesLoadResult => ({
						employees: [],
						loadError: message(reason, 'Failed to load employees.')
					}))
			: null;

	return {
		initial: { tab },
		organizationData,
		rolesData,
		permissionGroupsData,
		departmentsData,
		employeesData
	} satisfies SystemSettingsPageData;
};
