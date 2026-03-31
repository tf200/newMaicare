export type LeaveType = 'vakantie' | 'verlofbudget' | 'ziekte' | 'bijzonder';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
	id: string;
	employee_id: string;
	employee_name: string;
	department: string;
	type: LeaveType;
	start_date: string;
	end_date: string;
	days: number;
	hours: number;
	status: LeaveStatus;
	reason: string | null;
	submitted_at: string;
}
