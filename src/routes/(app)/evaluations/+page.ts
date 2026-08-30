import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { PERMISSIONS } from '$lib/config/permissions';
import { getAuthState } from '$lib/state/auth.svelte';
import {
	listUpcomingEvaluations,
	listRecentSubmittedEvaluations,
	listRecentDraftEvaluations,
	getEvaluationStats
} from '$lib/api/evaluations';
import { m } from '$lib/paraglide/messages';
import type { EvaluationDateOnly, EvaluationDateTime } from '$lib/types/api';
import type { ApiRequestOptions } from '$lib/api/client';
import { EVALUATION_PAGE_SIZE, readEvaluationPage } from './pagination';

export interface UpcomingEvaluation {
	clientId: string;
	clientFirstName: string;
	clientLastName: string;
	dueDate: EvaluationDateOnly;
	daysLeft: number;
	priority: 'critical' | 'normal';
	hasDraft: boolean;
	filledGoalsCount: number;
	totalGoalsCount: number;
}

export interface SubmittedEvaluation {
	evaluationId: string;
	clientId: string;
	clientFirstName: string;
	clientLastName: string;
	evaluationDate: EvaluationDateOnly;
	submittedAt: EvaluationDateTime;
	nextEvaluationDate: EvaluationDateOnly | null;
	filledGoalsCount: number;
	totalGoalsCount: number;
}

export interface DraftEvaluation {
	evaluationId: string;
	clientId: string;
	clientFirstName: string;
	clientLastName: string;
	dueDate: EvaluationDateOnly;
	updatedAt: EvaluationDateTime;
	daysLeft: number;
	priority: 'critical' | 'normal';
	filledGoalsCount: number;
	totalGoalsCount: number;
}

export interface EvaluationStatsLoadResult {
	attentionRequired: number;
	inProgress: number;
	recentlyFinalized: number;
	asOf: EvaluationDateTime | null;
	loadError: string | null;
}

export interface EvaluationListingLoadResult<Row> {
	rows: Row[];
	page: number;
	pageSize: number;
	totalCount: number;
	loadError: string | null;
}

export function loadUpcomingEvaluationList(
	page: number,
	pageSize: number,
	options?: ApiRequestOptions
): Promise<EvaluationListingLoadResult<UpcomingEvaluation>> {
	return listUpcomingEvaluations({ page, pageSize }, options)
		.then((res) => ({
			rows: res.data.results.map((item): UpcomingEvaluation => ({
				clientId: item.client_id,
				clientFirstName: item.client_first_name,
				clientLastName: item.client_last_name,
				dueDate: item.due_date,
				daysLeft: item.days_left,
				priority: item.priority,
				hasDraft: item.has_draft,
				filledGoalsCount: item.filled_goals_count,
				totalGoalsCount: item.total_goals_count
			})),
			page,
			pageSize: res.data.page_size,
			totalCount: res.data.count,
			loadError: null
		}))
		.catch((error): EvaluationListingLoadResult<UpcomingEvaluation> => ({
			rows: [],
			page,
			pageSize,
			totalCount: 0,
			loadError: error instanceof Error ? error.message : m.failed_load_evaluations()
		}));
}

export function loadSubmittedEvaluationList(
	page: number,
	pageSize: number,
	options?: ApiRequestOptions
): Promise<EvaluationListingLoadResult<SubmittedEvaluation>> {
	return listRecentSubmittedEvaluations({ page, pageSize }, options)
		.then((res) => ({
			rows: res.data.results.map((item): SubmittedEvaluation => ({
				evaluationId: item.evaluation_id,
				clientId: item.client_id,
				clientFirstName: item.client_first_name,
				clientLastName: item.client_last_name,
				evaluationDate: item.evaluation_date,
				submittedAt: item.submitted_at,
				nextEvaluationDate: item.next_evaluation_date,
				filledGoalsCount: item.filled_goals_count,
				totalGoalsCount: item.total_goals_count
			})),
			page,
			pageSize: res.data.page_size,
			totalCount: res.data.count,
			loadError: null
		}))
		.catch((error): EvaluationListingLoadResult<SubmittedEvaluation> => ({
			rows: [],
			page,
			pageSize,
			totalCount: 0,
			loadError: error instanceof Error ? error.message : m.failed_load_evaluations()
		}));
}

export function loadDraftEvaluationList(
	page: number,
	pageSize: number,
	options?: ApiRequestOptions
): Promise<EvaluationListingLoadResult<DraftEvaluation>> {
	return listRecentDraftEvaluations({ page, pageSize }, options)
		.then((res) => ({
			rows: res.data.results.map((item): DraftEvaluation => ({
				evaluationId: item.evaluation_id,
				clientId: item.client_id,
				clientFirstName: item.client_first_name,
				clientLastName: item.client_last_name,
				dueDate: item.due_date,
				updatedAt: item.updated_at,
				daysLeft: item.days_left,
				priority: item.priority,
				filledGoalsCount: item.filled_goals_count,
				totalGoalsCount: item.total_goals_count
			})),
			page,
			pageSize: res.data.page_size,
			totalCount: res.data.count,
			loadError: null
		}))
		.catch((error): EvaluationListingLoadResult<DraftEvaluation> => ({
			rows: [],
			page,
			pageSize,
			totalCount: 0,
			loadError: error instanceof Error ? error.message : m.failed_load_evaluations()
		}));
}

export function loadEvaluationStats(
	options?: ApiRequestOptions
): Promise<EvaluationStatsLoadResult> {
	return getEvaluationStats(options)
		.then((response): EvaluationStatsLoadResult => ({
			attentionRequired: response.data.attention_required,
			inProgress: response.data.in_progress,
			recentlyFinalized: response.data.recently_finalized,
			asOf: response.data.as_of,
			loadError: null
		}))
		.catch((error): EvaluationStatsLoadResult => ({
			attentionRequired: 0,
			inProgress: 0,
			recentlyFinalized: 0,
			asOf: null,
			loadError: error instanceof Error ? error.message : m.failed_load_evaluation_stats()
		}));
}

export const load: PageLoad = ({ url, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CLIENT.VIEW, PERMISSIONS.CLIENT.EVALUATION_VIEW])) {
		error(403, 'You do not have permission to view this resource.');
	}

	const upcomingPage = readEvaluationPage(url.searchParams, 'upcoming_page');
	const draftsPage = readEvaluationPage(url.searchParams, 'drafts_page');
	const submittedPage = readEvaluationPage(url.searchParams, 'submitted_page');
	const pageSize = EVALUATION_PAGE_SIZE;
	depends('app:evaluations:upcoming');
	depends('app:evaluations:drafts');
	depends('app:evaluations:submitted');
	depends('app:evaluations:stats');

	const upcoming = loadUpcomingEvaluationList(upcomingPage, pageSize, { fetchFn: fetch });
	const submitted = loadSubmittedEvaluationList(submittedPage, pageSize, { fetchFn: fetch });
	const drafts = loadDraftEvaluationList(draftsPage, pageSize, { fetchFn: fetch });
	const stats = loadEvaluationStats({ fetchFn: fetch });

	return {
		initial: { upcomingPage, draftsPage, submittedPage, pageSize },
		upcoming,
		submitted,
		drafts,
		stats
	};
};
