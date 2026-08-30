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

export const load: PageLoad = ({ url, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CLIENT.VIEW, PERMISSIONS.CLIENT.EVALUATION_VIEW])) {
		error(403, 'You do not have permission to view this resource.');
	}

	const page = Number(url.searchParams.get('page') ?? '1');
	const pageSize = 10;
	depends('app:evaluations:stats');

	const upcoming = listUpcomingEvaluations({ page, pageSize }).then((res) =>
		res.data.results.map((item): UpcomingEvaluation => ({
			clientId: item.client_id,
			clientFirstName: item.client_first_name,
			clientLastName: item.client_last_name,
			dueDate: item.due_date,
			daysLeft: item.days_left,
			priority: item.priority,
			hasDraft: item.has_draft,
			filledGoalsCount: item.filled_goals_count,
			totalGoalsCount: item.total_goals_count
		}))
	);

	const submitted = listRecentSubmittedEvaluations({ page, pageSize }).then((res) =>
		res.data.results.map((item): SubmittedEvaluation => ({
			evaluationId: item.evaluation_id,
			clientId: item.client_id,
			clientFirstName: item.client_first_name,
			clientLastName: item.client_last_name,
			evaluationDate: item.evaluation_date,
			submittedAt: item.submitted_at,
			nextEvaluationDate: item.next_evaluation_date,
			filledGoalsCount: item.filled_goals_count,
			totalGoalsCount: item.total_goals_count
		}))
	);

	const drafts = listRecentDraftEvaluations({ page, pageSize }).then((res) =>
		res.data.results.map((item): DraftEvaluation => ({
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
		}))
	);

	const stats: Promise<EvaluationStatsLoadResult> = getEvaluationStats({ fetchFn: fetch })
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

	return {
		upcoming,
		submitted,
		drafts,
		stats
	};
};
