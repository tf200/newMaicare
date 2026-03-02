import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateIntakeRequest,
	IntakeFormResponse,
	GetIntakeFormResponse,
	GenerateGoalsResponse,
	CreateIntakeFormGoalsRequest,
	IntakeFormsTotalsResponse,
	ListIntakeFormsParams,
	ListIntakeFormsResponse,
	PaginatedResponse,
	PromoteIntakeResponse,
	UpdateIntakeConclusionRequest,
	UpdateIntakeConclusionResponse,
	UpdateIntakeRequest
} from '$lib/types/api';

export function listIntakeForms(params: ListIntakeFormsParams = {}) {
	const searchParams = new URLSearchParams();

	if (params.page) {
		searchParams.set('page', String(params.page));
	}
	if (params.pageSize) {
		searchParams.set('page_size', String(params.pageSize));
	}
	if (params.search) {
		searchParams.set('search', params.search);
	}
	if (params.status) {
		searchParams.set('status', params.status);
	}
	if (params.sortOrder) {
		searchParams.set('sort_order', params.sortOrder);
	}

	const query = searchParams.toString();
	const endpoint = query ? `/intake_forms?${query}` : '/intake_forms';

	return api.get<ApiEnvelope<PaginatedResponse<ListIntakeFormsResponse>>>(endpoint);
}

export function getIntakeFormsTotals() {
	return api.get<ApiEnvelope<IntakeFormsTotalsResponse>>('/intake_forms/totals');
}

export const intakes = {
	create: (data: CreateIntakeRequest) => {
		return api.post<ApiEnvelope<IntakeFormResponse>>('/intake_forms', data);
	},

	generateGoals: (assessmentId: string) => {
		return api.post<ApiEnvelope<GenerateGoalsResponse>>(
			`/intake_maturity/${assessmentId}/generate_goals`,
			{}
		);
	},

	getById: (id: string) => {
		return api.get<ApiEnvelope<GetIntakeFormResponse>>(`/intake_forms/${id}`);
	},
	update: (id: string, data: UpdateIntakeRequest) => {
		return api.patch<ApiEnvelope<IntakeFormResponse>>(`/intake_forms/${id}`, data);
	},
	updateGoals: (id: string, data: CreateIntakeFormGoalsRequest) => {
		return api.put<ApiEnvelope<GetIntakeFormResponse>>(`/intake_forms/${id}/goals`, data);
	},

	updateConclusion: (id: string, data: UpdateIntakeConclusionRequest) => {
		return api.patch<ApiEnvelope<UpdateIntakeConclusionResponse>>(
			`/intake_forms/${id}/conclusion`,
			data
		);
	},

	promote: (id: string) => {
		return api.post<ApiEnvelope<PromoteIntakeResponse>>(`/intake_forms/${id}/promote`, {});
	}
};
