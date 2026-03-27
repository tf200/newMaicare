import type { CreateLeaveRequestByAdminPayload } from '$lib/types/api';

export type LeaveTypeOption = {
	label: string;
	value: CreateLeaveRequestByAdminPayload['leave_type'];
};

export type CreateLeaveFormState = {
	employeeId: string;
	type: CreateLeaveRequestByAdminPayload['leave_type'];
	startDate: string;
	endDate: string;
	reason: string;
};

export type DateRangeRequestFormState = {
	employeeId: string;
	startDate: string;
	endDate: string;
	reason: string;
};

export type LateArrivalFormState = {
	employeeId: string;
	date: string;
	time: string;
	reason: string;
};

export type LocalLateArrivalItem = {
	id: string;
	employeeId: string;
	employeeName: string;
	date: string;
	time: string;
	reason?: string;
};
