import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateOrganizationRequest,
	CreateLocationRequest,
	GetOrganizationResponse,
	GlobalOrganizationCounts,
	OrganizationListItem,
	OrganizationCounts,
	OrganizationLocation,
	PaginatedResponse,
	UpdateOrganizationRequest,
	UpdateLocationRequest,
	LocationShift
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
	const endpoint = query ? `/organizations?${query}` : '/organisations';

	return api.get<ApiEnvelope<PaginatedResponse<OrganizationListItem>>>(endpoint);
}

export function createOrganization(payload: CreateOrganizationRequest) {
	return api.post<ApiEnvelope<OrganizationListItem>>('/organizations', payload);
}

export function getOrganization(id: string) {
	return api.get<ApiEnvelope<GetOrganizationResponse>>(`/organizations/${id}`);
}

export function updateOrganization(id: string, payload: UpdateOrganizationRequest) {
	return api.put<ApiEnvelope<GetOrganizationResponse>>(`/organizations/${id}`, payload);
}

export function getOrganizationCounts(id: string) {
	return api.get<ApiEnvelope<OrganizationCounts>>(`/organizations/${id}/counts`);
}

export function getGlobalOrganizationCounts() {
	return api.get<ApiEnvelope<GlobalOrganizationCounts>>('/organizations/count');
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
	return api.post<ApiEnvelope<OrganizationLocation>>(`/organizations/${id}/locations`, payload);
}

export function getLocation(id: string) {
	return api.get<ApiEnvelope<OrganizationLocation>>(`/locations/${id}`);
}

export function updateLocation(id: string, payload: UpdateLocationRequest) {
	return api.put<ApiEnvelope<OrganizationLocation>>(`/locations/${id}`, payload);
}

export function createLocationShift(
	locationId: string,
	payload: { shift: string; start_time: string; end_time: string }
) {
	return api.post<ApiEnvelope<LocationShift>>(`/locations/${locationId}/shifts`, payload);
}

export function updateLocationShift(
	locationId: string,
	shiftId: string,
	payload: { shift: string; start_time: string; end_time: string }
) {
	return api.put<ApiEnvelope<LocationShift>>(`/locations/${locationId}/shifts/${shiftId}`, payload);
}

export function updateLocationShifts(id: string, shifts: LocationShift[]) {
	return api.post<ApiEnvelope<OrganizationLocation>>(`/locations/${id}/shifts`, shifts);
}
