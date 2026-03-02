import * as v from 'valibot';

export const OrganizationSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Organization name is required')),
	email: v.optional(v.union([v.literal(''), v.pipe(v.string(), v.email('Invalid email address'))])),
	postal_code: v.pipe(
		v.string(),
		v.regex(/^\d{4}\s?[A-Za-z]{2}$/, 'Invalid Dutch postal code (e.g. 1234 AB)')
	),
	house_number: v.pipe(v.string(), v.minLength(1, 'House number is required')),
	house_number_addition: v.optional(v.string()),
	street: v.pipe(v.string(), v.minLength(1, 'Street is required')),
	city: v.pipe(v.string(), v.minLength(1, 'City is required')),
	kvk_number: v.optional(v.string()),
	btw_number: v.optional(v.string())
});

export type OrganizationSchemaInput = v.InferInput<typeof OrganizationSchema>;
export type OrganizationInput = v.InferOutput<typeof OrganizationSchema>;
