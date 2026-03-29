import * as v from 'valibot';

export const EmergencyContactSchema = v.object({
	first_name: v.optional(v.string()),
	last_name: v.optional(v.string()),
	email: v.optional(v.union([v.literal(''), v.pipe(v.string(), v.email('Invalid email address'))])),
	phone_number: v.optional(v.string()),
	relationship: v.optional(v.string()),
	relation_status: v.optional(v.string()),
	street: v.optional(v.string()),
	house_number: v.optional(v.string()),
	house_number_addition: v.optional(v.string()),
	postal_code: v.optional(
		v.pipe(v.string(), v.regex(/^\d{4}\s?[A-Za-z]{2}$/, 'Invalid Dutch postal code (e.g. 1234 AB)'))
	),
	city: v.optional(v.string()),
	country: v.optional(v.string()),
	medical_reports: v.optional(v.boolean(), false),
	incidents_reports: v.optional(v.boolean(), false),
	goals_reports: v.optional(v.boolean(), false)
});

export type EmergencyContactSchemaInput = v.InferInput<typeof EmergencyContactSchema>;
