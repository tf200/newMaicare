import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as v from 'valibot';
import { IncidentSchema } from './incident';

const validIncident = {
	client_id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
	reporter_involvement: 'witness',
	informed_parties: [],
	incident_type: 'accident',
	severity_of_incident: 'less_serious',
	recurrence_risk: 'very_low',
	cause_categories: [],
	physical_injury: 'no_injuries',
	needed_consultation: 'no',
	follow_up_actions: [],
	emails: ''
};

describe('IncidentSchema', () => {
	test('accepts the create endpoint required fields without occurred_at', () => {
		assert.equal(v.safeParse(IncidentSchema, validIncident).success, true);
	});

	test('rejects invalid client ids', () => {
		for (const clientId of ['', 'not-a-uuid', '00000000-0000-0000-0000-000000000000']) {
			assert.equal(
				v.safeParse(IncidentSchema, { ...validIncident, client_id: clientId }).success,
				false
			);
		}
	});
});
