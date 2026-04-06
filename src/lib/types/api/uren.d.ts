export type HourType = 'regular' | 'overtime' | 'evening' | 'night' | 'weekend' | 'holiday';
export type ActivityCategory = 'zorg' | 'overleg' | 'administratie' | 'scholing' | 'overig';
export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface TimeEntry {
	id: string;
	employee_id: string;
	employee_name: string;
	entry_date: string;
	hours: number;
	hour_type: HourType;
	activity_category: ActivityCategory;
	activity_description: string | null;
	project_name: string | null;
	status: TimeEntryStatus;
	created_at: string;
}

export type TimeEntriesListStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type TimeEntriesHourType = 'normal' | 'overtime' | 'travel' | 'leave' | 'sick' | 'training';

export interface TimeEntryListItemResponse {
	id: string;
	employee_id: string;
	employee_name: string;
	schedule_id: string | null;
	entry_date: string;
	start_time: string | null;
	end_time: string | null;
	hours: number | null;
	break_minutes: number | null;
	hour_type: TimeEntriesHourType;
	project_name: string | null;
	project_number: string | null;
	client_name: string | null;
	activity_category: string | null;
	activity_description: string | null;
	status: TimeEntriesListStatus;
	submitted_at: string | null;
	approved_at: string | null;
	approved_by_employee_id: string | null;
	approved_by_name: string | null;
	rejection_reason: string | null;
	is_paid: boolean;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface ListTimeEntriesParams {
	page: number;
	pageSize: number;
	employeeSearch?: string;
	status?: TimeEntriesListStatus;
}

export type CreateTimeEntryHourType =
	| 'normal'
	| 'overtime'
	| 'travel'
	| 'leave'
	| 'sick'
	| 'training';

export interface CreateTimeEntryRequest {
	employee_id: string;
	schedule_id?: string | null;
	entry_date: string;
	start_time: string;
	end_time: string;
	break_minutes?: number;
	hour_type: CreateTimeEntryHourType;
	project_name?: string | null;
	project_number?: string | null;
	client_name?: string | null;
	activity_category?: string | null;
	activity_description?: string | null;
	notes?: string | null;
}

export interface CreateTimeEntryResponse {
	id: string;
	employee_id: string;
	schedule_id: string | null;
	entry_date: string;
	start_time: string;
	end_time: string;
	break_minutes: number;
	hour_type: CreateTimeEntryHourType;
	project_name: string | null;
	project_number: string | null;
	client_name: string | null;
	activity_category: string | null;
	activity_description: string | null;
	status: TimeEntryStatus;
	notes: string | null;
	created_at: string;
}
