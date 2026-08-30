import { api, type ApiRequestOptions } from '$lib/api/client';
import type {
	ApiEnvelope,
	PaginatedResponse,
	ListUpcomingEvaluationsResponse,
	ListRecentSubmittedEvaluationsResponse,
	ListRecentDraftEvaluationsResponse,
	ListEvaluationsParams,
	EvaluationStatsResponse,
	EvaluationBootstrapResponse,
	CreateEvaluationRequest,
	CreateEvaluationResponse,
	UpdateEvaluationDraftRequest,
	GoalEvaluationResponse,
	ClientGoalsOverviewResponse,
	ListClientSubmittedEvaluationsResponse,
	GoalEvaluationHistoryEntry
} from '$lib/types/api';

export function getEvaluationStats(options?: ApiRequestOptions) {
	return api.get<ApiEnvelope<EvaluationStatsResponse>>('/evaluations/stats', options);
}

export function listUpcomingEvaluations(
	params: ListEvaluationsParams,
	options?: ApiRequestOptions
) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	return api.get<ApiEnvelope<PaginatedResponse<ListUpcomingEvaluationsResponse>>>(
		`/evaluations/upcoming?${searchParams.toString()}`,
		options
	);
}

export function listRecentSubmittedEvaluations(
	params: ListEvaluationsParams,
	options?: ApiRequestOptions
) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	return api.get<ApiEnvelope<PaginatedResponse<ListRecentSubmittedEvaluationsResponse>>>(
		`/evaluations/recent-submitted?${searchParams.toString()}`,
		options
	);
}

export function listRecentDraftEvaluations(
	params: ListEvaluationsParams,
	options?: ApiRequestOptions
) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	return api.get<ApiEnvelope<PaginatedResponse<ListRecentDraftEvaluationsResponse>>>(
		`/evaluations/recent-drafts?${searchParams.toString()}`,
		options
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

export function updateEvaluationDraft(
	evaluationId: string,
	revision: string,
	payload: UpdateEvaluationDraftRequest
) {
	return api.patch<ApiEnvelope<CreateEvaluationResponse>>(
		`/evaluations/${evaluationId}/draft`,
		payload,
		{ headers: { 'If-Match': `"${revision}"` } }
	);
}

export function submitEvaluationDraft(evaluationId: string, revision: string) {
	return api.post<ApiEnvelope<CreateEvaluationResponse>>(
		`/evaluations/${evaluationId}/submit`,
		undefined,
		{
			headers: { 'If-Match': `"${revision}"` }
		}
	);
}

export function getGoalEvaluation(evaluationId: string) {
	return api.get<ApiEnvelope<GoalEvaluationResponse>>(`/evaluations/${evaluationId}`);
}

export function getClientGoals(clientId: string, options?: ApiRequestOptions) {
	return api.get<ApiEnvelope<ClientGoalsOverviewResponse>>(`/clients/${clientId}/goals`, options);
}

export function listClientSubmittedEvaluations(
	clientId: string,
	params: ListEvaluationsParams,
	options?: ApiRequestOptions
) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	return api.get<ApiEnvelope<PaginatedResponse<ListClientSubmittedEvaluationsResponse>>>(
		`/clients/${clientId}/evaluations/submitted?${searchParams.toString()}`,
		options
	);
}

export function listGoalEvaluationHistory(
	clientId: string,
	goalId: string,
	params: ListEvaluationsParams
) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	return api.get<ApiEnvelope<PaginatedResponse<GoalEvaluationHistoryEntry>>>(
		`/clients/${clientId}/goals/${goalId}/history?${searchParams.toString()}`
	);
}
