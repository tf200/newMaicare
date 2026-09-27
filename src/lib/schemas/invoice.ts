import * as v from 'valibot';
import { m } from '$lib/paraglide/messages';

const isCalendarDate = (value: string) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(value);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const date = () => v.pipe(v.string(), v.check(isCalendarDate, m.invoice_invalid_date()));
const optionalDate = () =>
	v.pipe(
		v.string(),
		v.check((value) => !value || isCalendarDate(value), m.invoice_invalid_date())
	);

export const CreateInvoiceSchema = v.pipe(
	v.object({
		client_id: v.pipe(v.string(), v.minLength(1, m.client_is_required())),
		invoice_type: v.picklist(['standard', 'credit_note']),
		issue_date: date(),
		due_date: date(),
		lines: v.pipe(
			v.array(
				v.pipe(
					v.object({
						id: v.string(),
						line_type: v.picklist(['contract', 'manual', 'adjustment']),
						contract_id: v.string(),
						service_type: v.picklist(['ambulante', 'accommodation']),
						description: v.string(),
						period_start: optionalDate(),
						period_end: optionalDate(),
						quantity: v.pipe(
							v.number(),
							v.finite(),
							v.minValue(0.01, m.invoice_positive_quantity())
						),
						unit: v.string(),
						unit_price: v.pipe(
							v.number(),
							v.finite(),
							v.minValue(0, m.invoice_nonnegative_price())
						),
						vat_rate: v.pipe(
							v.number(),
							v.finite(),
							v.minValue(0, m.vat_must_be_between_zero_and_hundred()),
							v.maxValue(100, m.vat_must_be_between_zero_and_hundred())
						),
						isSaved: v.boolean()
					}),
					v.forward(
						v.check(
							(line) => line.line_type !== 'contract' || !!line.contract_id,
							m.select_contract_for_line()
						),
						['contract_id']
					),
					v.forward(
						v.check(
							(line) =>
								!line.period_start || !line.period_end || line.period_end >= line.period_start,
							m.invoice_invalid_period()
						),
						['period_end']
					)
				)
			),
			v.minLength(1, m.invoice_line_required())
		)
	}),
	v.forward(
		v.check((invoice) => invoice.due_date >= invoice.issue_date, m.invoice_due_before_issue()),
		['due_date']
	)
);

export type CreateInvoiceInput = v.InferInput<typeof CreateInvoiceSchema>;

export const UpdateInvoiceSchema = v.pipe(
	v.object({
		issue_date: date(),
		due_date: date(),
		status: v.picklist(
			[
				'concept',
				'outstanding',
				'partially_paid',
				'paid',
				'expired',
				'overpaid',
				'imported',
				'canceled'
			],
			m.required_field()
		),
		warning_count: v.pipe(
			v.number(m.invoice_warning_count_invalid()),
			v.finite(m.invoice_warning_count_invalid()),
			v.integer(m.invoice_warning_count_invalid()),
			v.minValue(0, m.invoice_warning_count_invalid())
		),
		lines: v.array(
			v.pipe(
				v.object({
					id: v.string(),
					line_type: v.picklist(['contract', 'manual', 'adjustment']),
					contract_id: v.string(),
					service_type: v.picklist(['ambulante', 'accommodation']),
					description: v.string(),
					period_start: optionalDate(),
					period_end: optionalDate(),
					quantity: v.pipe(v.number(), v.finite(), v.minValue(0.01, m.invoice_positive_quantity())),
					unit: v.string(),
					unit_price: v.pipe(v.number(), v.finite(), v.minValue(0, m.invoice_nonnegative_price())),
					vat_rate: v.pipe(
						v.number(),
						v.finite(),
						v.minValue(0, m.vat_must_be_between_zero_and_hundred()),
						v.maxValue(100, m.vat_must_be_between_zero_and_hundred())
					)
				}),
				v.forward(
					v.check(
						(line) => line.line_type !== 'contract' || !!line.contract_id,
						m.select_contract_for_line()
					),
					['contract_id']
				),
				v.forward(
					v.check(
						(line) =>
							!line.period_start || !line.period_end || line.period_end >= line.period_start,
						m.invoice_invalid_period()
					),
					['period_end']
				)
			)
		)
	}),
	v.forward(
		v.check((invoice) => invoice.due_date >= invoice.issue_date, m.invoice_due_before_issue()),
		['due_date']
	)
);

export type UpdateInvoiceInput = v.InferInput<typeof UpdateInvoiceSchema>;
