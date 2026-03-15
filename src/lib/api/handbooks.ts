import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CloneHandbookTemplateRequest,
	CreateHandbookAssignmentRequest,
	CreateHandbookAssignmentResponse,
	CreateHandbookStepRequest,
	CreateHandbookTemplateRequest,
	DeleteHandbookStepResponse,
	EmployeeHandbookAssignmentDetailsApi,
	HandbookAssignmentHistoryEntryApi,
	HandbookAssignmentStatusApi,
	HandbookTemplateApi,
	HandbookTemplateStepApi,
	ListEmployeeHandbookAssignmentsResponse,
	ListEligibleHandbookEmployeesResponse,
	ListDepartmentTemplatesResponse,
	PublishHandbookTemplateRequest,
	ReorderHandbookStepsRequest,
	ReorderHandbookStepsResponse,
	UpdateHandbookStepRequest,
	UpdateHandbookTemplateRequest,
	WaiveHandbookAssignmentRequest,
	WaiveHandbookAssignmentResponse
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

export interface ListEmployeeHandbookAssignmentsParams {
	page?: number;
	pageSize?: number;
	departmentId?: string;
	search?: string;
	status?: HandbookAssignmentStatusApi;
}

export interface ListEligibleHandbookEmployeesParams {
	page?: number;
	pageSize?: number;
	departmentId?: string;
	search?: string;
}

export function listEmployeeHandbookAssignments(
	params: ListEmployeeHandbookAssignmentsParams = {},
	options: { fetchFn?: typeof fetch } = {}
) {
	const search = new URLSearchParams();
	if (params.page != null) search.set('page', String(params.page));
	if (params.pageSize != null) search.set('page_size', String(params.pageSize));
	if (params.departmentId) search.set('department_id', params.departmentId);
	if (params.search) search.set('search', params.search);
	if (params.status) search.set('status', params.status);

	const query = search.toString();
	const endpoint = query ? `/handbook/assignments?${query}` : '/handbook/assignments';

	return api.get<ApiEnvelope<ListEmployeeHandbookAssignmentsResponse>>(endpoint, options);
}

export function listEligibleHandbookEmployees(
	params: ListEligibleHandbookEmployeesParams = {},
	options: { fetchFn?: typeof fetch } = {}
) {
	const search = new URLSearchParams();
	if (params.page != null) search.set('page', String(params.page));
	if (params.pageSize != null) search.set('page_size', String(params.pageSize));
	if (params.departmentId) search.set('department_id', params.departmentId);
	if (params.search) search.set('search', params.search);

	const query = search.toString();
	const endpoint = query
		? `/handbook/assignments/eligible-employees?${query}`
		: '/handbook/assignments/eligible-employees';

	return api.get<ApiEnvelope<ListEligibleHandbookEmployeesResponse>>(endpoint, options);
}

export function getEmployeeHandbookAssignment(
	handbookId: string,
	options: { fetchFn?: typeof fetch } = {}
) {
	return api.get<ApiEnvelope<EmployeeHandbookAssignmentDetailsApi>>(
		`/handbook/assignments/${encodeURIComponent(handbookId)}`,
		options
	);
}

export function getEmployeeHandbookHistory(
	employeeId: string,
	options: { fetchFn?: typeof fetch } = {}
) {
	return api.get<ApiEnvelope<HandbookAssignmentHistoryEntryApi[]>>(
		`/handbook/employees/${encodeURIComponent(employeeId)}/history`,
		options
	);
}

export function createHandbookAssignment(payload: CreateHandbookAssignmentRequest) {
	return api.post<ApiEnvelope<CreateHandbookAssignmentResponse>>('/handbook/assignments', payload);
}

export function waiveHandbookAssignment(
	handbookId: string,
	payload?: WaiveHandbookAssignmentRequest
) {
	return api.post<ApiEnvelope<WaiveHandbookAssignmentResponse>>(
		`/handbook/assignments/${encodeURIComponent(handbookId)}/waive`,
		payload ?? {}
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

export function reorderHandbookSteps(templateId: string, payload: ReorderHandbookStepsRequest) {
	return api.post<ApiEnvelope<ReorderHandbookStepsResponse>>(
		`/handbook/templates/${encodeURIComponent(templateId)}/steps/reorder`,
		payload
	);
}
