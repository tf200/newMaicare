export type ShiftSwapStatus =
	| 'pending_recipient'
	| 'recipient_rejected'
	| 'pending_admin'
	| 'admin_rejected'
	| 'confirmed'
	| 'cancelled'
	| 'expired';

export type ShiftSwapDirection = 'sent' | 'received';

export interface ShiftSwapScheduleSummary {
	id: string;
	employee_id: string;
	employee_name: string;
	shift_name: string;
	start_datetime: string;
	end_datetime: string;
}

export interface ShiftSwapResponse {
	id: string;
	requester_employee_id: string;
	requester_employee_name: string;
	recipient_employee_id: string;
	recipient_employee_name: string;
	requester_schedule: ShiftSwapScheduleSummary;
	recipient_schedule: ShiftSwapScheduleSummary;
	status: ShiftSwapStatus;
	requested_at: string;
	recipient_responded_at: string | null;
	admin_decided_at: string | null;
	recipient_response_note: string | null;
	admin_decision_note: string | null;
	admin_employee_id: string | null;
	admin_employee_name: string | null;
	expires_at: string | null;
	direction?: ShiftSwapDirection | null;
}
