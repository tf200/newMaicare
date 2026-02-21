import type { IncidentSeverity, IncidentType } from '$lib/types/incidents';

export interface IncidentListItemResponse {
	id: string;
	client_id?: string;
	occurred_at: string;
	incident_type: IncidentType;
	severity_of_incident: IncidentSeverity;
	is_confirmed: boolean;
	client_first_name: string;
	client_last_name: string;
	client_bsn: string | null;
	employee_first_name: string;
	employee_last_name: string;
	location_name: string;
}

export type IncidentReporterInvolvement =
	| 'directly_involved'
	| 'witness'
	| 'found_afterwards'
	| 'alarmed';

export type IncidentInformedParty =
	| 'parents_guardians'
	| 'care_coordinator'
	| 'referrer'
	| 'healthcare_provider'
	| 'inspectorate'
	| 'police'
	| 'other';

export type IncidentRecurrenceRisk = 'very_low' | 'means' | 'high' | 'very_high';

export type IncidentCauseCategory =
	| 'internal_personal'
	| 'external_environmental'
	| 'organizational'
	| 'technical'
	| 'employee_related'
	| 'client_related'
	| 'other';

export type IncidentPhysicalInjury =
	| 'no_injuries'
	| 'not_noticeable_yet'
	| 'bruising_swelling'
	| 'skin_injury'
	| 'broken_bones'
	| 'shortness_of_breath'
	| 'death'
	| 'other';

export type IncidentPsychologicalDamage =
	| 'no'
	| 'not_noticeable_yet'
	| 'drowsiness'
	| 'unrest'
	| 'other';

export type IncidentNeededConsultation = 'no' | 'not_clear' | 'hospitalization' | 'consult_gp';

export type IncidentFollowUpAction =
	| 'medical_check'
	| 'family_contact'
	| 'internal_review'
	| 'official_report'
	| 'notify_inspectorate'
	| 'other';

export interface IncidentDetailResponse {
	id: string;
	employee_id: string;
	employee_first_name: string;
	employee_last_name: string;
	location_id: string;
	reporter_involvement: IncidentReporterInvolvement;
	informed_parties: IncidentInformedParty[];
	occurred_at: string;
	incident_type: IncidentType;
	severity_of_incident: IncidentSeverity;
	incident_explanation: string | null;
	recurrence_risk: IncidentRecurrenceRisk;
	incident_prevent_steps: string | null;
	incident_taken_measures: string | null;
	cause_categories: IncidentCauseCategory[];
	cause_explanation: string | null;
	physical_injury: IncidentPhysicalInjury;
	physical_injury_desc: string | null;
	psychological_damage: IncidentPsychologicalDamage;
	psychological_damage_desc: string | null;
	needed_consultation: IncidentNeededConsultation;
	follow_up_actions: IncidentFollowUpAction[];
	follow_up_notes: string | null;
	is_employee_absent: boolean;
	additional_details: string | null;
	client_id: string;
	updated_at: string;
	created_at: string;
	is_confirmed: boolean;
	location_name: string;
	emails: string[];
	client_first_name?: string;
	client_last_name?: string;
	client_bsn?: string | null;
}

export interface ListIncidentsParams {
	page: number;
	pageSize: number;
	isConfirmed?: boolean;
	search?: string;
}

export type CreateIncidentInformedParty = 'family' | 'manager';

export interface CreateIncidentRequest {
	client_id: string;
	employee_id?: string;
	location_id?: string;
	reporter_involvement: IncidentReporterInvolvement;
	informed_parties?: CreateIncidentInformedParty[];
	occurred_at?: string;
	incident_type: IncidentType;
	severity_of_incident: IncidentSeverity;
	incident_explanation?: string | null;
	recurrence_risk: IncidentRecurrenceRisk;
	incident_prevent_steps?: string | null;
	incident_taken_measures?: string | null;
	cause_categories?: string[];
	cause_explanation?: string | null;
	physical_injury: IncidentPhysicalInjury;
	physical_injury_desc?: string | null;
	psychological_damage?: string;
	psychological_damage_desc?: string | null;
	needed_consultation: IncidentNeededConsultation;
	follow_up_actions?: string[];
	follow_up_notes?: string | null;
	is_employee_absent?: boolean;
	additional_details?: string | null;
	emails?: string[];
}
