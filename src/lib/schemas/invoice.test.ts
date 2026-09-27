import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as v from 'valibot';
import { CreateInvoiceSchema, type CreateInvoiceInput } from './invoice';

const validInvoice = (): CreateInvoiceInput => ({
	client_id: 'client-1',
	invoice_type: 'standard',
	issue_date: '2026-09-27',
	due_date: '2026-10-11',
	lines: [
		{
			id: 'line-1',
			line_type: 'manual',
			contract_id: '',
			service_type: 'ambulante',
			description: 'Service',
			period_start: '',
			period_end: '',
			quantity: 1,
			unit: 'hour',
			unit_price: 100,
			vat_rate: 21,
			isSaved: false
		}
	]
});

describe('CreateInvoiceSchema dates', () => {
	test('accepts blank optional periods and valid dates', () => {
		assert.equal(v.safeParse(CreateInvoiceSchema, validInvoice()).success, true);
		assert.equal(
			v.safeParse(CreateInvoiceSchema, {
				...validInvoice(),
				lines: [
					{ ...validInvoice().lines[0], period_start: '2026-09-28', period_end: '2026-09-30' }
				]
			}).success,
			true
		);
	});

	test('rejects invalid optional period dates', () => {
		for (const field of ['period_start', 'period_end'] as const) {
			const result = v.safeParse(CreateInvoiceSchema, {
				...validInvoice(),
				lines: [{ ...validInvoice().lines[0], [field]: '2026-02-30' }]
			});
			assert.equal(result.success, false);
			assert.equal(
				result.issues?.some((issue) => issue.path?.some((part) => part.key === field)),
				true
			);
		}
	});

	test('rejects reversed due and service period dates', () => {
		assert.equal(
			v.safeParse(CreateInvoiceSchema, { ...validInvoice(), due_date: '2026-09-26' }).success,
			false
		);
		assert.equal(
			v.safeParse(CreateInvoiceSchema, {
				...validInvoice(),
				lines: [
					{ ...validInvoice().lines[0], period_start: '2026-09-30', period_end: '2026-09-28' }
				]
			}).success,
			false
		);
	});
});
