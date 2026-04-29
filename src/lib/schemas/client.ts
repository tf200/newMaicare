import * as v from 'valibot';

export const EditClientSchema = v.object({
	first_name: v.pipe(v.string(), v.minLength(1, 'First name is required.')),
	last_name: v.pipe(v.string(), v.minLength(1, 'Last name is required.')),
	date_of_birth: v.optional(v.string()),
	identity: v.boolean(),
	bsn: v.optional(v.string()),
	bsn_verified_by: v.optional(v.string()),
	nationality: v.optional(v.string()),
	email: v.optional(v.string()),
	phone_number: v.optional(v.string()),
	gender: v.optional(v.picklist(['male', 'female', 'other'])),
	filenumber: v.optional(v.string()),
	sender_id: v.optional(v.string()),
	location_id: v.optional(v.string()),
	education_currently_enrolled: v.boolean(),
	education_institution: v.optional(v.string()),
	education_mentor_name: v.optional(v.string()),
	education_mentor_phone: v.optional(v.string()),
	education_mentor_email: v.optional(v.string()),
	education_additional_notes: v.optional(v.string()),
	education_level: v.optional(v.picklist(['primary', 'secondary', 'higher', 'none'])),
	work_currently_employed: v.boolean(),
	work_current_employer: v.optional(v.string()),
	work_employer_phone: v.optional(v.string()),
	work_employer_email: v.optional(v.string()),
	work_current_position: v.optional(v.string()),
	work_start_date: v.optional(v.string()),
	work_additional_notes: v.optional(v.string())
});

export type EditClientSchemaInput = v.InferInput<typeof EditClientSchema>;
