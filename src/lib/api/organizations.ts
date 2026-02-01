import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateOrganizationRequest,
	CreateLocationRequest,
	GetOrganizationResponse,
	OrganizationListItem,
	OrganizationCounts,
	OrganizationLocation,
	PaginatedResponse,
	UpdateOrganizationRequest
} from '$lib/types/api';

export interface ListOrganizationsParams {
	page?: number;
	pageSize?: number;
	name?: string;
}

export function listOrganizations(params: ListOrganizationsParams = {}) {
	const searchParams = new URLSearchParams();

	if (params.page) {
		searchParams.set('page', String(params.page));
	}
	if (params.pageSize) {
		searchParams.set('page_size', String(params.pageSize));
	}
	if (params.name) {
		searchParams.set('name', params.name);
	}

	const query = searchParams.toString();
	const endpoint = query ? `/organisations?${query}` : '/organisations';

	return api.get<ApiEnvelope<PaginatedResponse<OrganizationListItem>>>(endpoint);
}

export function createOrganization(payload: CreateOrganizationRequest) {
	return api.post<ApiEnvelope<OrganizationListItem>>('/organisations', payload);
}

export function getOrganization(id: string) {
	return api.get<ApiEnvelope<GetOrganizationResponse>>(`/organisations/${id}`);
}

export function updateOrganization(id: string, payload: UpdateOrganizationRequest) {
	return api.put<ApiEnvelope<GetOrganizationResponse>>(`/organisations/${id}`, payload);
}

export function getOrganizationCounts(id: string) {
	return api.get<ApiEnvelope<OrganizationCounts>>(`/organisations/${id}/counts`);
}

export interface ListOrganizationLocationsParams {
	page?: number;
	pageSize?: number;
	name?: string;
}

export function listOrganizationLocations(
	id: string,
	params: ListOrganizationLocationsParams = {}
) {
	const searchParams = new URLSearchParams();

	if (params.page) {
		searchParams.set('page', String(params.page));
	}
	if (params.pageSize) {
		searchParams.set('page_size', String(params.pageSize));
	}
	if (params.name) {
		searchParams.set('name', params.name);
	}

	const query = searchParams.toString();
	const endpoint = query
		? `/organisations/${id}/locations?${query}`
		: `/organisations/${id}/locations`;

	return api.get<ApiEnvelope<PaginatedResponse<OrganizationLocation>>>(endpoint);
}

export function createOrganizationLocation(id: string, payload: CreateLocationRequest) {
	return api.post<ApiEnvelope<OrganizationLocation>>(`/organisations/${id}/locations`, payload);
}
