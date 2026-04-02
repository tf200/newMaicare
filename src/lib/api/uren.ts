import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	ListTimeEntriesParams,
	PaginatedResponse,
	TimeEntryListItemResponse
} from '$lib/types/api';

const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 100;

function sanitizePageSize(pageSize: number): number {
	if (!Number.isFinite(pageSize)) return 20;
	return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, Math.trunc(pageSize)));
}

function sanitizePage(page: number): number {
	if (!Number.isFinite(page)) return 1;
	return Math.max(1, Math.trunc(page));
}

export function listTimeEntries(params: ListTimeEntriesParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(sanitizePage(params.page)));
	searchParams.set('page_size', String(sanitizePageSize(params.pageSize)));

	if (params.status) {
		searchParams.set('status', params.status);
	}

	const normalizedEmployeeSearch = params.employeeSearch?.trim().slice(0, 120);
	if (normalizedEmployeeSearch) {
		searchParams.set('employee_search', normalizedEmployeeSearch);
	}

	const query = searchParams.toString();
	const endpoint = query ? `/api/time-entries?${query}` : '/api/time-entries';

	return api.get<ApiEnvelope<PaginatedResponse<TimeEntryListItemResponse>>>(endpoint);
}
