import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateIntakeRequest,
	IntakeFormResponse,
	GetIntakeFormResponse,
	GenerateGoalsResponse,
	CreateIntakeFormGoalsRequest,
	ListIntakeFormsParams,
	ListIntakeFormsResponse,
	PaginatedResponse,
	PromoteIntakeResponse,
	UpdateIntakeConclusionRequest,
	UpdateIntakeConclusionResponse
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
