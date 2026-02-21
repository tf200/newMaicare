export type EventKind = 'appointment' | 'reminder';

export interface CreateEventReminderMinutesInput {
	minutes_before: number;
	remind_at?: never;
}

export interface CreateEventReminderAtInput {
	minutes_before?: never;
	remind_at: string;
}

export type CreateEventReminderInput = CreateEventReminderMinutesInput | CreateEventReminderAtInput;

export interface CreateEventRequest {
	kind: EventKind;
	title?: string;
	description?: string | null;
	location?: string | null;
	color?: string | null;
	start_at: string;
	end_at: string;
	rrule?: string;
	attendee_employee_ids?: string[];
	attendee_client_ids?: string[];
	reminders?: CreateEventReminderInput[];
}

export interface EventReminderResponse {
	id: string;
	minutes_before: number | null;
	remind_at: string | null;
}

export interface CreateEventResponse {
	id: string;
	kind: EventKind;
	status: string;
	title: string;
	description: string | null;
	location: string | null;
	color: string | null;
	organizer_employee_id: string;
	start_at: string;
	end_at: string;
	rrule: string | null;
	recurring_event_id: string | null;
	recurrence_id: string | null;
	attendee_employee_ids: string[];
	attendee_client_ids: string[];
	reminders: EventReminderResponse[];
	created_at: string;
	updated_at: string;
}

export interface ListEventsRequest {
	start_at: string;
	end_at: string;
	employee_id?: string;
}

export interface EventOccurrenceResponse {
	id: string;
	master_event_id: string | null;
	kind: EventKind;
	title: string;
	description: string | null;
	location: string | null;
	color: string | null;
	start_at: string;
	end_at: string;
	recurrence_id: string | null;
	is_recurring_instance: boolean;
	attendee_employee_ids: string[];
	attendee_client_ids: string[];
}
