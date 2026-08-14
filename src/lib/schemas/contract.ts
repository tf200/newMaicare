import * as v from 'valibot';
import { m } from '$lib/paraglide/messages';

export const ContractCareTypeSchema = v.picklist(['ambulante', 'accommodation']);
export const ContractFinancingActSchema = v.picklist(['WMO', 'ZVW', 'WLZ', 'JW', 'WPG']);
export const ContractFinancingOptionSchema = v.picklist(['ZIN', 'PGB']);
export const ContractPriceTimeUnitSchema = v.picklist(['minute', 'hourly', 'daily', 'weekly']);
export const ContractHoursTypeSchema = v.picklist(['weekly', 'all_period']);

export const ContractSchema = v.pipe(
	v.object({
		client_id: v.pipe(
			v.string(),
			v.minLength(1, () => m.client_is_required())
		),
		sender_id: v.pipe(
			v.string(),
			v.minLength(1, () => m.sender_is_required())
		),
		care_name: v.pipe(
			v.string(),
			v.minLength(1, () => m.care_name_is_required())
		),
		care_type: ContractCareTypeSchema,
		start_date: v.pipe(
			v.string(),
			v.minLength(1, () => m.start_date_is_required())
		),
		end_date: v.pipe(
			v.string(),
			v.minLength(1, () => m.end_date_is_required())
		),
		price: v.pipe(
			v.union([v.number(), v.string()]),
			v.transform((val) => (typeof val === 'string' ? Number.parseFloat(val) : val)),
			v.number(() => m.price_must_be_number()),
			v.minValue(0.01, () => m.price_must_be_positive())
		),
		price_time_unit: ContractPriceTimeUnitSchema,
		hours: v.optional(
			v.pipe(
				v.union([v.number(), v.string()]),
				v.transform((val) => {
					if (typeof val === 'number') return val;
					if (!val) return undefined;
					return Number.parseFloat(val);
				}),
				v.optional(v.number())
			)
		),
		hours_type: v.optional(ContractHoursTypeSchema),
		financing_act: ContractFinancingActSchema,
		financing_option: ContractFinancingOptionSchema,
		type_id: v.optional(v.string()),
		reminder_period: v.optional(
			v.pipe(
				v.union([v.number(), v.string()]),
				v.transform((val) => {
					if (typeof val === 'number') return val;
					if (!val) return undefined;
					return Number.parseInt(val, 10);
				})
			)
		),
		VAT: v.optional(
			v.pipe(
				v.union([v.number(), v.string()]),
				v.transform((val) => {
					if (typeof val === 'number') return val;
					if (!val) return undefined;
					return Number.parseFloat(val);
				}),
				v.check(
					(val) => val === undefined || (val >= 0 && val <= 100),
					() => m.vat_must_be_between_zero_and_hundred()
				)
			)
		),
		attachment_ids: v.optional(v.array(v.string()), [])
	}),
	v.forward(
		v.check(
			(input) => {
				if (input.start_date && input.end_date) {
					return new Date(input.end_date) > new Date(input.start_date);
				}
				return true;
			},
			() => m.end_date_must_be_after_start_date()
		),
		['end_date']
	),
	v.forward(
		v.check(
			(input) => {
				if (input.care_type === 'ambulante') {
					return input.hours !== null && input.hours !== undefined && input.hours > 0;
				}
				return true;
			},
			() => m.hours_required_for_ambulante_care()
		),
		['hours']
	),
	v.forward(
		v.check(
			(input) => {
				if (input.care_type === 'ambulante') {
					return !!input.hours_type;
				}
				return true;
			},
			() => m.hours_type_required_for_ambulante_care()
		),
		['hours_type']
	),
	v.forward(
		v.check(
			(input) => {
				if (input.care_type === 'ambulante') {
					return ['minute', 'hourly'].includes(input.price_time_unit);
				}
				if (input.care_type === 'accommodation') {
					return ['daily', 'weekly'].includes(input.price_time_unit);
				}
				return true;
			},
			() => m.invalid_time_unit_for_care_type()
		),
		['price_time_unit']
	)
);

export type ContractSchemaInput = v.InferInput<typeof ContractSchema>;
export type ContractInput = v.InferOutput<typeof ContractSchema>;
export type ContractCareType = v.InferOutput<typeof ContractCareTypeSchema>;
