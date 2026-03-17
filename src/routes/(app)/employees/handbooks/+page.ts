import type { PageLoad } from './$types';
import { listEmployeeHandbookAssignments } from '$lib/api/handbooks';
import { listDepartments } from '$lib/api/settings';
import type {
	DepartmentItem,
	EmployeeHandbookAssignmentDetailsApi,
	EmployeeHandbookAssignmentListItemApi,
	EmployeeHandbookAssignmentStepApi,
	HandbookAssignmentHistoryEntryApi,
	HandbookAssignmentHistoryEventApi,
	HandbookAssignmentStepStatusApi
} from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';

export type { HandbookStatus } from '$lib/config/handbook-status';
import type { HandbookStatus } from '$lib/config/handbook-status';

export type DropdownFilters = Record<string, boolean | string | number | undefined>;
export type FilterOption = { key: string; label: string; value: string };

export interface HandbookTemplate {
	id: string;
	title: string;
	version: string;
	description: string;
	steps_count: number;
}

export interface HandbooksFilters {
	search: string;
	departmentId: string;
	status: '' | HandbookStatus;
}

export interface EmployeeHandbookAssignment {
	id: string;
	employee_id: string;
	employee_name: string;
	employee_initials: string;
	department_id: string | null;
	department_name: string;
	employee_handbook_id: string | null;
	status: HandbookStatus;
	template_id: string;
	template_title: string;
	template_version: string;
	assigned_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	due_at: string | null;
	completed_steps: number;
	total_steps: number;
}

export interface HandbooksLoadResult {
	assignments: EmployeeHandbookAssignment[];
	pagination: PaginationState<HandbooksFilters>;
	loadError: string | null;
}

export type HandbookStepProgressStatus = HandbookAssignmentStepStatusApi;

export interface EmployeeHandbookAssignmentStep {
	step_id: string;
	sort_order: number;
	kind: EmployeeHandbookAssignmentStepApi['kind'];
	title: string;
	body: string | null;
	content: EmployeeHandbookAssignmentStepApi['content'];
	is_required: boolean;
	status: HandbookStepProgressStatus;
	started_at: string | null;
	completed_at: string | null;
	response: EmployeeHandbookAssignmentStepApi['response'];
}

export interface EmployeeHandbookAssignmentDetail {
	employee_handbook_id: string;
	employee_id: string;
	employee_name: string;
	department_name: string;
	status: HandbookStatus;
	assigned_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	due_at: string | null;
	template_id: string;
	template_title: string;
	template_description: string;
	template_version: string;
	steps: EmployeeHandbookAssignmentStep[];
}

export type HandbookHistoryEvent = HandbookAssignmentHistoryEventApi;

export interface HandbookAssignmentHistoryEntry {
	id: string;
	employee_handbook_id: string | null;
	employee_id: string;
	template_id: string;
	template_version: string;
	event: HandbookHistoryEvent;
	actor_employee_id: string | null;
	metadata: Record<string, unknown> | string | null;
	created_at: string;
}

const allowedStatuses = new Set<HandbookStatus>([
	'unassigned',
	'not_started',
	'in_progress',
	'completed',
	'waived'
]);

const toInitials = (firstName: string, lastName: string) => {
	const initials = [firstName, lastName]
		.map((part) => part.trim()[0] ?? '')
		.join('')
		.toUpperCase();

	return initials || 'NA';
};

const normalizeStatus = (value: string | null): HandbooksFilters['status'] => {
	if (value && allowedStatuses.has(value as HandbookStatus)) return value as HandbookStatus;
	return '';
};

const mapAssignment = (
	assignment: EmployeeHandbookAssignmentListItemApi
): EmployeeHandbookAssignment => {
	const firstName = assignment.first_name?.trim() ?? '';
	const lastName = assignment.last_name?.trim() ?? '';
	const employeeName = `${firstName} ${lastName}`.trim() || 'Unknown employee';

	return {
		id: assignment.employee_id,
		employee_id: assignment.employee_id,
		employee_name: employeeName,
		employee_initials: toInitials(firstName, lastName),
		department_id: assignment.department_id,
		department_name: assignment.department_name?.trim() || 'No department',
		employee_handbook_id: assignment.employee_handbook_id,
		status: assignment.handbook_status,
		template_id: assignment.template_id ?? '',
		template_title: assignment.template_title ?? '',
		template_version:
			assignment.template_version == null ? '' : String(assignment.template_version),
		assigned_at: assignment.assigned_at,
		started_at: assignment.started_at,
		completed_at: assignment.completed_at,
		due_at: assignment.due_at,
		completed_steps: assignment.required_steps_completed,
		total_steps: assignment.required_steps_total
	};
};

