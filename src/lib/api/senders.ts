import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateSenderRequest,
	GetSenderByIdResponse,
	PaginatedResponse,
	SenderListItem,
	UpdateSenderRequest,
	UpdateSenderResponse
} from '$lib/types/api';

export interface ListSendersParams {
	page?: number;
	pageSize?: number;
	includeArchived?: boolean;
	search?: string;
}

export function listSenders(params: ListSendersParams = {}) {
	const searchParams = new URLSearchParams();

	searchParams.set('page', String(params.page || 1));
	if (params.pageSize) {
		searchParams.set('page_size', String(params.pageSize));
	}
	if (params.includeArchived != null) {
		searchParams.set('include_archived', String(params.includeArchived));
	}
	if (params.search) {
		searchParams.set('search', params.search);
	}

	const query = searchParams.toString();
	const endpoint = query ? `/senders?${query}` : '/senders';

	return api.get<ApiEnvelope<PaginatedResponse<SenderListItem>>>(endpoint);
}

export function getSenderById(id: string) {
	return api.get<ApiEnvelope<GetSenderByIdResponse>>(`/senders/${id}`);
}

export function createSender(payload: CreateSenderRequest) {
	return api.post<ApiEnvelope<SenderListItem>>('/senders', payload);
}

export function updateSender(id: string, payload: UpdateSenderRequest) {
	return api.patch<ApiEnvelope<UpdateSenderResponse>>(`/senders/${id}`, payload);
}
