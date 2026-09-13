import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as v from 'valibot';
import {
	CauseCategorySchema,
	FollowUpActionSchema,
	IncidentSchema,
	InformedPartySchema,
	PsychologicalDamageSchema
} from './incident';

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

	test('accepts every database-backed array enum value', () => {
		const informedParties = [
			'parents_guardians',
			'care_coordinator',
			'referrer',
			'healthcare_provider',
			'inspectorate',
			'police',
			'other'
		];
		const causeCategories = [
			'technical',
			'organizational',
			'employee_related',
			'client_related',
			'external',
			'other'
		];
		const followUpActions = [
			'notify_parents_guardians',
			'notify_referrer',
			'notify_inspectorate',
			'medical_consultation',
			'care_plan_adjustment',
			'team_evaluation',
			'other'
		];

		for (const value of informedParties) {
			assert.equal(v.safeParse(InformedPartySchema, value).success, true);
		}
		for (const value of causeCategories) {
			assert.equal(v.safeParse(CauseCategorySchema, value).success, true);
		}
		for (const value of followUpActions) {
			assert.equal(v.safeParse(FollowUpActionSchema, value).success, true);
		}
		for (const value of ['no', 'not_noticeable_yet', 'drowsiness', 'unrest', 'other']) {
			assert.equal(v.safeParse(PsychologicalDamageSchema, value).success, true);
		}
	});

	test('rejects legacy values that cause PostgreSQL enum errors', () => {
		for (const value of ['family', 'manager']) {
			assert.equal(v.safeParse(InformedPartySchema, value).success, false);
		}
		for (const value of ['internal_personal', 'external_environmental']) {
			assert.equal(v.safeParse(CauseCategorySchema, value).success, false);
		}
		for (const value of ['medical_check', 'family_contact', 'internal_review', 'official_report']) {
			assert.equal(v.safeParse(FollowUpActionSchema, value).success, false);
		}
	});
});
