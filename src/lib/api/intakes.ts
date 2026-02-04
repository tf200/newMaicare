import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateIntakeRequest,
	IntakeFormResponse,
	GenerateGoalsResponse,
	ListIntakeFormsParams,
	ListIntakeFormsResponse,
	PaginatedResponse
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
	}
};
