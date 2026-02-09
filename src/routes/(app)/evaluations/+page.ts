import type { PageLoad } from './$types';
import {
	listUpcomingEvaluations,
	listRecentSubmittedEvaluations,
	listRecentDraftEvaluations
} from '$lib/api/evaluations';

export interface UpcomingEvaluation {
	clientId: string;
	clientFirstName: string;
	clientLastName: string;
	dueDate: string;
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
	evaluationDate: string;
	submittedAt: string;
	nextEvaluationDate: string | null;
	filledGoalsCount: number;
	totalGoalsCount: number;
}

export interface DraftEvaluation {
	evaluationId: string;
	clientId: string;
	clientFirstName: string;
	clientLastName: string;
	dueDate: string;
	updatedAt: string;
	daysLeft: number;
	priority: 'critical' | 'normal';
	filledGoalsCount: number;
	totalGoalsCount: number;
}

export const load: PageLoad = async ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? '1');
	const pageSize = 10;

	const [upcomingRes, submittedRes, draftsRes] = await Promise.all([
		listUpcomingEvaluations({ page, pageSize }),
		listRecentSubmittedEvaluations({ page, pageSize }),
		listRecentDraftEvaluations({ page, pageSize })
	]);

	const upcoming: UpcomingEvaluation[] = upcomingRes.data.results.map((item) => ({
		clientId: item.client_id,
		clientFirstName: item.client_first_name,
		clientLastName: item.client_last_name,
		dueDate: item.due_date,
		daysLeft: item.days_left,
		priority: item.priority,
		hasDraft: item.has_draft,
		filledGoalsCount: item.filled_goals_count,
		totalGoalsCount: item.total_goals_count
	}));

	const submitted: SubmittedEvaluation[] = submittedRes.data.results.map((item) => ({
		evaluationId: item.evaluation_id,
		clientId: item.client_id,
		clientFirstName: item.client_first_name,
		clientLastName: item.client_last_name,
		evaluationDate: item.evaluation_date,
		submittedAt: item.submitted_at,
		nextEvaluationDate: item.next_evaluation_date,
		filledGoalsCount: item.filled_goals_count,
		totalGoalsCount: item.total_goals_count
	}));

	const drafts: DraftEvaluation[] = draftsRes.data.results.map((item) => ({
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
	}));

	return {
		upcoming,
		submitted,
		drafts,
		stats: {
			attentionRequired: upcoming.filter((e) => e.priority === 'critical').length,
			inProgress: upcoming.filter((e) => e.hasDraft).length + drafts.length,
			recentlyFinalized: submitted.length
		}
	};
};
