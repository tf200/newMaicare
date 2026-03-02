import * as v from 'valibot';

export const LocationSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Location name is required')),
	postal_code: v.pipe(
		v.string(),
		v.regex(/^\d{4}\s?[A-Za-z]{2}$/, 'Invalid Dutch postal code (e.g. 1234 AB)')
	),
	house_number: v.pipe(v.string(), v.minLength(1, 'House number is required')),
	house_number_addition: v.optional(v.string()),
	street: v.pipe(v.string(), v.minLength(1, 'Street is required')),
	city: v.pipe(v.string(), v.minLength(1, 'City is required')),
	capacity: v.optional(
		v.pipe(
			v.union([v.number(), v.string()]),
			v.transform((val) => {
				if (typeof val === 'number') return val;
				if (!val) return undefined;
				const parsed = Number.parseInt(val, 10);
				return Number.isNaN(parsed) ? undefined : parsed;
			})
		)
	)
});

export type LocationSchemaInput = v.InferInput<typeof LocationSchema>;
export type LocationInput = v.InferOutput<typeof LocationSchema>;
