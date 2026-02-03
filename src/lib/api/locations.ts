import { api } from '$lib/api/client';
import type { PaginatedResponse, OrganizationLocation, ApiEnvelope } from '$lib/types/api';

export interface ListLocationsParams {
	page?: number;
	pageSize?: number;
	search?: string;
}

export function listLocations(params: ListLocationsParams = {}) {
	const query = new URLSearchParams();
	query.append('page', (params.page || 1).toString());
	if (params.pageSize) query.append('page_size', params.pageSize.toString());
	if (params.search) query.append('search', params.search);

	return api.get<ApiEnvelope<PaginatedResponse<OrganizationLocation>>>(
		`/locations?${query.toString()}`
	);
}
