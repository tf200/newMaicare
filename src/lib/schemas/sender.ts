import * as v from 'valibot';
import { m } from '$lib/paraglide/messages';

export const SenderContactSchema = v.object({
	name: v.optional(v.string()),
	email: v.optional(
		v.union([
			v.literal(''),
			v.pipe(
				v.string(),
				v.email(() => m.invalid_email())
			)
		])
	),
	phone_number: v.optional(v.string())
});

export const SenderSchema = v.object({
	types: v.picklist(
		['main_provider', 'local_authority', 'particular_party', 'healthcare_institution'],
		() => m.invalid_sender_type()
	),
	name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.sender_name_required())
	),
	street: v.optional(v.string()),
	house_number: v.optional(v.string()),
	house_number_addition: v.optional(v.string()),
	postal_code: v.optional(
		v.union([
			v.literal(''),
			v.pipe(
				v.string(),
				v.regex(/^\d{4}\s?[A-Za-z]{2}$/, () => m.invalid_dutch_postal_code())
			)
		])
	),
	city: v.optional(v.string()),
	land: v.optional(v.string()),
	KVKnumber: v.optional(v.string()),
	BTWnumber: v.optional(v.string()),
	phone_number: v.optional(v.string()),
	client_number: v.optional(v.string()),
	email_address: v.optional(
		v.union([
			v.literal(''),
			v.pipe(
				v.string(),
				v.email(() => m.invalid_email())
			)
		])
	),
	is_archived: v.optional(v.boolean(), false),
	contacts: v.array(SenderContactSchema)
});

export type SenderSchemaInput = v.InferInput<typeof SenderSchema>;
export type SenderInput = v.InferOutput<typeof SenderSchema>;
export type SenderContactInput = v.InferOutput<typeof SenderContactSchema>;
