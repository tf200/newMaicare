import { api } from '$lib/api/client';
import type { ApiEnvelope } from '$lib/types/api';

export interface RoleListItem {
	id: string;
	role_name: string;
	permission_count: number;
}

export function listRoles() {
	return api.get<ApiEnvelope<RoleListItem[]>>('/roles');
}
