import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
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

export function putClientInCare(id: string, payload: PutClientInCareRequest) {
	return api.put<ApiEnvelope<unknown>>(`/clients/${id}/put-in-care`, payload);
}
