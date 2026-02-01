import { api } from '$lib/api/client';
import type { ApiEnvelope, PaginatedResponse, SenderListItem } from '$lib/types/api';

export interface ListSendersParams {
	page?: number;
	pageSize?: number;
	includeArchived?: boolean;
	search?: string;
}

export function listSenders(params: ListSendersParams = {}) {
	const searchParams = new URLSearchParams();

	if (params.page) {
		searchParams.set('page', String(params.page));
	}
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
