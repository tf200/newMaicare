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
