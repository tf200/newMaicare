export type IncidentType =
	| 'passing_away'
	| 'self_harm'
	| 'violence'
	| 'fire_water_damage'
	| 'accident'
	| 'client_absence'
	| 'medicines'
	| 'organization'
	| 'use_prohibited_substances'
	| 'other';

export type IncidentSeverity = 'near_incident' | 'less_serious' | 'serious' | 'fatal';

export type ReporterInvolvement = 'directly_involved' | 'witness' | 'found_afterwards' | 'alarmed';

export type InformedParty =
	| 'parents_guardians'
	| 'care_coordinator'
	| 'referrer'
	| 'healthcare_provider'
	| 'inspectorate'
	| 'police'
	| 'other';

export type RecurrenceRisk = 'very_low' | 'means' | 'high' | 'very_high';

export type CauseCategory =
	| 'internal_personal'
	| 'external_environmental'
	| 'external'
	| 'organizational'
	| 'technical'
	| 'employee_related'
	| 'client_related'
	| 'other';

export type PhysicalInjury =
	| 'no_injuries'
	| 'not_noticeable_yet'
	| 'bruising_swelling'
	| 'skin_injury'
	| 'broken_bones'
	| 'shortness_of_breath'
	| 'death'
	| 'other';

export type PsychologicalDamage = 'no' | 'not_noticeable_yet' | 'drowsiness' | 'unrest' | 'other';

export type NeededConsultation = 'no' | 'not_clear' | 'hospitalization' | 'consult_gp';

export type FollowUpAction =
	| 'medical_check'
	| 'family_contact'
	| 'internal_review'
	| 'official_report'
	| 'notify_inspectorate'
	| 'notify_referrer'
	| 'other';

export interface Incident {
	id: string;
	clientId?: string;
	incidentType: IncidentType;
	severity: IncidentSeverity;
	isConfirmed: boolean;
	occurredAt: string;
	employeeFirstName: string;
	employeeLastName: string;
	locationName: string;
	clientFirstName: string;
	clientLastName: string;
	clientBsnNumber?: string;
	reporterInvolvement?: ReporterInvolvement;
}

export interface IncidentDetail extends Incident {
	employeeId: string;
	locationId: string;
	informedParties: InformedParty[];
	incidentExplanation: string | null;
	recurrenceRisk: RecurrenceRisk;
	incidentPreventSteps: string | null;
	incidentTakenMeasures: string | null;
	causeCategories: CauseCategory[];
	causeExplanation: string | null;
	physicalInjury: PhysicalInjury;
	physicalInjuryDesc: string | null;
	psychologicalDamage: PsychologicalDamage;
	psychologicalDamageDesc: string | null;
	neededConsultation: NeededConsultation;
	followUpActions: FollowUpAction[];
	followUpNotes: string | null;
	isEmployeeAbsent: boolean;
	additionalDetails: string | null;
	clientId: string;
	updatedAt: string;
	createdAt: string;
	emails: string[];
}

export interface IncidentStats {
	total: number;
	pendingConfirmation: number;
	seriousOrFatal: number;
	thisMonth: number;
}
