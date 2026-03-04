import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateIncidentRequest,
	IncidentCountsResponse,
	IncidentDetailResponse,
	IncidentListItemResponse,
	ListIncidentsParams,
	PaginatedResponse
} from '$lib/types/api';

export function listIncidents(params: ListIncidentsParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	if (params.isConfirmed !== undefined) {
		searchParams.set('is_confirmed', String(params.isConfirmed));
	}

	const normalizedSearch = params.search?.trim();
	if (normalizedSearch) {
		searchParams.set('search', normalizedSearch);
	}

	const query = searchParams.toString();
	const endpoint = query ? `/incidents?${query}` : '/incidents';

	return api.get<ApiEnvelope<PaginatedResponse<IncidentListItemResponse>>>(endpoint);
}

export function getIncident(incidentId: string) {
	return api.get<ApiEnvelope<IncidentDetailResponse>>(`/incidents/${incidentId}`);
}

export function getIncidentCounts() {
	return api.get<ApiEnvelope<IncidentCountsResponse>>('/incidents/counts');
}

export function confirmIncident(incidentId: string) {
	return api.post<ApiEnvelope<unknown>>(`/incidents/${incidentId}/confirm`, {});
}

export function createIncident(clientId: string, payload: CreateIncidentRequest) {
	return api.post<ApiEnvelope<unknown>>(`/clients/${clientId}/incidents`, payload);
}

export function updateIncident(incidentId: string, payload: CreateIncidentRequest) {
	return api.put<ApiEnvelope<unknown>>(`/incidents/${incidentId}`, payload);
}
