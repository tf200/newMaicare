export type ScheduleRecurrence = 'none' | 'end_of_week' | 'end_of_month';

export interface CreateSchedulePresetRequest {
	employee_ids: string[];
	location_id: string;
	is_custom: false;
	recurrence: ScheduleRecurrence;
	location_shift_id: string;
	shift_date: string;
	start_datetime?: never;
	end_datetime?: never;
}

export interface CreateScheduleCustomRequest {
	employee_ids: string[];
	location_id: string;
	is_custom: true;
	recurrence: ScheduleRecurrence;
	start_datetime: string;
	end_datetime: string;
	location_shift_id?: never;
	shift_date?: never;
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

export type GeneratedScheduleStatus = 'optimal' | 'feasible' | 'infeasible';

export interface AutoGenerateScheduleRequest {
	location_id: string;
	week: number;
	year: number;
	employee_ids: string[];
}

export interface GeneratedScheduleConstraint {
	max_staff_per_shift: number;
	allow_empty_shift: boolean;
}

export interface GeneratedScheduleEmployee {
	id: string;
	first_name: string;
	last_name: string;
	target_minutes: number;
}

export interface GeneratedScheduleShiftTemplate {
	shift_id: string;
	name: string;
	start_minute: number;
	end_minute: number;
	duration_minutes: number;
	overnight: boolean;
}

export interface GeneratedScheduleSlot {
	date: string;
	shift_id: string;
	employee_ids: string[];
}

export interface GeneratedScheduleSummaryItem {
	employee_id: string;
	target_minutes: number;
	assigned_minutes: number;
	overtime_minutes: number;
	shift_counts: Record<string, number>;
}

export interface GeneratedScheduleWarning {
	code: string;
	message: string;
}

export interface AutoGenerateScheduleResponse {
	status: GeneratedScheduleStatus;
	plan_id: string;
	location_id: string;
	timezone: string;
	week: number;
	year: number;
	week_start_date: string;
	constraints: GeneratedScheduleConstraint;
	employees: GeneratedScheduleEmployee[];
	shift_templates: GeneratedScheduleShiftTemplate[];
	slots: GeneratedScheduleSlot[];
	summary: GeneratedScheduleSummaryItem[];
	warnings?: GeneratedScheduleWarning[];
}

export interface SaveGeneratedScheduleRequest {
	plan_id: string;
	location_id: string;
	week: number;
	year: number;
	slots: GeneratedScheduleSlot[];
}
