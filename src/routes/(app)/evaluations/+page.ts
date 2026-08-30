import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { PERMISSIONS } from '$lib/config/permissions';
import { getAuthState } from '$lib/state/auth.svelte';
import {
	listUpcomingEvaluations,
	listRecentSubmittedEvaluations,
	listRecentDraftEvaluations
} from '$lib/api/evaluations';
import { m } from '$lib/paraglide/messages';
import type { EvaluationDateOnly, EvaluationDateTime } from '$lib/types/api';
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

export interface EvaluationListingLoadResult<Row> {
	rows: Row[];
	page: number;
	pageSize: number;
	totalCount: number;
	loadError: string | null;
}

function loadUpcomingEvaluationList(
	page: number,
	pageSize: number,
	fetchFn: typeof fetch
): Promise<EvaluationListingLoadResult<UpcomingEvaluation>> {
	return listUpcomingEvaluations({ page, pageSize }, { fetchFn })
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
		.catch((): EvaluationListingLoadResult<UpcomingEvaluation> => ({
			rows: [],
			page,
			pageSize,
			totalCount: 0,
			loadError: m.failed_load_evaluations()
		}));
}

function loadSubmittedEvaluationList(
	page: number,
	pageSize: number,
	fetchFn: typeof fetch
): Promise<EvaluationListingLoadResult<SubmittedEvaluation>> {
	return listRecentSubmittedEvaluations({ page, pageSize }, { fetchFn })
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
		.catch((): EvaluationListingLoadResult<SubmittedEvaluation> => ({
			rows: [],
			page,
			pageSize,
			totalCount: 0,
			loadError: m.failed_load_evaluations()
		}));
}

function loadDraftEvaluationList(
	page: number,
	pageSize: number,
	fetchFn: typeof fetch
): Promise<EvaluationListingLoadResult<DraftEvaluation>> {
	return listRecentDraftEvaluations({ page, pageSize }, { fetchFn })
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
		.catch((): EvaluationListingLoadResult<DraftEvaluation> => ({
			rows: [],
			page,
			pageSize,
			totalCount: 0,
			loadError: m.failed_load_evaluations()
		}));
}

export const load: PageLoad = ({ url, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CLIENT.VIEW, PERMISSIONS.CLIENT.EVALUATION_VIEW])) {
		error(403, m.evaluations_access_denied());
	}

	const upcomingPage = readEvaluationPage(url.searchParams, 'upcoming_page');
	const draftsPage = readEvaluationPage(url.searchParams, 'drafts_page');
	const submittedPage = readEvaluationPage(url.searchParams, 'submitted_page');
	const pageSize = EVALUATION_PAGE_SIZE;
	depends('app:evaluations:upcoming');
	depends('app:evaluations:drafts');
	depends('app:evaluations:submitted');

	const upcoming = loadUpcomingEvaluationList(upcomingPage, pageSize, fetch);
	const submitted = loadSubmittedEvaluationList(submittedPage, pageSize, fetch);
	const drafts = loadDraftEvaluationList(draftsPage, pageSize, fetch);

	return {
		initial: { upcomingPage, draftsPage, submittedPage, pageSize },
		upcoming,
		submitted,
		drafts
	};
};
