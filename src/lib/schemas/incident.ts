import * as v from 'valibot';
import { m } from '$lib/paraglide/messages';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export const ReporterInvolvementSchema = v.picklist([
	'directly_involved',
	'witness',
	'found_afterwards',
	'alarmed'
]);

export const IncidentTypeSchema = v.picklist([
	'passing_away',
	'self_harm',
	'violence',
	'fire_water_damage',
	'accident',
	'client_absence',
	'medicines',
	'organization',
	'use_prohibited_substances',
	'other'
]);

export const IncidentSeveritySchema = v.picklist([
	'near_incident',
	'less_serious',
	'serious',
	'fatal'
]);

export const RecurrenceRiskSchema = v.picklist(['very_low', 'means', 'high', 'very_high']);

export const CauseCategorySchema = v.picklist([
	'internal_personal',
	'external_environmental',
	'organizational',
	'technical',
	'employee_related',
	'client_related',
	'other'
]);

export const PhysicalInjurySchema = v.picklist([
	'no_injuries',
	'not_noticeable_yet',
	'bruising_swelling',
	'skin_injury',
	'broken_bones',
	'shortness_of_breath',
	'death',
	'other'
]);

export const NeededConsultationSchema = v.picklist([
	'no',
	'not_clear',
	'hospitalization',
	'consult_gp'
]);

export const FollowUpActionSchema = v.picklist([
	'medical_check',
	'family_contact',
	'internal_review',
	'official_report',
	'notify_inspectorate',
	'notify_referrer',
	'other'
]);

export const InformedPartySchema = v.picklist(['family', 'manager']);

export const IncidentSchema = v.object({
	client_id: v.pipe(
		v.string(),
		v.minLength(1, () => m.required_field()),
		v.uuid(() => m.required_field()),
		v.check(
			(value) => value !== NIL_UUID,
			() => m.required_field()
		)
	),
	employee_id: v.optional(v.string()),
	location_id: v.optional(v.string()),
	reporter_involvement: v.pipe(
		ReporterInvolvementSchema,
		v.minLength(1, () => m.required_field())
	),
	informed_parties: v.array(InformedPartySchema),
	occurred_at: v.optional(v.string()),
	incident_type: v.pipe(
		IncidentTypeSchema,
		v.minLength(1, () => m.required_field())
	),
	severity_of_incident: v.pipe(
		IncidentSeveritySchema,
		v.minLength(1, () => m.required_field())
	),
	incident_explanation: v.optional(v.string()),
	recurrence_risk: v.pipe(
		RecurrenceRiskSchema,
		v.minLength(1, () => m.required_field())
	),
	incident_prevent_steps: v.optional(v.string()),
	incident_taken_measures: v.optional(v.string()),
	cause_categories: v.array(CauseCategorySchema),
	cause_explanation: v.optional(v.string()),
	physical_injury: v.pipe(
		PhysicalInjurySchema,
		v.minLength(1, () => m.required_field())
	),
	physical_injury_desc: v.optional(v.string()),
	psychological_damage: v.optional(v.string()),
	psychological_damage_desc: v.optional(v.string()),
	needed_consultation: v.pipe(
		NeededConsultationSchema,
		v.minLength(1, () => m.required_field())
	),
	follow_up_actions: v.array(FollowUpActionSchema),
	follow_up_notes: v.optional(v.string()),
	is_employee_absent: v.optional(v.boolean(), false),
	additional_details: v.optional(v.string()),
	emails: v.pipe(
		v.string(),
		v.check(
			(val) => {
				const emails = val
					.split(/[\n,;]+/)
					.map((e) => e.trim())
					.filter((e) => e.length > 0);

				return emails.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
			},
			() => m.invalid_email()
		)
	)
});

export type IncidentInput = v.InferOutput<typeof IncidentSchema>;
