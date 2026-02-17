import type { BaseModel } from './models';

export interface AppointmentReminder {
	id?: string;
	minutes_before?: number;
	remind_at?: string;
}

export interface Appointment extends BaseModel {
	// Core fields from API spec
	kind: 'appointment' | 'reminder';
	title: string;
	description?: string | null;
	location?: string | null;
	color?: string | null;
	start: string; // ISO date string
	end: string; // ISO date string
	rrule?: string; // RFC5545 RRULE

	// Attendees
	attendeeEmployeeIds: string[];
	attendeeClientIds: string[];

	// Reminders
	reminders?: AppointmentReminder[];

	// Legacy fields (for backward compatibility)
	allDay?: boolean;
	clientId?: string;
	clientName?: string;
	employeeIds: string[];
	employeeNames?: string[];
	type?: 'consultation' | 'intake' | 'evaluation' | 'treatment' | 'other';
	status?: 'scheduled' | 'completed' | 'cancelled';
}

export interface AppointmentFilter {
	employeeId?: string;
	clientId?: string;
	start?: string;
	end?: string;
}
