import { api } from '$lib/api/client';
import type { ApiEnvelope, ContractType, CreateContractTypeRequest } from '$lib/types/api';

export function listContractTypes() {
	return api.get<ApiEnvelope<ContractType[]>>('/contract_types');
}

export function createContractType(payload: CreateContractTypeRequest) {
	return api.post<ApiEnvelope<ContractType>>('/contract_types', payload);
}
