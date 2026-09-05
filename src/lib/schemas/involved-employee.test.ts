import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as v from 'valibot';
import { createInvolvedEmployeeSchema } from './involved-employee';
import { createClientCoordinatorSchema } from './client-coordinator';

const schema = createInvolvedEmployeeSchema({
	employeeRequired: 'employee is required',
	startDateRequired: 'start date is required',
	roleRequired: 'role is required',
	dateFormat: 'use yyyy-mm-dd'
});

describe('involved employee roles', () => {
	test('rejects arbitrary role labels and empty roles', () => {
		for (const role of ['', 'zorgcoordinator', 'Primary Counselor', 'unknown']) {
			assert.equal(
				v.safeParse(schema, {
					employee_id: 'employee-1',
					start_date: '2026-09-05',
					role
				}).success,
				false
			);
		}
	});
	test('accepts each ordinary backend role', () => {
		const roles = [
			'primary_counselor',
			'secondary_counselor',
			'behavioral_scientist',
			'case_manager',
			'specialist',
			'other'
		];

		for (const role of roles) {
			const result = v.safeParse(schema, {
				employee_id: 'employee-1',
				start_date: '2026-09-05',
				role
			});
			assert.equal(result.success, true);
		}
	});

	test('rejects coordinator because it has a dedicated endpoint', () => {
		const result = v.safeParse(schema, {
			employee_id: 'employee-1',
			start_date: '2026-09-05',
			role: 'coordinator'
		});

		assert.equal(result.success, false);
	});
});

describe('coordinator form', () => {
	const coordinatorSchema = createClientCoordinatorSchema({
		employeeRequired: 'select an employee',
		dateFormat: 'select a valid date'
	});
	const valid = { employee_id: '11111111-1111-4111-8111-111111111111', start_date: '2026-09-05' };

	test('accepts an employee UUID and date-only form value', () => {
		assert.deepEqual(v.parse(coordinatorSchema, valid), valid);
	});

	test('requires a valid employee selection', () => {
		for (const employee_id of ['', 'employee-1']) {
			assert.equal(v.safeParse(coordinatorSchema, { ...valid, employee_id }).success, false);
		}
	});

	test('rejects empty or malformed dates before sending a request', () => {
		for (const start_date of ['', '05/09/2026', '2026-99-99', '2026-09-05T00:00:00Z']) {
			assert.equal(v.safeParse(coordinatorSchema, { ...valid, start_date }).success, false);
		}
	});
});
