import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateContractRequest,
	CreateContractResponse,
	GetContractResponse,
	ListContractsParams,
	ListContractsResponse,
	PaginatedResponse
} from '$lib/types/api';

export function listContracts(params: ListContractsParams = {}) {
	const searchParams = new URLSearchParams();

	searchParams.set('page', String(params.page ?? 1));
	searchParams.set('page_size', String(params.pageSize ?? 10));

	if (params.search) searchParams.set('search', params.search);
	if (params.client_name) searchParams.set('client_name', params.client_name);
	if (params.sender_name) searchParams.set('sender_name', params.sender_name);
	if (params.end_date_from) searchParams.set('end_date_from', params.end_date_from);
	if (params.end_date_to) searchParams.set('end_date_to', params.end_date_to);

	for (const status of params.status ?? []) {
		searchParams.append('status', status);
	}

	for (const careType of params.care_type ?? []) {
		searchParams.append('care_type', careType);
	}

	for (const financingAct of params.financing_act ?? []) {
		searchParams.append('financing_act', financingAct);
	}

	for (const financingOption of params.financing_option ?? []) {
		searchParams.append('financing_option', financingOption);
	}

	const query = searchParams.toString();

	return api.get<ApiEnvelope<PaginatedResponse<ListContractsResponse>>>(`/contracts?${query}`);
}

export function getContract(id: string) {
	return api.get<ApiEnvelope<GetContractResponse>>(`/contracts/${id}`);
}

export function createContract(payload: CreateContractRequest) {
	return api.post<ApiEnvelope<CreateContractResponse>>('/contracts', payload);
}
