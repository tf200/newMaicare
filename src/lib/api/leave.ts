import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	LeaveBalanceListItemResponse,
	ListLeaveRequestsParams,
	ListMyLeaveRequestsParams,
	LeaveRequestListItemResponse,
	PaginatedResponse,
	ListLeaveBalancesParams,
	ListMyLeaveBalancesParams,
	CreateLeaveRequestPayload,
	CreateLeaveRequestByAdminPayload,
	CreateLateArrivalPayload,
	CreateLateArrivalByAdminPayload,
	LateArrivalListItemResponse,
	ListLateArrivalsParams,
	DecideLeaveRequestPayload,
	MyLeaveRequestStatsResponse
} from '$lib/types/api';

export function createLeaveRequest(data: CreateLeaveRequestPayload) {
	return api.post<ApiEnvelope<LeaveRequestListItemResponse>>('/leave-requests', data);
}

export function createLeaveRequestByAdmin(data: CreateLeaveRequestByAdminPayload) {
	return api.post<ApiEnvelope<LeaveRequestListItemResponse>>('/leave-requests/admin', data);
}

export function createLateArrival(data: CreateLateArrivalPayload) {
	return api.post<ApiEnvelope<unknown>>('/late-arrivals', data);
}

export function createLateArrivalByAdmin(data: CreateLateArrivalByAdminPayload) {
	return api.post<ApiEnvelope<LateArrivalListItemResponse>>('/late-arrivals/admin', data);
}

export function listLeaveRequests(params: ListLeaveRequestsParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	if (params.status) {
		searchParams.set('status', params.status);
	}

	const normalizedEmployeeSearch = params.employeeSearch?.trim().slice(0, 120);
	if (normalizedEmployeeSearch) {
		searchParams.set('employee_search', normalizedEmployeeSearch);
	}

	const query = searchParams.toString();
	const endpoint = query ? `/leave-requests?${query}` : '/leave-requests';

	return api.get<ApiEnvelope<PaginatedResponse<LeaveRequestListItemResponse>>>(endpoint);
}

export function listMyLeaveRequests(params: ListMyLeaveRequestsParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	if (params.status) {
		searchParams.set('status', params.status);
	}

	const query = searchParams.toString();
	const endpoint = query ? `/leave-requests/my?${query}` : '/leave-requests/my';

	return api.get<ApiEnvelope<PaginatedResponse<LeaveRequestListItemResponse>>>(endpoint);
}

export function listMyLeaveRequestStats() {
	return api.get<ApiEnvelope<MyLeaveRequestStatsResponse>>('/leave-requests/my/stats');
}

export function listLeaveRequestStats() {
	return api.get<ApiEnvelope<MyLeaveRequestStatsResponse>>('/leave-requests/stats');
}

export function decideLeaveRequest(id: string, data: DecideLeaveRequestPayload) {
	return api.post<ApiEnvelope<LeaveRequestListItemResponse>>(
		`/leave-requests/${id}/decision`,
		data
	);
}

const buildLeaveBalancesQuery = (
	params: ListLeaveBalancesParams | ListMyLeaveBalancesParams,
	includeEmployeeSearch: boolean
) => {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	if ('employeeSearch' in params && includeEmployeeSearch) {
		const normalizedEmployeeSearch = params.employeeSearch?.trim().slice(0, 120);
		if (normalizedEmployeeSearch) {
			searchParams.set('employee_search', normalizedEmployeeSearch);
		}
	}

	if (params.year != null) {
		searchParams.set('year', String(params.year));
	}

	return searchParams.toString();
};

export function listLeaveBalances(params: ListLeaveBalancesParams) {
	const query = buildLeaveBalancesQuery(params, true);
	const endpoint = query ? `/leave-balances?${query}` : '/leave-balances';

	return api.get<ApiEnvelope<PaginatedResponse<LeaveBalanceListItemResponse>>>(endpoint);
}

export function listMyLeaveBalances(params: ListMyLeaveBalancesParams) {
	const query = buildLeaveBalancesQuery(params, false);
	const endpoint = query ? `/leave-balances/my?${query}` : '/leave-balances/my';

	return api.get<ApiEnvelope<PaginatedResponse<LeaveBalanceListItemResponse>>>(endpoint);
}

export function listLateArrivals(params: ListLateArrivalsParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	if (params.employeeSearch?.trim()) {
		searchParams.set('employee_search', params.employeeSearch.trim().slice(0, 120));
	}
	if (params.dateFrom) {
		searchParams.set('date_from', params.dateFrom);
	}
	if (params.dateTo) {
		searchParams.set('date_to', params.dateTo);
	}

	const query = searchParams.toString();
	const endpoint = query ? `/late-arrivals?${query}` : '/late-arrivals';

	return api.get<ApiEnvelope<PaginatedResponse<LateArrivalListItemResponse>>>(endpoint);
}
