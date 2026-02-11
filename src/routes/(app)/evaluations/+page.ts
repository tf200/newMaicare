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

export const load: PageLoad = ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? '1');
	const pageSize = 10;

	const upcoming = listUpcomingEvaluations({ page, pageSize }).then((res) =>
		res.data.results.map(
			(item): UpcomingEvaluation => ({
				clientId: item.client_id,
				clientFirstName: item.client_first_name,
				clientLastName: item.client_last_name,
				dueDate: item.due_date,
				daysLeft: item.days_left,
				priority: item.priority,
				hasDraft: item.has_draft,
				filledGoalsCount: item.filled_goals_count,
				totalGoalsCount: item.total_goals_count
			})
		)
	);

	const submitted = listRecentSubmittedEvaluations({ page, pageSize }).then((res) =>
		res.data.results.map(
			(item): SubmittedEvaluation => ({
				evaluationId: item.evaluation_id,
				clientId: item.client_id,
				clientFirstName: item.client_first_name,
				clientLastName: item.client_last_name,
				evaluationDate: item.evaluation_date,
				submittedAt: item.submitted_at,
				nextEvaluationDate: item.next_evaluation_date,
				filledGoalsCount: item.filled_goals_count,
				totalGoalsCount: item.total_goals_count
			})
		)
	);

	const drafts = listRecentDraftEvaluations({ page, pageSize }).then((res) =>
		res.data.results.map(
			(item): DraftEvaluation => ({
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
			})
		)
	);

	const stats = Promise.all([upcoming, submitted, drafts]).then(
		([upcomingData, submittedData, draftsData]) => ({
			attentionRequired: upcomingData.filter((e) => e.priority === 'critical').length,
			inProgress: upcomingData.filter((e) => e.hasDraft).length + draftsData.length,
			recentlyFinalized: submittedData.length
		})
	);

	return {
		upcoming,
		submitted,
		drafts,
		stats
	};
};
