/** Calendar date in YYYY-MM-DD format. It must not be converted through the browser timezone. */
export type EvaluationDateOnly = `${number}-${number}-${number}`;

/** RFC 3339 timestamp representing an instant. */
export type EvaluationDateTime = string;

export interface ListUpcomingEvaluationsResponse {
	client_id: string;
	client_first_name: string;
	client_last_name: string;
	due_date: EvaluationDateOnly;
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
	evaluation_date: EvaluationDateOnly;
	submitted_at: EvaluationDateTime;
	next_evaluation_date: EvaluationDateOnly | null;
	filled_goals_count: number;
	total_goals_count: number;
}

export interface ListRecentDraftEvaluationsResponse {
	evaluation_id: string;
	client_id: string;
	client_first_name: string;
	client_last_name: string;
	due_date: EvaluationDateOnly;
	updated_at: EvaluationDateTime;
	days_left: number;
	priority: 'critical' | 'normal';
	filled_goals_count: number;
	total_goals_count: number;
}

export interface ListEvaluationsParams {
	page: number;
	pageSize: number;
}

export interface EvaluationStatsResponse {
	attention_required: number;
	in_progress: number;
	recently_finalized: number;
	as_of: EvaluationDateTime;
}

export type EvaluationProgress =
	'no_progress' | 'regression' | 'limited_progress' | 'good_progress' | 'achieved' | 'blocked';

export type EvaluationProgressState = 'not_evaluated' | EvaluationProgress;

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
	evaluation_date: EvaluationDateOnly;
	updated_at: EvaluationDateTime;
}

export interface LastCompletedEvaluationSummary {
	id: string;
	evaluation_date: EvaluationDateOnly;
	submitted_at: EvaluationDateTime;
	overall_notes: string | null;
	created_by_employee_id: string | null;
	creator_name: string | null;
}

export interface EvaluationBootstrapResponse {
	client_id: string;
	client_first_name: string;
	client_last_name: string;
	next_evaluation_date: EvaluationDateOnly | null;
	days_left: number | null;
	priority: 'critical' | 'normal' | null;
	existing_draft: ExistingDraftEvaluationSummary | null;
	last_completed_evaluation: LastCompletedEvaluationSummary | null;
	active_goals: EvaluationActiveGoal[];
}

export interface EvaluationItemInput {
	goal_id: string;
	progress: EvaluationProgressState;
	notes: string | null;
}

export interface CreateEvaluationRequest {
	overall_notes?: string | null;
	submit?: boolean;
	items: EvaluationItemInput[];
}

export interface UpdateEvaluationDraftRequest {
	overall_notes?: string | null;
	items: EvaluationItemInput[];
}

export type EvaluationErrorCode =
	| 'EVALUATION_CLIENT_NOT_IN_CARE'
	| 'EVALUATION_NO_ACTIVE_GOALS'
	| 'EVALUATION_NO_DUE_DATE'
	| 'EVALUATION_NOT_FOUND'
	| 'EVALUATION_NOT_OWNER'
	| 'EVALUATION_DUPLICATE_GOAL'
	| 'EVALUATION_GOAL_NOT_ACTIVE'
	| 'EVALUATION_INVALID_PROGRESS'
	| 'EVALUATION_INCOMPLETE'
	| 'EVALUATION_TOO_EARLY'
	| 'EVALUATION_ALREADY_COMPLETED'
	| 'EVALUATION_NOT_CURRENT_CYCLE'
	| 'EVALUATION_CONFLICT'
	| 'EVALUATION_REVISION_REQUIRED';

export interface GoalEvaluationItemResponse {
	id: string;
	evaluation_id: string;
	goal_id: string;
	goal_title: string;
	goal_description: string | null;
	topic_name_snapshot: string | null;
	progress: EvaluationProgressState;
	notes: string | null;
	created_at: EvaluationDateTime;
	updated_at: EvaluationDateTime;
}

export interface GoalEvaluationResponse {
	id: string;
	client_id: string;
	evaluation_date: EvaluationDateOnly;
	period_start: EvaluationDateOnly | null;
	period_end: EvaluationDateOnly | null;
	evaluation_interval_weeks: number;
	status: 'draft' | 'completed' | 'archived';
	overall_notes: string | null;
	created_by_employee_id: string | null;
	creator_name: string | null;
	created_at: EvaluationDateTime;
	updated_at: EvaluationDateTime;
	items: GoalEvaluationItemResponse[];
}

export interface EvaluationMutationErrorData {
	draft_saved: boolean;
	evaluation?: GoalEvaluationResponse;
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
	next_evaluation_date: EvaluationDateOnly | null;
	days_left: number | null;
	my_draft_evaluation_id: string | null;
	is_responsible_employee: boolean;
	can_update_goals: boolean;
	goal_update_block_reason: string | null;
}

export interface ListClientSubmittedEvaluationsResponse {
	evaluation_id: string;
	evaluation_date: EvaluationDateOnly;
	submitted_at: EvaluationDateTime;
	filled_goals_count: number;
	total_goals_count: number;
	created_by_employee_id: string | null;
	creator_name: string | null;
}

export interface GoalEvaluationHistoryEntry {
	evaluation_id: string;
	evaluation_date: EvaluationDateOnly;
	submitted_at: EvaluationDateTime;
	progress: EvaluationProgress;
	notes: string | null;
	created_by_employee_id: string | null;
	creator_name: string | null;
	period_start: EvaluationDateOnly | null;
	period_end: EvaluationDateOnly | null;
}
