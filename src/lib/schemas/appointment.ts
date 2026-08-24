import * as v from 'valibot';
import { m } from '$lib/paraglide/messages';

export const AppointmentKindSchema = v.picklist(['appointment', 'reminder']);

export const AppointmentReminderSchema = v.object({
	minutes_before: v.optional(v.number()),
	remind_at: v.optional(v.string())
});

export const createAppointmentSchema = () =>
	v.pipe(
		v.object({
			kind: AppointmentKindSchema,
			title: v.pipe(v.string(), v.minLength(1, m.calendar_title_required())),
			description: v.optional(v.string()),
			location: v.optional(v.string()),
			color: v.optional(v.string()),
			start: v.pipe(v.string(), v.isoDateTime(m.calendar_start_invalid())),
			end: v.pipe(v.string(), v.isoDateTime(m.calendar_end_invalid())),
			rrule: v.optional(v.string()),
			attendeeEmployeeIds: v.array(v.string()),
			attendeeClientIds: v.array(v.string()),
			reminders: v.optional(v.array(AppointmentReminderSchema))
		}),
		v.forward(
			v.partialCheck(
				[['start'], ['end']],
				(input) => new Date(input.end).getTime() > new Date(input.start).getTime(),
				m.calendar_end_after_start()
			),
			['end']
		)
	);

export type AppointmentInput = v.InferOutput<ReturnType<typeof createAppointmentSchema>>;
