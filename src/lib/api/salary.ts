import { api } from '$lib/api/client';
import type { ApiEnvelope } from '$lib/types/api';
import type {
	CaoSalaryScale,
	ShiftAssignment,
	Service,
	ContractChange,
	LeaveBalance,
	PayoutRequest
} from '$lib/types/api/salary';
import type { PaginatedResponse } from '$lib/types/api';

export function listCaoSalaryScales() {
	return api.get<ApiEnvelope<CaoSalaryScale[]>>('/salary/scales');
}

export function listShiftAssignments(params: { start_date: string; end_date: string }) {
	const query = new URLSearchParams({
		start_date: params.start_date,
		end_date: params.end_date
	}).toString();

	return api.get<ApiEnvelope<ShiftAssignment[]>>(`/salary/shift-assignments?${query}`);
}

export function listServices() {
	return api.get<ApiEnvelope<Service[]>>('/salary/services');
}

export function listContractChanges() {
	return api.get<ApiEnvelope<ContractChange[]>>('/salary/contract-changes');
}

export function listLeaveBalancesForYear(year: number) {
	const query = new URLSearchParams({ year: String(year) }).toString();
	return api.get<ApiEnvelope<LeaveBalance[]>>(`/salary/leave-balances?${query}`);
}

export interface ListPayoutRequestsParams {
	page: number;
	page_size: number;
	status?: 'pending' | 'approved' | 'rejected' | 'paid';
	employee_search?: string;
}

export function listPayoutRequests(params: ListPayoutRequestsParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.page_size));

	if (params.status) {
		searchParams.set('status', params.status);
	}

	const normalizedSearch = params.employee_search?.trim().slice(0, 120);
	if (normalizedSearch) {
		searchParams.set('employee_search', normalizedSearch);
	}

	const query = searchParams.toString();
	return api.get<ApiEnvelope<PaginatedResponse<PayoutRequest>>>(`/payout-requests?${query}`);
}

export function getPayrollMonthSummary(params: {
	month: string;
	employee_search?: string;
	page: number;
	page_size: number;
}) {
	const query = new URLSearchParams();
	query.set('month', params.month);
	query.set('page', String(params.page));
	query.set('page_size', String(params.page_size));
	if (params.employee_search) {
		query.set('employee_search', params.employee_search);
	}

	return api.get<any>(`/payroll-month-summary?${query.toString()}`);
}

export function sendSalarySlipEmail(payload: {
	to: string;
	subject: string;
	filename: string;
	pdfBase64: string;
}) {
	return api.post<ApiEnvelope<null>>('/salary/send-email', payload);
}
