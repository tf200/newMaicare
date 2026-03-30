export interface ListUpcomingEvaluationsResponse {
	client_id: string;
	client_first_name: string;
	client_last_name: string;
	due_date: string;
	days_left: number;
	priority: 'critical' | 'normal';
	has_draft: boolean;
	filled_goals_count: number;
	total_goals_count: number;
}

export interface ListRecentSubmittedEvaluationsResponse {
	evaluation_id: string;
	client_id: string;
	client_first_name: string;
	client_last_name: string;
	evaluation_date: string;
	submitted_at: string;
	next_evaluation_date: string | null;
	filled_goals_count: number;
	total_goals_count: number;
}

export interface ListRecentDraftEvaluationsResponse {
	evaluation_id: string;
	client_id: string;
	client_first_name: string;
	client_last_name: string;
	due_date: string;
	updated_at: string;
	days_left: number;
	priority: 'critical' | 'normal';
	filled_goals_count: number;
	total_goals_count: number;
}

export interface ListEvaluationsParams {
	page: number;
	pageSize: number;
}

export type EvaluationProgress =
	| 'no_progress'
	| 'regression'
	| 'limited_progress'
	| 'good_progress'
	| 'achieved'
	| 'blocked';

export interface EvaluationActiveGoal {
	goal_id: string;
	title: string;
	topic_name_snapshot: string | null;
	priority: 'high' | 'medium' | 'low';
	sort_order: number;
	last_progress: EvaluationProgress | null;
	last_notes: string | null;
}

export interface ExistingDraftEvaluationSummary {
	id: string;
	evaluation_date: string;
	updated_at: string;
}

export interface LastCompletedEvaluationSummary {
	id: string;
	evaluation_date: string;
	submitted_at: string;
	overall_notes: string | null;
	created_by_employee_id: string | null;
	creator_name: string | null;
}

export interface EvaluationBootstrapResponse {
	client_id: string;
	client_first_name: string;
	client_last_name: string;
	next_evaluation_date: string | null;
	days_left: number;
	priority: 'critical' | 'normal';
	existing_draft: ExistingDraftEvaluationSummary | null;
	last_completed_evaluation: LastCompletedEvaluationSummary | null;
	active_goals: EvaluationActiveGoal[];
}

export interface EvaluationItemInput {
	goal_id: string;
	progress: EvaluationProgress;
	notes: string | null;
}

export interface CreateEvaluationRequest {
	overall_notes?: string | null;
	submit?: boolean;
	items: EvaluationItemInput[];
}

export interface UpdateEvaluationDraftRequest {
	overall_notes?: string;
	items: EvaluationItemInput[];
}

export interface GoalEvaluationItemResponse {
	id: string;
	evaluation_id: string;
	goal_id: string;
	goal_title: string;
	goal_description: string | null;
	topic_name_snapshot: string | null;
	progress: EvaluationProgress;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface GoalEvaluationResponse {
	id: string;
	client_id: string;
	evaluation_date: string;
	period_start: string | null;
	period_end: string | null;
	evaluation_interval_weeks: number;
	status: 'draft' | 'completed' | 'archived';
	overall_notes: string | null;
	created_by_employee_id: string | null;
	creator_name: string | null;
	created_at: string;
	updated_at: string;
	submit_error?: string;
	items: GoalEvaluationItemResponse[];
}

export type CreateEvaluationResponse = GoalEvaluationResponse;

export interface ClientGoalsItemResponse {
	id: string;
	topic_id: string | null;
	topic_name: string;
	title: string;
	description: string | null;
	priority: 'low' | 'medium' | 'high';
	last_evaluation_progress: EvaluationProgress | null;
}

export interface ClientGoalsOverviewResponse {
	goals?: ClientGoalsItemResponse[];
	active_goals?: ClientGoalsItemResponse[];
	next_evaluation_date: string | null;
	my_draft_evaluation_id: string | null;
	is_responsible_employee: boolean;
	can_update_goals: boolean;
	goal_update_block_reason: string | null;
}

export interface ListClientSubmittedEvaluationsResponse {
	evaluation_id: string;
	evaluation_date: string;
	submitted_at: string;
	filled_goals_count: number;
	total_goals_count: number;
	created_by_employee_id: string | null;
	creator_name: string | null;
}

export interface GoalEvaluationHistoryEntry {
	evaluation_id: string;
	evaluation_date: string;
	submitted_at: string;
	progress: EvaluationProgress;
	notes: string | null;
	created_by_employee_id: string | null;
	creator_name: string | null;
	period_start: string | null;
	period_end: string | null;
}
