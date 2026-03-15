import type { PaginatedResponse } from './common';

export type HandbookTemplateStatusApi = 'draft' | 'published' | 'archived';
export type HandbookStepKindApi = 'content' | 'ack' | 'link' | 'quiz';
export type HandbookAssignmentStatusApi =
	| 'unassigned'
	| 'not_started'
	| 'in_progress'
	| 'completed'
	| 'waived';
export type HandbookAssignmentStepStatusApi = 'pending' | 'in_progress' | 'completed';
export type MyHandbookStepStatusApi = 'pending' | 'completed' | 'skipped';
export type HandbookAssignmentHistoryEventApi =
	| 'assigned'
	| 'reassigned'
	| 'waived'
	| 'started'
	| 'completed';

export type HandbookErrorCode =
	| 'HANDBOOK_DRAFT_ALREADY_EXISTS'
	| 'HANDBOOK_TEMPLATE_NOT_FOUND'
	| 'HANDBOOK_TEMPLATE_NOT_DRAFT'
	| 'HANDBOOK_TEMPLATE_NOT_PUBLISHED'
	| 'HANDBOOK_TEMPLATE_NO_STEPS'
	| 'HANDBOOK_STEP_NOT_FOUND'
	| 'HANDBOOK_LINK_URL_INVALID'
	| 'HANDBOOK_QUIZ_CONTENT_INVALID'
	| 'HANDBOOK_STEP_REORDER_SET_MISMATCH'
	| 'INVALID_REQUEST';

export interface HandbookTemplateApi {
	id: string;
	department_id: string;
	title: string;
	description: string | null;
	version: number;
	status: HandbookTemplateStatusApi;
	published_at: string | null;
	archived_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface EmployeeHandbookAssignmentListItemApi {
	employee_id: string;
	first_name: string;
	last_name: string;
	department_id: string | null;
	department_name: string | null;
	employee_handbook_id: string | null;
	template_id: string | null;
	template_title: string | null;
	template_version: number | null;
	handbook_status: HandbookAssignmentStatusApi;
	assigned_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	due_at: string | null;
	required_steps_total: number;
	required_steps_completed: number;
}

export type ListEmployeeHandbookAssignmentsResponse =
	PaginatedResponse<EmployeeHandbookAssignmentListItemApi>;

export interface EligibleHandbookEmployeeApi {
	employee_id: string;
	first_name: string;
	last_name: string;
	department_id: string | null;
	department_name: string | null;
}

export type ListEligibleHandbookEmployeesResponse = PaginatedResponse<EligibleHandbookEmployeeApi>;

export interface EmployeeHandbookAssignmentStepApi {
	step_id: string;
	sort_order: number;
	kind: HandbookStepKindApi;
	title: string;
	body: string | null;
	content: HandbookStepContentApi | Record<string, unknown> | null;
	is_required: boolean;
	status: HandbookAssignmentStepStatusApi;
	started_at: string | null;
	completed_at: string | null;
	response: Record<string, unknown> | string | null;
}

export interface MyActiveHandbookStepApi {
	step_id: string;
	sort_order: number;
	kind: HandbookStepKindApi;
	title: string;
	body: string | null;
	content: HandbookStepContentApi | Record<string, unknown> | null;
	is_required: boolean;
	status: MyHandbookStepStatusApi;
	started_at: string | null;
	completed_at: string | null;
	response: Record<string, unknown> | string | null;
}

export interface GetMyActiveHandbookResponse {
	handbook_id: string;
	status: Exclude<HandbookAssignmentStatusApi, 'unassigned'>;
	assigned_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	due_at: string | null;
	template_id: string;
	template_title: string;
	template_description: string | null;
	template_version: number;
	department_id: string | null;
	department_name: string | null;
	steps: MyActiveHandbookStepApi[];
}

export interface StartMyHandbookResponse {
	handbook_id: string;
	status: Exclude<HandbookAssignmentStatusApi, 'unassigned'>;
	started_at: string | null;
}

export interface CompleteMyHandbookStepRequest {
	response: Record<string, unknown>;
}

export interface CompleteMyHandbookStepResponse {
	handbook_id: string;
	step_id: string;
	step_status: MyHandbookStepStatusApi;
	completed_at: string | null;
	handbook_status: Exclude<HandbookAssignmentStatusApi, 'unassigned'>;
}

export interface EmployeeHandbookAssignmentDetailsApi {
	employee_handbook_id: string;
	employee_id: string;
	first_name: string;
	last_name: string;
	status: HandbookAssignmentStatusApi;
	assigned_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	due_at: string | null;
	template_id: string;
	template_title: string;
	template_description: string | null;
	template_version: number;
	department_id: string | null;
	department_name: string | null;
	steps: EmployeeHandbookAssignmentStepApi[];
}

export interface HandbookAssignmentHistoryEntryApi {
	id: string;
	employee_handbook_id: string | null;
	employee_id: string;
	template_id: string;
	template_version: number;
	event: HandbookAssignmentHistoryEventApi;
	actor_employee_id: string | null;
	metadata: Record<string, unknown> | string | null;
	created_at: string;
}

export interface CreateHandbookAssignmentRequest {
	employee_id: string;
	template_id: string;
}

export interface CreateHandbookAssignmentResponse {
	employee_handbook_id: string;
	employee_id: string;
	template_id: string;
	template_version: number;
	status: 'not_started';
	assigned_at: string;
}

export interface WaiveHandbookAssignmentRequest {
	reason?: string | null;
}

export interface WaiveHandbookAssignmentResponse {
	employee_handbook_id: string;
	employee_id: string;
	status: 'waived';
	completed_at: string | null;
}

export type ListDepartmentTemplatesResponse = PaginatedResponse<HandbookTemplateApi>;

export interface CreateHandbookTemplateRequest {
	department_id: string;
	title: string;
	description?: string;
}

export interface CloneHandbookTemplateRequest {
	source_template_id: string;
}

export interface UpdateHandbookTemplateRequest {
	title?: string;
	description?: string | null;
}

export interface PublishHandbookTemplateRequest {
	template_id: string;
}

export interface LinkStepContentApi {
	url: string;
}

export interface QuizStepContentApi {
	question: string;
	options: string[];
	correct_option_index: number;
}

export type HandbookStepContentApi = string | LinkStepContentApi | QuizStepContentApi | null;

export interface HandbookTemplateStepApi {
	id: string;
	template_id: string;
	sort_order: number;
	kind: HandbookStepKindApi;
	title: string;
	body: string | null;
	content: HandbookStepContentApi;
	is_required: boolean;
	created_at: string;
	updated_at: string;
}

export interface CreateHandbookStepRequest {
	template_id: string;
	sort_order?: number;
	kind: HandbookStepKindApi;
	title: string;
	body?: string;
	content?: HandbookStepContentApi;
	is_required?: boolean;
}

export interface UpdateHandbookStepRequest {
	title?: string;
	body?: string | null;
	content?: HandbookStepContentApi;
	is_required?: boolean;
}

export interface DeleteHandbookStepResponse {
	step_id: string;
	deleted: true;
}

export interface ReorderHandbookStepsRequest {
	ordered_step_ids: string[];
}

export interface ReorderHandbookStepsResponse {
	template_id: string;
	steps: HandbookTemplateStepApi[];
}
