import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	ListClientsData,
	ListClientsParams,
	ListInCareClientsParams,
	ListInCareClientsResponse,
	GetClientResponse,
	ListWaitingListClientsParams,
	ListWaitingListClientsResponse,
	PutClientInCareRequest,
	PaginatedResponse
} from '$lib/types/api';

export function listWaitingListClients(params: ListWaitingListClientsParams) {
	const searchParams = new URLSearchParams();

	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));
	searchParams.set('sort_days', params.sortDays ?? 'desc');

	if (params.search) {
		searchParams.set('search', params.search);
	}

	if (params.placement) {
		searchParams.set('placement', params.placement);
	}

	const query = searchParams.toString();

	return api.get<ApiEnvelope<PaginatedResponse<ListWaitingListClientsResponse>>>(
		`/clients/waiting-list?${query}`
	);
}

export function getClientById(id: string) {
	return api.get<ApiEnvelope<GetClientResponse>>(`/clients/${id}`);
}

export function putClientInCare(id: string, payload: PutClientInCareRequest) {
	return api.put<ApiEnvelope<unknown>>(`/clients/${id}/put-in-care`, payload);
}

export function listInCareClients(params: ListInCareClientsParams) {
	const searchParams = new URLSearchParams();

	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));
	searchParams.set('sort_days_in_care', params.sortDaysInCare ?? 'desc');

	if (params.search) {
		searchParams.set('search', params.search);
	}

	for (const status of params.status ?? []) {
		searchParams.append('status', status);
	}

	const query = searchParams.toString();

	return api.get<ApiEnvelope<PaginatedResponse<ListInCareClientsResponse>>>(
		`/clients/in-care?${query}`
	);
}

export function listClients(params: ListClientsParams) {
	const searchParams = new URLSearchParams();

	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	if (params.search) {
		searchParams.set('search', params.search);
	}

	if (params.status) {
		searchParams.set('status', params.status);
	}

	if (params.location_id) {
		searchParams.set('location_id', params.location_id);
	}

	const query = searchParams.toString();

	return api.get<ApiEnvelope<ListClientsData>>(`/clients?${query}`);
}
