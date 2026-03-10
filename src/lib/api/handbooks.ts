import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CloneHandbookTemplateRequest,
	CreateHandbookStepRequest,
	CreateHandbookTemplateRequest,
	DeleteHandbookStepResponse,
	HandbookTemplateApi,
	HandbookTemplateStepApi,
	ListDepartmentTemplatesResponse,
	PublishHandbookTemplateRequest,
	ReorderHandbookStepsRequest,
	ReorderHandbookStepsResponse,
	UpdateHandbookStepRequest,
	UpdateHandbookTemplateRequest
} from '$lib/types/api';

export function createHandbookTemplate(payload: CreateHandbookTemplateRequest) {
	return api.post<ApiEnvelope<HandbookTemplateApi>>('/handbook/templates', payload);
}

export function cloneHandbookTemplate(payload: CloneHandbookTemplateRequest) {
	return api.post<ApiEnvelope<HandbookTemplateApi>>('/handbook/templates/clone', payload);
}

export function updateHandbookTemplate(templateId: string, payload: UpdateHandbookTemplateRequest) {
	return api.patch<ApiEnvelope<HandbookTemplateApi>>(
		`/handbook/templates/${encodeURIComponent(templateId)}`,
		payload
	);
}

export function listDepartmentTemplates(
	departmentId: string,
	params: { page?: number; pageSize?: number } = {}
) {
	const search = new URLSearchParams();
	search.set('page', String(params.page ?? 1));
	search.set('page_size', String(params.pageSize ?? 100));

	return api.get<ApiEnvelope<ListDepartmentTemplatesResponse>>(
		`/handbook/departments/${encodeURIComponent(departmentId)}/templates?${search.toString()}`
	);
}

export function publishHandbookTemplate(payload: PublishHandbookTemplateRequest) {
	return api.post<ApiEnvelope<HandbookTemplateApi>>('/handbook/templates/publish', payload);
}

export function createHandbookStep(payload: CreateHandbookStepRequest) {
	return api.post<ApiEnvelope<HandbookTemplateStepApi>>('/handbook/steps', payload);
}

export function updateHandbookStep(stepId: string, payload: UpdateHandbookStepRequest) {
	return api.patch<ApiEnvelope<HandbookTemplateStepApi>>(
		`/handbook/steps/${encodeURIComponent(stepId)}`,
		payload
	);
}

export function deleteHandbookStep(stepId: string) {
	return api.delete<ApiEnvelope<DeleteHandbookStepResponse>>(
		`/handbook/steps/${encodeURIComponent(stepId)}`
	);
}

export function listTemplateSteps(templateId: string) {
	return api.get<ApiEnvelope<HandbookTemplateStepApi[]>>(
		`/handbook/templates/${encodeURIComponent(templateId)}/steps`
	);
}

export function reorderHandbookSteps(
	templateId: string,
	payload: ReorderHandbookStepsRequest
) {
	return api.post<ApiEnvelope<ReorderHandbookStepsResponse>>(
		`/handbook/templates/${encodeURIComponent(templateId)}/steps/reorder`,
		payload
	);
}
