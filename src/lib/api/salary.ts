import { api } from '$lib/api/client';
import type { ApiEnvelope } from '$lib/types/api';
import type {
	CaoSalaryScale,
	ShiftAssignment,
	Service,
	ContractChange,
	LeaveBalance,
	LeavePayout
} from '$lib/types/api/salary';

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

export function listLeavePayoutsForMonth(salaryMonth: string) {
	const query = new URLSearchParams({ salary_month: salaryMonth }).toString();
	return api.get<ApiEnvelope<LeavePayout[]>>(`/salary/leave-payouts?${query}`);
}

export function sendSalarySlipEmail(payload: {
	to: string;
	subject: string;
	filename: string;
	pdfBase64: string;
}) {
	return api.post<ApiEnvelope<null>>('/salary/send-email', payload);
}
