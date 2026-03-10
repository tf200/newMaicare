import { api } from '$lib/api/client';
import type { ApiEnvelope } from '$lib/types/api';
import type {
	AddPermissionsToRoleRequest,
	AddPermissionsToRoleResponse,
	CreateDepartmentRequest,
	CreateDepartmentResponse,
	CreateRoleRequest,
	CreateRoleResponse,
	GetOrganizationProfileResponse,
	ListDepartmentsResponse,
	ListAllRolePermissionsApiResponse,
	ListRolesApiResponse,
	PermissionGroupResponse,
	UpdateDepartmentRequest,
	UpdateDepartmentResponse,
	UpdateOrganizationProfileRequest
} from '$lib/types/api';

export function getOrganizationProfile() {
	return api.get<ApiEnvelope<GetOrganizationProfileResponse>>('/settings/organization-profile');
}

export function updateOrganizationProfile(payload: UpdateOrganizationProfileRequest) {
	return api.put<ApiEnvelope<GetOrganizationProfileResponse>>(
		'/settings/organization-profile',
		payload
	);
}

export function listRoles() {
	return api.get<ApiEnvelope<ListRolesApiResponse[]>>('/roles');
}

export function createRole(payload: CreateRoleRequest) {
	return api.post<ApiEnvelope<CreateRoleResponse>>('/roles', payload);
}

export function listPermissionGroups() {
	return api.get<ApiEnvelope<PermissionGroupResponse[]>>('/permissions');
}

export function listRolePermissions(roleId: string) {
	return api.get<ApiEnvelope<ListAllRolePermissionsApiResponse[]>>(`/roles/${roleId}/permissions`);
}

export function addPermissionsToRole(roleId: string, payload: AddPermissionsToRoleRequest) {
	return api.post<ApiEnvelope<AddPermissionsToRoleResponse>>(
		`/roles/${roleId}/permissions`,
		payload
	);
}

export function listDepartments() {
	return api.get<ApiEnvelope<ListDepartmentsResponse>>('/settings/departments');
}

export function createDepartment(payload: CreateDepartmentRequest) {
	return api.post<ApiEnvelope<CreateDepartmentResponse>>('/settings/departments', payload);
}

export function updateDepartment(id: string, payload: UpdateDepartmentRequest) {
	return api.put<ApiEnvelope<UpdateDepartmentResponse>>(`/settings/departments/${id}`, payload);
}
