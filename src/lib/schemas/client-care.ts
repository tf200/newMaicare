import * as v from 'valibot';
import { m } from '$lib/paraglide/messages';

export const PutClientInCareSchema = v.object({
	care_start_date: v.pipe(
		v.string(),
		v.minLength(1, () => m.required_field()),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, () => m.date_format_yyyy_mm_dd())
	),
	coordinator_employee_id: v.pipe(
		v.string(),
		v.minLength(1, () => m.required_field()),
		v.uuid(() => m.invalid_coordinator())
	),
	placed_in_care_at: v.optional(v.string()),
	reason: v.optional(v.string())
});

export type PutClientInCareSchemaInput = v.InferInput<typeof PutClientInCareSchema>;
export type PutClientInCareInput = v.InferOutput<typeof PutClientInCareSchema>;

export const ClientDischargeReasonSchema = v.picklist([
	'treatment_completed',
	'terminated_by_mutual_agreement',
	'terminated_by_client',
	'terminated_by_provider',
	'terminated_due_to_external_factors',
	'other'
]);

export const PutClientOutOfCareSchema = v.pipe(
	v.object({
		discharge_date: v.pipe(
			v.string(),
			v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
			v.minLength(1, 'Discharge date is required.')
		),
		discharge_reason: ClientDischargeReasonSchema,
		final_evaluation: v.optional(v.string()),
		reason: v.optional(v.string())
	}),
	v.forward(
		v.check((input) => {
			if (!input.discharge_date) return true;

			const [year, month, day] = input.discharge_date.split('-').map(Number);
			const parsed = new Date(year, month - 1, day);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			parsed.setHours(0, 0, 0, 0);

			const isPastOrToday = parsed <= today;
			if (isPastOrToday && (!input.final_evaluation || !input.final_evaluation.trim())) {
				return false;
			}
			return true;
		}, 'Final evaluation is required when discharge date is today or in the past.'),
		['final_evaluation']
	)
);

export type PutClientOutOfCareSchemaInput = v.InferInput<typeof PutClientOutOfCareSchema>;
export type PutClientOutOfCareInput = v.InferOutput<typeof PutClientOutOfCareSchema>;
