import * as v from 'valibot';

export const AdmissionTypeSchema = v.picklist(['crisis_admission', 'regular_placement']);

export const ProcessRegistrationSchema = v.object({
	admission_type: AdmissionTypeSchema,
	intake_appointment_location: v.pipe(v.string(), v.minLength(1, 'Location is required')),
	proposed_dates: v.pipe(
		v.array(v.pipe(v.string(), v.minLength(1, 'Date is required'))),
		v.minLength(1, 'At least one proposed date is required')
	)
});

export type ProcessRegistrationInput = v.InferOutput<typeof ProcessRegistrationSchema>;
