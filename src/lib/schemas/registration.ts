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

type RegistrationEditMessages = {
	required: string;
	invalidEmail: string;
};

const requiredString = (message: string) =>
	v.pipe(
		v.string(),
		v.check((value) => value.trim().length > 0, message)
	);
const optionalEmail = (message: string) =>
	v.pipe(
		v.string(),
		v.check(
			(value) =>
				value.trim().length === 0 ||
				v.safeParse(v.pipe(v.string(), v.email()), value.trim()).success,
			message
		)
	);

export const createRegistrationEditSchema = (messages: RegistrationEditMessages) =>
	v.object({
		client_first_name: requiredString(messages.required),
		client_last_name: requiredString(messages.required),
		client_bsn_number: requiredString(messages.required),
		client_gender: v.picklist(['male', 'female', 'other', 'unknown']),
		client_nationality: requiredString(messages.required),
		client_phone_number: requiredString(messages.required),
		client_email: v.pipe(requiredString(messages.required), v.email(messages.invalidEmail)),
		client_date_of_birth: requiredString(messages.required),
		client_street: requiredString(messages.required),
		client_house_number: requiredString(messages.required),
		client_house_number_addition: v.string(),
		client_postal_code: requiredString(messages.required),
		client_city: requiredString(messages.required),
		referrer_first_name: requiredString(messages.required),
		referrer_last_name: requiredString(messages.required),
		referrer_organization: requiredString(messages.required),
		referrer_job_title: v.string(),
		referrer_phone_number: requiredString(messages.required),
		referrer_email: v.pipe(requiredString(messages.required), v.email(messages.invalidEmail)),
		referrer_signature: v.boolean(),
		guardian1_first_name: v.string(),
		guardian1_last_name: v.string(),
		guardian1_relationship: v.string(),
		guardian1_phone_number: v.string(),
		guardian1_email: optionalEmail(messages.invalidEmail),
		guardian2_first_name: v.string(),
		guardian2_last_name: v.string(),
		guardian2_relationship: v.string(),
		guardian2_phone_number: v.string(),
		guardian2_email: optionalEmail(messages.invalidEmail),
		education: v.object({
			institution: v.string(),
			mentor_name: v.string(),
			mentor_phone: v.string(),
			mentor_email: optionalEmail(messages.invalidEmail),
			currently_enrolled: v.boolean(),
			additional_notes: v.string(),
			level: v.union([v.picklist(['primary', 'secondary', 'higher', 'none']), v.literal('')])
		}),
		work: v.object({
			current_employer: v.string(),
			employer_phone: v.string(),
			employer_email: optionalEmail(messages.invalidEmail),
			current_position: v.string(),
			currently_employed: v.boolean(),
			start_date: v.string(),
			additional_notes: v.string()
		}),
		care_protected_living: v.boolean(),
		care_assisted_independent_living: v.boolean(),
		care_room_training_center: v.boolean(),
		care_ambulatory_guidance: v.boolean(),
		risk_aggressive_behavior: v.boolean(),
		risk_suicidal_selfharm: v.boolean(),
		risk_substance_abuse: v.boolean(),
		risk_psychiatric_issues: v.boolean(),
		risk_criminal_history: v.boolean(),
		risk_flight_behavior: v.boolean(),
		risk_weapon_possession: v.boolean(),
		risk_sexual_behavior: v.boolean(),
		risk_day_night_rhythm: v.boolean(),
		risk_other: v.boolean(),
		risk_other_description: v.string(),
		risk_additional_notes: v.string(),
		application_date: v.string(),
		application_reason: v.string(),
		client_goals: v.array(v.object({ id: v.string(), value: v.string() }))
	});

export type RegistrationEditInput = v.InferInput<ReturnType<typeof createRegistrationEditSchema>>;
