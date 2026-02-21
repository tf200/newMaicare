import { api } from '$lib/api/client';
import type {
	PaginatedResponse,
	OrganizationLocation,
	ApiEnvelope,
	LocationScheduleDay
} from '$lib/types/api';

export interface ListLocationsParams {
	page?: number;
	pageSize?: number;
	search?: string;
}

export interface GetLocationSchedulesParams {
	startDate: string;
	endDate: string;
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

export function getLocationSchedules(locationId: string, params: GetLocationSchedulesParams) {
	const query = new URLSearchParams();
	query.set('start_date', params.startDate);
	query.set('end_date', params.endDate);

	return api.get<ApiEnvelope<LocationScheduleDay[]>>(
		`/locations/${locationId}/schedules?${query.toString()}`
	);
}
