import * as v from 'valibot';

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
	'other'
]);

export const InformedPartySchema = v.picklist(['family', 'manager']);

export const IncidentSchema = v.object({
	client_id: v.pipe(v.string(), v.minLength(1, 'Client is required')),
	employee_id: v.optional(v.string()),
	location_id: v.optional(v.string()),
	reporter_involvement: v.pipe(
		ReporterInvolvementSchema,
		v.minLength(1, 'Reporter involvement is required')
	),
	informed_parties: v.array(InformedPartySchema),
	occurred_at: v.pipe(v.string(), v.minLength(1, 'Occurrence date is required')),
	incident_type: v.pipe(IncidentTypeSchema, v.minLength(1, 'Incident type is required')),
	severity_of_incident: v.pipe(IncidentSeveritySchema, v.minLength(1, 'Severity is required')),
	incident_explanation: v.optional(v.string()),
	recurrence_risk: v.pipe(RecurrenceRiskSchema, v.minLength(1, 'Recurrence risk is required')),
	incident_prevent_steps: v.optional(v.string()),
	incident_taken_measures: v.optional(v.string()),
	cause_categories: v.array(CauseCategorySchema),
	cause_explanation: v.optional(v.string()),
	physical_injury: v.pipe(PhysicalInjurySchema, v.minLength(1, 'Physical injury is required')),
	physical_injury_desc: v.optional(v.string()),
	psychological_damage: v.optional(v.string()),
	psychological_damage_desc: v.optional(v.string()),
	needed_consultation: v.pipe(
		NeededConsultationSchema,
		v.minLength(1, 'Needed consultation is required')
	),
	follow_up_actions: v.array(FollowUpActionSchema),
	follow_up_notes: v.optional(v.string()),
	is_employee_absent: v.optional(v.boolean(), false),
	additional_details: v.optional(v.string()),
	emails: v.pipe(
		v.string(),
		v.check((val) => {
			const emails = val
				.split(/[\n,;]+/)
				.map((e) => e.trim())
				.filter((e) => e.length > 0);

			return emails.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
		}, 'One or more email addresses are invalid')
	)
});

export type IncidentInput = v.InferOutput<typeof IncidentSchema>;
