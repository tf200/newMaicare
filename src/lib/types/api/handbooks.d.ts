import type { PaginatedResponse } from './common';

export type HandbookTemplateStatusApi = 'draft' | 'published' | 'archived';
export type HandbookStepKindApi = 'content' | 'ack' | 'link' | 'quiz';

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
