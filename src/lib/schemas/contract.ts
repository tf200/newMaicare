import * as v from 'valibot';

export const ContractCareTypeSchema = v.picklist(['ambulante', 'accommodation']);
export const ContractFinancingActSchema = v.picklist(['WMO', 'ZVW', 'WLZ', 'JW', 'WPG']);
export const ContractFinancingOptionSchema = v.picklist(['ZIN', 'PGB']);
export const ContractPriceTimeUnitSchema = v.picklist(['minute', 'hourly', 'daily', 'weekly']);
export const ContractHoursTypeSchema = v.picklist(['weekly', 'all_period']);

export const ContractSchema = v.pipe(
	v.object({
		client_id: v.pipe(v.string(), v.minLength(1, 'Client is required')),
		sender_id: v.pipe(v.string(), v.minLength(1, 'Sender is required')),
		care_name: v.pipe(v.string(), v.minLength(1, 'Care name is required')),
		care_type: ContractCareTypeSchema,
		start_date: v.pipe(v.string(), v.minLength(1, 'Start date is required')),
		end_date: v.pipe(v.string(), v.minLength(1, 'End date is required')),
		price: v.pipe(
			v.union([v.number(), v.string()]),
			v.transform((val) => (typeof val === 'string' ? Number.parseFloat(val) : val)),
			v.number('Price must be a number'),
			v.minValue(0.01, 'Price must be greater than 0')
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
					'VAT must be between 0 and 100'
				)
			)
		),
		attachment_ids: v.optional(v.array(v.string()), [])
	}),
	v.forward(
		v.check((input) => {
			if (input.start_date && input.end_date) {
				return new Date(input.end_date) > new Date(input.start_date);
			}
			return true;
		}, 'End date must be after start date'),
		['end_date']
	),
	v.forward(
		v.check((input) => {
			if (input.care_type === 'ambulante') {
				return input.hours !== null && input.hours !== undefined && input.hours > 0;
			}
			return true;
		}, 'Hours are required for ambulante care'),
		['hours']
	),
	v.forward(
		v.check((input) => {
			if (input.care_type === 'ambulante') {
				return !!input.hours_type;
			}
			return true;
		}, 'Hours type is required for ambulante care'),
		['hours_type']
	),
	v.forward(
		v.check((input) => {
			if (input.care_type === 'ambulante') {
				return ['minute', 'hourly'].includes(input.price_time_unit);
			}
			if (input.care_type === 'accommodation') {
				return ['daily', 'weekly'].includes(input.price_time_unit);
			}
			return true;
		}, 'Invalid time unit for selected care type'),
		['price_time_unit']
	)
);

export type ContractSchemaInput = v.InferInput<typeof ContractSchema>;
export type ContractInput = v.InferOutput<typeof ContractSchema>;
