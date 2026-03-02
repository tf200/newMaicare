import * as v from 'valibot';

export const MedicationOrderStatusSchema = v.picklist(['active', 'paused', 'stopped', 'completed']);
export const MedicationAdminModeSchema = v.picklist(['self', 'staff', 'shared']);
export const MedicationRouteSchema = v.picklist([
	'oral',
	'iv',
	'im',
	'sc',
	'topical',
	'inhalation',
	'other'
]);

export const MedicationScheduleItemSchema = v.object({
	time: v.pipe(v.string(), v.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'))
});

export const MedicationOrderSchema = v.pipe(
	v.object({
		diagnosis_id: v.optional(v.string()),
		medication_name: v.pipe(v.string(), v.minLength(1, 'Medication name is required.')),
		dosage_text: v.pipe(v.string(), v.minLength(1, 'Dosage text is required.')),
		dose_amount: v.optional(
			v.pipe(
				v.union([v.number(), v.string()]),
				v.transform((val) => {
					if (typeof val === 'number') return val;
					if (!val) return undefined;
					return Number.parseFloat(val);
				})
			)
		),
		dose_unit: v.optional(v.string()),
		route: v.optional(MedicationRouteSchema),
		frequency_text: v.optional(v.string()),
		schedule: v.array(MedicationScheduleItemSchema),
		is_prn: v.optional(v.boolean(), false),
		prn_indication: v.optional(v.string()),
		max_doses_per_24h: v.optional(
			v.pipe(
				v.union([v.number(), v.string()]),
				v.transform((val) => {
					if (typeof val === 'number') return val;
					if (!val) return undefined;
					return Number.parseInt(val, 10);
				})
			)
		),
		start_date: v.pipe(v.string(), v.minLength(1, 'Start date is required.')),
		end_date: v.optional(v.string()),
		status: MedicationOrderStatusSchema,
		admin_mode: MedicationAdminModeSchema,
		responsible_employee_id: v.optional(v.string()),
		is_critical: v.optional(v.boolean(), false),
		notes: v.optional(v.string()),
		source_attachment_uuid: v.optional(v.string())
	}),
	v.forward(
		v.check((input) => {
			if (input.end_date && input.start_date) {
				return new Date(input.end_date) >= new Date(input.start_date);
			}
			return true;
		}, 'End date cannot be before start date.'),
		['end_date']
	),
	v.forward(
		v.check((input) => {
			if (input.admin_mode !== 'self' && !input.responsible_employee_id) {
				return false;
			}
			return true;
		}, 'Responsible employee is required for staff/shared admin mode.'),
		['responsible_employee_id']
	),
	v.forward(
		v.check((input) => {
			if (input.is_prn && (!input.prn_indication || !input.prn_indication.trim())) {
				return false;
			}
			return true;
		}, 'PRN indication is required when medication is PRN.'),
		['prn_indication']
	)
);

export type MedicationOrderSchemaInput = v.InferInput<typeof MedicationOrderSchema>;
export type MedicationOrderInput = v.InferOutput<typeof MedicationOrderSchema>;
