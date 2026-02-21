export type ScheduleRecurrence = 'none' | 'end_of_week' | 'end_of_month';

export interface CreateSchedulePresetRequest {
	employee_ids: string[];
	location_id: string;
	is_custom: false;
	recurrence: ScheduleRecurrence;
	location_shift_id: string;
	shift_date: string;
}

export interface CreateScheduleCustomRequest {
	employee_ids: string[];
	location_id: string;
	is_custom: true;
	recurrence: ScheduleRecurrence;
	start_datetime: string;
	end_datetime: string;
}

export type CreateScheduleRequest = CreateSchedulePresetRequest | CreateScheduleCustomRequest;

export interface ScheduleResponseItem {
	id: string;
	employee_id: string;
	location_id: string;
	location_name: string;
	start_datetime: string;
	end_datetime: string;
	created_at: string;
	updated_at: string;
	location_shift_id: string | null;
	shift_name: string | null;
}
