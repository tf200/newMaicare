export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export interface LeaveRequestListItemResponse {
	id: string;
	employee_id: string;
	employee_name: string;
	created_by_employee_id: string;
	leave_type: string;
	status: LeaveRequestStatus;
	start_date: string;
	end_date: string;
	reason: string | null;
	decision_note: string | null;
	decided_by_employee_id: string | null;
	requested_at: string;
	decided_at: string | null;
	cancelled_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface LeaveBalanceListItemResponse {
	id: string;
	employee_id: string;
	employee_name: string;
	year: number;
	legal_total_days: number;
	extra_total_days: number;
	legal_used_days: number;
	extra_used_days: number;
	legal_remaining_days: number;
	extra_remaining_days: number;
	total_remaining_days: number;
	created_at: string;
	updated_at: string;
}

export interface ListLeaveRequestsParams {
	page: number;
	pageSize: number;
	status?: LeaveRequestStatus;
	employeeSearch?: string;
}

export interface ListLeaveBalancesParams {
	page: number;
	pageSize: number;
	employeeSearch?: string;
	year?: number;
}

export interface ListMyLeaveBalancesParams {
	page: number;
	pageSize: number;
	year?: number;
}

export interface CreateLeaveRequestPayload {
	leave_type: 'vacation' | 'personal' | 'sick' | 'pregnancy' | 'late' | 'unpaid' | 'other';
	start_date: string;
	end_date: string;
	reason?: string;
}
