import type { PageLoad } from './$types';
import type {
	Department,
	EmployeeOption,
	OrganizationProfile,
	PermissionGroup,
	Role,
	SystemSettings
} from './types';
import type {
	DepartmentItem,
	GetOrganizationProfileResponse,
	ListRolesApiResponse,
	PermissionGroupResponse
} from '$lib/types/api';
import { getOrganizationProfile } from '$lib/api/settings';

const emptyOrganization: OrganizationProfile = {
	name: '',
	timezone: 'Europe/Amsterdam',
	address: {
		street: '',
		number: '',
		postalCode: '',
		city: '',
		country: ''
	},
	contact: {
		email: '',
		phone: '',
		website: ''
	}
};

export function _mapOrganizationProfile(data: GetOrganizationProfileResponse): OrganizationProfile {
	const houseNumber = [data.hq_house_number, data.hq_house_number_addition]
		.filter(Boolean)
		.join(' ');

	return {
		name: data.name,
		timezone: data.default_timezone,
		address: {
			street: data.hq_street,
			number: houseNumber,
			postalCode: data.hq_postal_code,
			city: data.hq_city,
			country: 'Netherlands'
		},
		contact: {
			email: data.email,
			phone: data.phone_number,
			website: data.website
		}
	};
}

export function _mapRole(role: ListRolesApiResponse, permissions: string[]): Role {
	return {
		id: role.id,
		name: role.role_name,
		description: role.description,
		permissions,
		userCount: role.employee_count,
		permissionCount: role.permission_count
	};
}

export function _mapDepartment(item: DepartmentItem): Department {
	return {
		id: item.id,
		name: item.name,
		description: item.description ?? '',
		head: item.department_head_employee_id ?? null,
		employeeCount: 0
	};
}

export function _mapPermissionGroups(groups: PermissionGroupResponse[]): PermissionGroup[] {
	return groups.map((group) => {
		const permissions = group.sections
			.flatMap((section) => section.permissions)
			.sort((a, b) => a.sort_order - b.sort_order)
			.map((permission) => ({
				id: permission.permission_id,
				label: permission.display_name,
				description: permission.description,
				resource: permission.permission_resource
			}));

		return {
			id: group.group_key,
			label: group.group_label,
			permissions
		};
	});
}

export interface SystemSettingsLoadResult {
	systemSettings: SystemSettings;
	permissionGroups: PermissionGroup[];
	rolePermissionsByRoleId: Record<string, string[]>;
	employees: EmployeeOption[];
	loadError: string | null;
}

export interface SystemSettingsPageData {
	initial: SystemSettingsLoadResult;
	systemData: Promise<SystemSettingsLoadResult>;
}

const defaultSecuritySettings: SystemSettings['security'] = {
	auditLogRetentionDays: 90,
	sessionTimeoutMinutes: 30,
	requireTwoFactor: true,
	passwordComplexity: {
		minLength: 12,
		requireNumbers: true,
		requireSymbols: true,
		requireUppercase: true
	}
};

const defaultIntegrations: SystemSettings['integrations'] = [
	{
		id: '1',
		name: 'SendGrid',
		status: 'connected',
		lastSync: '2024-03-05T10:00:00Z',
		description: 'Email delivery service for notifications and reports.'
	},
	{
		id: '2',
		name: 'Twilio',
		status: 'disconnected',
		description: 'SMS gateway for two-factor authentication and alerts.'
	},
	{
		id: '3',
		name: 'AFAS Sync',
		status: 'pending',
		description: 'External HR and payroll synchronization.'
	}
];

export const _createInitialSystemSettings = (): SystemSettingsLoadResult => ({
	systemSettings: {
		organization: emptyOrganization,
		roles: [],
		departments: [],
		security: defaultSecuritySettings,
		integrations: defaultIntegrations
	},
	permissionGroups: [],
	rolePermissionsByRoleId: {},
	employees: [],
	loadError: null
});

export const load: PageLoad = () => {
	const systemData: Promise<SystemSettingsLoadResult> = getOrganizationProfile()
		.then((response) => ({
			..._createInitialSystemSettings(),
			systemSettings: {
				..._createInitialSystemSettings().systemSettings,
				organization: _mapOrganizationProfile(response.data)
			}
		}))
		.catch(
			(error): SystemSettingsLoadResult => ({
				..._createInitialSystemSettings(),
				loadError: error instanceof Error ? error.message : 'Failed to load system settings.'
			})
		);

	return {
		initial: _createInitialSystemSettings(),
		systemData
	} satisfies SystemSettingsPageData;
};
