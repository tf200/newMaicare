import type { PaginatedResponse } from './common';

export interface GetOrganizationProfileResponse {
	created_at: string;
	default_timezone: string;
	email: string;
	hq_city: string;
	hq_house_number: string;
	hq_house_number_addition: string;
	hq_postal_code: string;
	hq_street: string;
	name: string;
	phone_number: string;
	updated_at: string;
	website: string;
}

export interface UpdateOrganizationProfileRequest {
	default_timezone: string;
	email?: string;
	hq_city?: string;
	hq_house_number?: string;
	hq_house_number_addition?: string;
	hq_postal_code?: string;
	hq_street?: string;
	name: string;
	phone_number?: string;
	website?: string;
}

export interface CreateDepartmentRequest {
	department_head_employee_id?: string | null;
	description?: string;
	name: string;
}

export interface UpdateDepartmentRequest {
	department_head_employee_id?: string | null;
	description?: string;
	name?: string;
}

export interface DepartmentItem {
	department_head_employee_id?: string;
	description?: string;
	employee_count?: number;
	id: string;
	name: string;
}

export type ListDepartmentsResponse = PaginatedResponse<DepartmentItem>;

export interface CreateDepartmentResponse {
	department_head_employee_id?: string;
	description?: string;
	id: string;
	name: string;
}

export interface UpdateDepartmentResponse {
	department_head_employee_id?: string;
	description?: string;
	id: string;
	name: string;
}

export interface ListRolesApiResponse {
	description: string;
	employee_count: number;
	id: string;
	permission_count: number;
	role_name: string;
}

export interface CreateRoleRequest {
	description?: string;
	name: string;
}

export interface CreateRoleResponse {
	description?: string;
	name: string;
	role_id: string;
}

export interface RolePermission {
	is_scoped: boolean;
	permission_id: string;
	permission_name: string;
	role_id: string;
	scope: PermissionScope | null;
}

export type ListAllRolePermissionsApiResponse = RolePermission;

export type PermissionScope = 'assigned' | 'all';

export interface PermissionGrantRequest {
	permission_id: string;
	scope: PermissionScope | null;
}

export interface AddPermissionsToRoleRequest {
	permissions: PermissionGrantRequest[];
}

export interface AddPermissionsToRoleResponse {
	permissions: PermissionGrantRequest[];
	role_id: string;
}

export interface SystemPermission {
	description: string | null;
	display_name: string;
	is_scoped: boolean;
	permission_id: string;
	permission_name: string;
}

export type ListAllPermissionsApiResponse = SystemPermission;

export interface PermissionSectionResponse {
	permissions: SystemPermission[];
	section_key: string;
	section_label: string;
}

export interface PermissionGroupResponse {
	group_key: string;
	group_label: string;
	sections: PermissionSectionResponse[];
}

export interface PermissionInfo {
	id: string;
	name: string;
}

export type PermissionOverrideInfo = PermissionInfo;

export interface RoleInfo {
	id: string;
	name: string;
}

export interface ListUserRolesAndPermissionsApiResponse {
	effective_permissions: PermissionInfo[];
	inherited_permissions: PermissionInfo[];
	override_allows: PermissionInfo[];
	override_denies: PermissionInfo[];
	role: RoleInfo;
}

export interface AssignRoleToEmployeeParams {
	role_id: string;
}

export interface ReplaceUserPermissionOverridesRequest {
	allow_permission_ids?: string[];
	deny_permission_ids?: string[];
}
