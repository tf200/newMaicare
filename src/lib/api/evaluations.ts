import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	PaginatedResponse,
	ListUpcomingEvaluationsResponse,
	ListRecentSubmittedEvaluationsResponse,
	ListRecentDraftEvaluationsResponse,
	ListEvaluationsParams,
	EvaluationBootstrapResponse,
	CreateEvaluationRequest,
	CreateEvaluationResponse,
	UpdateEvaluationDraftRequest
} from '$lib/types/api';

export function listUpcomingEvaluations(params: ListEvaluationsParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	return api.get<ApiEnvelope<PaginatedResponse<ListUpcomingEvaluationsResponse>>>(
		`/evaluations/upcoming?${searchParams.toString()}`
	);
}

export function listRecentSubmittedEvaluations(params: ListEvaluationsParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	return api.get<ApiEnvelope<PaginatedResponse<ListRecentSubmittedEvaluationsResponse>>>(
		`/evaluations/recent-submitted?${searchParams.toString()}`
	);
}

export function listRecentDraftEvaluations(params: ListEvaluationsParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	return api.get<ApiEnvelope<PaginatedResponse<ListRecentDraftEvaluationsResponse>>>(
		`/evaluations/recent-drafts?${searchParams.toString()}`
	);
}

export function getEvaluationBootstrap(clientId: string) {
	return api.get<ApiEnvelope<EvaluationBootstrapResponse>>(
		`/clients/${clientId}/evaluations/bootstrap`
	);
}

export function createEvaluation(clientId: string, payload: CreateEvaluationRequest) {
	return api.post<ApiEnvelope<CreateEvaluationResponse>>(
		`/clients/${clientId}/evaluations`,
		payload
	);
}

export function updateEvaluationDraft(evaluationId: string, payload: UpdateEvaluationDraftRequest) {
	return api.patch<ApiEnvelope<CreateEvaluationResponse>>(
		`/evaluations/${evaluationId}/draft`,
		payload
	);
}

export function submitEvaluationDraft(evaluationId: string) {
	return api.post<ApiEnvelope<CreateEvaluationResponse>>(`/evaluations/${evaluationId}/submit`, {});
}
