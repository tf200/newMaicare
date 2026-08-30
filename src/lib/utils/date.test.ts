import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { formatDateOnly, isSameDateOnly, parseDateOnly } from './date';

describe('date-only utilities', () => {
	test('formats a calendar date without shifting it', () => {
		assert.equal(formatDateOnly('2026-03-01', 'en-GB'), '01 Mar 2026');
		assert.equal(formatDateOnly('2026-03-01', 'nl-NL'), '01 mrt 2026');
	});

	test('accepts leap days and rejects invalid calendar dates', () => {
		assert.equal(parseDateOnly('2024-02-29')?.toISOString(), '2024-02-29T00:00:00.000Z');
		assert.equal(parseDateOnly('2026-02-29'), null);
		assert.equal(parseDateOnly('2026-03-01T00:00:00Z'), null);
	});

	test('returns the placeholder for missing or invalid dates', () => {
		assert.equal(formatDateOnly(null, 'en-GB', 'N/A'), 'N/A');
		assert.equal(formatDateOnly('invalid', 'en-GB', 'N/A'), 'N/A');
	});

	test('compares valid date-only values', () => {
		assert.equal(isSameDateOnly('2026-10-25', '2026-10-25'), true);
		assert.equal(isSameDateOnly('2026-10-25', '2026-10-26'), false);
		assert.equal(isSameDateOnly('invalid', 'invalid'), false);
	});
});
