import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as v from 'valibot';
import { ContractTypeSchema } from './contract-type';

describe('ContractTypeSchema', () => {
	test('trims a valid name', () => {
		const result = v.safeParse(ContractTypeSchema, { name: '  Supported living  ' });
		assert.equal(result.success, true);
		if (result.success) assert.equal(result.output.name, 'Supported living');
	});

	test('rejects blank names', () => {
		assert.equal(v.safeParse(ContractTypeSchema, { name: '   ' }).success, false);
	});

	test('enforces the backend length limit', () => {
		assert.equal(v.safeParse(ContractTypeSchema, { name: 'a'.repeat(100) }).success, true);
		assert.equal(v.safeParse(ContractTypeSchema, { name: 'a'.repeat(101) }).success, false);
	});
});