const mapDepartmentOptions = (departments: DepartmentItem[]) =>
	departments
		.map((department) => ({ id: department.id, name: department.name.trim() }))
		.filter((department) => department.name.length > 0);

export const _mapAssignmentDetail = (
	assignment: EmployeeHandbookAssignmentDetailsApi
): EmployeeHandbookAssignmentDetail => {
	const firstName = assignment.first_name?.trim() ?? '';
	const lastName = assignment.last_name?.trim() ?? '';

	return {
		employee_handbook_id: assignment.employee_handbook_id,
		employee_id: assignment.employee_id,
		employee_name: `${firstName} ${lastName}`.trim() || 'Unknown employee',
		department_name: assignment.department_name?.trim() || 'No department',
		status: assignment.status,
		assigned_at: assignment.assigned_at,
		started_at: assignment.started_at,
		completed_at: assignment.completed_at,
		due_at: assignment.due_at,
		template_id: assignment.template_id,
		template_title: assignment.template_title,
		template_description: assignment.template_description?.trim() || '',
		template_version: String(assignment.template_version),
		steps: assignment.steps.map((step) => ({
			step_id: step.step_id,
			sort_order: step.sort_order,
			kind: step.kind,
			title: step.title,
			body: step.body,
			content: step.content,
			is_required: step.is_required,
			status: step.status,
			started_at: step.started_at,
			completed_at: step.completed_at,
			response: step.response
		}))
	};
};

export const _mapAssignmentHistoryEntry = (
	entry: HandbookAssignmentHistoryEntryApi
): HandbookAssignmentHistoryEntry => ({
	id: entry.id,
	employee_handbook_id: entry.employee_handbook_id,
	employee_id: entry.employee_id,
	template_id: entry.template_id,
	template_version: String(entry.template_version),
	event: entry.event,
	actor_employee_id: entry.actor_employee_id,
	metadata: entry.metadata,
	created_at: entry.created_at
});

export const load: PageLoad = async ({ url, fetch }) => {
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const requestedPageSize = Number(url.searchParams.get('page_size') ?? '10') || 10;
	const pageSize = Math.min(100, Math.max(5, requestedPageSize));

	const filters: HandbooksFilters = {
		search: (url.searchParams.get('search') ?? '').trim(),
		departmentId: (url.searchParams.get('department_id') ?? '').trim(),
		status: normalizeStatus(url.searchParams.get('status'))
	};

	const departmentOptions = await listDepartments({ page: 1, pageSize: 100 }, { fetchFn: fetch })
		.then((response) => mapDepartmentOptions(response.data.results))
		.catch(() => []);

	const handbooksData: Promise<HandbooksLoadResult> = listEmployeeHandbookAssignments(
		{
			page,
			pageSize,
			departmentId: filters.departmentId || undefined,
			search: filters.search || undefined,
			status: filters.status || undefined
		},
		{ fetchFn: fetch }
	)
		.then((response) => {
			const { count, page_size, results, next, previous } = response.data;

			return {
				assignments: results.map(mapAssignment),
				pagination: {
					count,
					page,
					pageSize: page_size || pageSize,
					next,
					previous,
					filters
				} satisfies PaginationState<HandbooksFilters>,
				loadError: null
			} satisfies HandbooksLoadResult;
		})
		.catch((error): HandbooksLoadResult => {
			const message =
				error instanceof Error ? error.message : 'Failed to load employee handbook assignments.';

			return {
				assignments: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters
				} satisfies PaginationState<HandbooksFilters>,
				loadError: message
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters,
			departmentOptions
		},
		handbooksData
	};
};
