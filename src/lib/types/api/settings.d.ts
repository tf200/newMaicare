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
	department_head_employee_id?: string;
	description?: string;
	name: string;
}

export interface UpdateDepartmentRequest {
	department_head_employee_id?: string;
	description?: string;
	name?: string;
}

export interface DepartmentItem {
	department_head_employee_id?: string;
	description?: string;
	id: string;
	name: string;
}

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

export interface ListAllRolePermissionsApiResponse {
	permission_id: string;
	permission_name: string;
	permission_resource: string;
	role_id: string;
}

export interface AddPermissionsToRoleRequest {
	permission_ids: string[];
}

export interface AddPermissionsToRoleResponse {
	permission_ids: string[];
	role_id: string;
}

export interface PermissionGroupResponse {
	group_key: string;
	group_label: string;
	sections: PermissionSectionResponse[];
}

export interface PermissionSectionResponse {
	permissions: ListAllPermissionsApiResponse[];
	section_key: string;
	section_label: string;
}

export interface ListAllPermissionsApiResponse {
	description: string;
	display_name: string;
	permission_id: string;
	permission_name: string;
	permission_resource: string;
	sort_order: number;
}

export interface PermissionInfo {
	id: string;
	name: string;
	resource: string;
}

export interface PermissionOverrideInfo {
	id: string;
	name: string;
	resource: string;
}

export interface RoleInfo {
	id: string;
	name: string;
}

export interface ListUserRolesAndPermissionsApiResponse {
	effective_permissions: PermissionInfo[];
	inherited_permissions: PermissionInfo[];
	override_allows: PermissionOverrideInfo[];
	override_denies: PermissionOverrideInfo[];
	role: RoleInfo;
}

export interface AssignRoleToEmployeeParams {
	role_id: string;
}

export interface ReplaceUserPermissionOverridesRequest {
	allow_permission_ids?: string[];
	deny_permission_ids?: string[];
}
