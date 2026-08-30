import { error } from '@sveltejs/kit';
import { getClientGoals, listClientSubmittedEvaluations } from '$lib/api/evaluations';
import { PERMISSIONS } from '$lib/config/permissions';
import { getAuthState } from '$lib/state/auth.svelte';
import type { EvaluationDateOnly, EvaluationDateTime, EvaluationProgress } from '$lib/types/api';
import type { PageLoad } from './$types';

export interface SubmittedEvaluationRow {
	evaluation_id: string;
	evaluation_date: EvaluationDateOnly;
	submitted_at: EvaluationDateTime;
	filled_goals_count: number;
	total_goals_count: number;
	created_by_employee_id: string | null;
	creator_name: string | null;
}

export interface GoalsOverviewLoadResult {
	next_evaluation_date: EvaluationDateOnly | null;
	days_left: number | null;
	my_draft_evaluation_id: string | null;
	is_responsible_employee: boolean;
	can_update_goals: boolean;
	goal_update_block_reason: string | null;
	active_goals: Array<{
		id: string;
		title: string;
		description: string | null;
		topic_id: string | null;
		topic_name: string;
		priority: 'high' | 'medium' | 'low';
		last_evaluation_progress: EvaluationProgress | null;
	}>;
	history: SubmittedEvaluationRow[];
	historyPagination: {
		page: number;
		pageSize: number;
		count: number;
	};
	loadError: string | null;
	historyLoadError: string | null;
}

const DEFAULT_PAGE_SIZE = 5;

export const load: PageLoad = ({ params, url, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CLIENT.VIEW, PERMISSIONS.CLIENT.EVALUATION_VIEW])) {
		error(403, 'You do not have permission to view this resource.');
	}

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const pageSize = Math.max(
		1,
		Number(url.searchParams.get('page_size') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE
	);
	depends(`app:client:${params.id}:goals`);
	depends(`app:client:${params.id}:evaluation-history`);

	const goalsRequest = getClientGoals(params.id, { fetchFn: fetch })
		.then((res) => ({
			payload: {
				next_evaluation_date: res.data.next_evaluation_date,
				days_left: res.data.days_left,
				my_draft_evaluation_id: res.data.my_draft_evaluation_id,
				is_responsible_employee: res.data.is_responsible_employee,
				can_update_goals: res.data.can_update_goals,
				goal_update_block_reason: res.data.goal_update_block_reason,
				active_goals: (res.data.goals ?? res.data.active_goals ?? []).map((goal) => ({
					id: goal.id,
					title: goal.title,
					description: goal.description,
					topic_id: goal.topic_id,
					topic_name: goal.topic_name,
					priority: goal.priority,
					last_evaluation_progress: goal.last_evaluation_progress
				}))
			},
			error: null as string | null
		}))
		.catch((error) => ({
			payload: {
				next_evaluation_date: null,
				days_left: null,
				my_draft_evaluation_id: null,
				is_responsible_employee: false,
				can_update_goals: true,
				goal_update_block_reason: null,
				active_goals: []
			},
			error: error instanceof Error ? error.message : 'Failed to load client goals.'
		}));

	const historyRequest = listClientSubmittedEvaluations(
		params.id,
		{ page, pageSize },
		{ fetchFn: fetch }
	)
		.then((res) => ({
			payload: {
				history: res.data.results,
				historyPagination: {
					page,
					pageSize: res.data.page_size,
					count: res.data.count
				}
			},
			error: null as string | null
		}))
		.catch((error) => ({
			payload: {
				history: [],
				historyPagination: {
					page,
					pageSize,
					count: 0
				}
			},
			error: error instanceof Error ? error.message : 'Failed to load submitted evaluations.'
		}));

	const goalsData: Promise<GoalsOverviewLoadResult> = Promise.all([
		goalsRequest,
		historyRequest
	]).then(([goalsResult, historyResult]) => ({
		...goalsResult.payload,
		...historyResult.payload,
		can_update_goals: goalsResult.payload.can_update_goals,
		goal_update_block_reason: goalsResult.payload.goal_update_block_reason,
		loadError: goalsResult.error,
		historyLoadError: historyResult.error
	}));

	return {
		initial: {
			page,
			pageSize
		},
		goalsData
	};
};
