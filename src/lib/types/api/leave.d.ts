export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export interface LeaveRequestListItemResponse {
	id: string;
	employee_id: string;
	employee_name: string;
	created_by_employee_id: string | null;
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

export interface ListMyLeaveRequestsParams {
	page: number;
	pageSize: number;
	status?: LeaveRequestStatus;
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
	leave_type: 'vacation' | 'personal' | 'sick' | 'pregnancy' | 'unpaid' | 'other';
	start_date: string;
	end_date: string;
	reason?: string;
}

export interface CreateLeaveRequestByAdminPayload {
	employee_id: string;
	leave_type: 'vacation' | 'personal' | 'sick' | 'pregnancy' | 'unpaid' | 'other';
	start_date: string;
	end_date: string;
	reason?: string;
}

export interface CreateLateArrivalPayload {
	arrival_date: string;
	arrival_time: string;
	reason?: string;
}

export interface CreateLateArrivalByAdminPayload extends CreateLateArrivalPayload {
	employee_id: string;
}

export type LeaveRequestDecision = 'approve' | 'reject';

export interface DecideLeaveRequestPayload {
	decision: LeaveRequestDecision;
	decision_note?: string | null;
}

export interface LateArrivalListItemResponse {
	id: string;
	schedule_id: string;
	employee_id: string;
	employee_name: string;
	created_by_employee_id: string;
	arrival_date: string;
	arrival_time: string;
	reason: string | null;
	shift_start_datetime: string;
	shift_end_datetime: string;
	shift_name: string;
	location_name: string;
	created_at: string;
	updated_at: string;
}

export interface ListLateArrivalsParams {
	page: number;
	pageSize: number;
	employeeSearch?: string;
	dateFrom?: string;
	dateTo?: string;
}

export interface MyLeaveRequestStatsResponse {
	open_requests: number;
	approved_requests: number;
	rejected_requests: number;
	sickness_absence: number;
}
