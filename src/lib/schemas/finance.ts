import * as v from 'valibot';

export const InvoicePaymentStatusSchema = v.picklist([
	'completed',
	'pending',
	'failed',
	'reversed',
	'refunded'
]);

export const InvoicePaymentSchema = v.object({
	amount: v.pipe(
		v.union([v.number(), v.string()]),
		v.transform((val) => {
			if (typeof val === 'number') return val;
			const normalized = val.replace(',', '.').trim();
			const value = Number(normalized);
			return Number.isFinite(value) ? value : NaN;
		}),
		v.number('Enter a valid amount.'),
		v.minValue(0.01, 'Amount must be greater than 0.')
	),
	payment_date: v.pipe(v.string(), v.minLength(1, 'Payment date is required.')),
	payment_method: v.pipe(v.string(), v.minLength(1, 'Payment method is required.')),
	status: InvoicePaymentStatusSchema,
	reference: v.optional(v.string()),
	notes: v.optional(v.string())
});

export type InvoicePaymentSchemaInput = v.InferInput<typeof InvoicePaymentSchema>;
export type InvoicePaymentInput = v.InferOutput<typeof InvoicePaymentSchema>;
