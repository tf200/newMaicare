import type {
	DepartmentItem,
	GetOrganizationProfileResponse,
	ListRolesApiResponse,
	PermissionGroupResponse
} from '$lib/types/api';
import type {
	Department,
	OrganizationProfile,
	PermissionGrant,
	PermissionGroup,
	Role
} from './types';

export function mapOrganizationProfile(data: GetOrganizationProfileResponse): OrganizationProfile {
	return {
		name: data.name,
		timezone: data.default_timezone,
		address: {
			street: data.hq_street,
			houseNumber: data.hq_house_number,
			houseNumberAddition: data.hq_house_number_addition,
			postalCode: data.hq_postal_code,
			city: data.hq_city
		},
		contact: {
			email: data.email,
			phone: data.phone_number,
			website: data.website
		}
	};
}

export function mapRole(role: ListRolesApiResponse, permissions: PermissionGrant[] = []): Role {
	return {
		id: role.id,
		name: role.role_name,
		description: role.description,
		permissions,
		userCount: role.employee_count,
		permissionCount: role.permission_count
	};
}

export function mapDepartment(item: DepartmentItem): Department {
	return {
		id: item.id,
		name: item.name,
		description: item.description ?? '',
		head: item.department_head_employee_id ?? null,
		employeeCount: item.employee_count ?? 0
	};
}

export function mapPermissionGroups(groups: PermissionGroupResponse[]): PermissionGroup[] {
	return groups.map((group) => ({
		id: group.group_key,
		label: group.group_label,
		permissions: group.sections.flatMap((section) =>
			section.permissions.map((permission) => ({
				id: permission.permission_id,
				name: permission.permission_name,
				label: permission.display_name,
				description: permission.description ?? '',
				isScoped: permission.is_scoped
			}))
		)
	}));
}
