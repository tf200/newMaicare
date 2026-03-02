import * as v from 'valibot';

export const SenderContactSchema = v.object({
	name: v.optional(v.string()),
	email: v.optional(v.union([v.literal(''), v.pipe(v.string(), v.email('Invalid email address'))])),
	phone_number: v.optional(v.string())
});

export const SenderSchema = v.object({
	types: v.picklist(
		['main_provider', 'local_authority', 'particular_party', 'healthcare_institution'],
		'Please select a valid sender type'
	),
	name: v.pipe(v.string(), v.minLength(1, 'Sender name is required')),
	street: v.optional(v.string()),
	house_number: v.optional(v.string()),
	house_number_addition: v.optional(v.string()),
	postal_code: v.optional(
		v.pipe(v.string(), v.regex(/^\d{4}\s?[A-Za-z]{2}$/, 'Invalid Dutch postal code (e.g. 1234 AB)'))
	),
	city: v.optional(v.string()),
	land: v.optional(v.string()),
	KVKnumber: v.optional(v.string()),
	BTWnumber: v.optional(v.string()),
	phone_number: v.optional(v.string()),
	client_number: v.optional(v.string()),
	email_address: v.optional(
		v.union([v.literal(''), v.pipe(v.string(), v.email('Invalid email address'))])
	),
	is_archived: v.optional(v.boolean(), false),
	contacts: v.array(SenderContactSchema)
});

export type SenderSchemaInput = v.InferInput<typeof SenderSchema>;
export type SenderInput = v.InferOutput<typeof SenderSchema>;
export type SenderContactInput = v.InferOutput<typeof SenderContactSchema>;
