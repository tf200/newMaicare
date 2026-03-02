import * as v from 'valibot';

export const AppointmentKindSchema = v.picklist(['appointment', 'reminder']);

export const AppointmentReminderSchema = v.object({
	minutes_before: v.optional(v.number()),
	remind_at: v.optional(v.string())
});

export const AppointmentSchema = v.object({
	kind: AppointmentKindSchema,
	title: v.pipe(v.string(), v.minLength(1, 'Title is required')),
	description: v.optional(v.string()),
	location: v.optional(v.string()),
	color: v.optional(v.string()),
	start: v.pipe(v.string(), v.isoDateTime('Invalid start date')),
	end: v.pipe(v.string(), v.isoDateTime('Invalid end date')),
	rrule: v.optional(v.string()),
	attendeeEmployeeIds: v.array(v.string()),
	attendeeClientIds: v.array(v.string()),
	reminders: v.optional(v.array(AppointmentReminderSchema))
});

export type AppointmentInput = v.InferOutput<typeof AppointmentSchema>;
