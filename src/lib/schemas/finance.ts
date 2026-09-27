import * as v from 'valibot';
import { m } from '$lib/paraglide/messages';

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
		v.number(m.enter_valid_amount()),
		v.minValue(0.01, m.amount_greater_than_zero())
	),
	payment_date: v.pipe(
		v.string(),
		v.minLength(1, m.payment_date_required()),
		v.check((value) => !Number.isNaN(Date.parse(value)), m.invoice_invalid_date())
	),
	payment_method: v.pipe(v.string(), v.minLength(1, m.payment_method_required())),
	status: InvoicePaymentStatusSchema,
	reference: v.optional(v.string()),
	notes: v.optional(v.string())
});

export type InvoicePaymentSchemaInput = v.InferInput<typeof InvoicePaymentSchema>;
export type InvoicePaymentInput = v.InferOutput<typeof InvoicePaymentSchema>;
