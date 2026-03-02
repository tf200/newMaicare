import type { ClientGender, EducationLevel, FormStatus } from './common';

export type IntakeCareType =
	| 'protected_living'
	| 'training_center'
	| 'supported_independent_living'
	| 'ambulatory_support'
	| 'other';

export type IntakeParticipantsEnum =
	| 'client'
	| 'referrer'
	| 'parents/guardians'
	| 'care_coordinator'
	| 'other';

export type IntakeConclusionEnum =
	| 'suitable'
	| 'unsuitable'
	| 'further_investigation'
	| 'possible_palcement_date'
	| 'other';

export interface RegistrationRequest {
	client_first_name: string;
	client_last_name: string;
	client_bsn_number: string;
	client_gender: ClientGender;
	client_nationality: string;
	client_phone_number: string;
	client_email: string;
	client_date_of_birth: string;
	client_street: string;
	client_house_number: string;
	client_house_number_addition?: string;
	client_postal_code: string;
	client_city: string;
	referrer_first_name: string;
	referrer_last_name: string;
	referrer_organization: string;
	referrer_job_title: string;
	referrer_phone_number: string;
	referrer_email: string;
	referrer_signature?: boolean;
	guardian1_first_name: string;
	guardian1_last_name: string;
	guardian1_relationship: string;
	guardian1_phone_number: string;
	guardian1_email: string;
	guardian2_first_name?: string;
	guardian2_last_name?: string;
	guardian2_relationship?: string;
	guardian2_phone_number?: string;
	guardian2_email?: string;
	education_institution?: string;
	education_mentor_name?: string;
	education_mentor_phone?: string;
	education_mentor_email?: string;
	education_currently_enrolled: boolean;
	education_additional_notes?: string;
	education_level?: EducationLevel;
	work_current_employer?: string;
	work_employer_phone?: string;
	work_employer_email?: string;
	work_current_position?: string;
	work_currently_employed: boolean;
	work_start_date?: string;
	work_additional_notes?: string;
	care_protected_living?: boolean;
	care_assisted_independent_living?: boolean;
	care_room_training_center?: boolean;
	care_ambulatory_guidance?: boolean;
	risk_aggressive_behavior?: boolean;
	risk_suicidal_selfharm?: boolean;
	risk_substance_abuse?: boolean;
	risk_psychiatric_issues?: boolean;
	risk_criminal_history?: boolean;
	risk_flight_behavior?: boolean;
	risk_weapon_possession?: boolean;
	risk_sexual_behavior?: boolean;
	risk_day_night_rhythm?: boolean;
	risk_other?: boolean;
	risk_other_description?: string;
	risk_additional_notes?: string;
	document_referral?: string | null;
	document_education_report?: string | null;
	document_psychiatric_report?: string | null;
	document_diagnosis?: string | null;
	document_safety_plan?: string | null;
	document_id_copy?: string | null;
	application_date: string;
	client_goals?: string[];
	application_reason?: string;
}

export interface GetRegistrationFormResponse extends RegistrationRequest {
	id: string;
	risk_count: number;
	form_status: FormStatus;
	intake_form_id?: string | null;
	processed_by_employee_name?: string | null;
	admission_type?: string | null;
	intake_appointment_location?: string | null;
	intake_appointment_date?: string | null;
	intake_options?: string[] | null;
	submitted_at: string;
	updated_at: string;
}

export interface ProcessRegistrationRequest {
	intake_appointment_location: string;
	admission_type: string;
	proposed_dates: string[];
}

export interface UpdateRegistrationFormRequest extends Partial<
	Omit<
		RegistrationRequest,
		| 'document_referral'
		| 'document_education_report'
		| 'document_psychiatric_report'
		| 'document_diagnosis'
		| 'document_safety_plan'
		| 'document_id_copy'
	>
> {
	client_gender?: ClientGender | 'unknown';
}

export interface ListRegistrationFormsResponse {
	id: string;
	client_first_name: string;
	client_last_name: string;
	client_bsn_number: string;
	referrer_first_name: string;
	referrer_last_name: string;
	care_protected_living: boolean | null;
	care_assisted_independent_living: boolean | null;
	care_room_training_center: boolean | null;
	care_ambulatory_guidance: boolean | null;
	risk_count: number;
	form_status: FormStatus;
	intake_form_id?: string | null;
	submitted_at: string;
}

export interface ListRegistrationFormsParams {
	page?: number;
	pageSize?: number;
	search?: string;
	status?: FormStatus;
	riskAggressiveBehavior?: boolean;
	riskSuicidalSelfharm?: boolean;
	riskSubstanceAbuse?: boolean;
	riskPsychiatricIssues?: boolean;
	riskCriminalHistory?: boolean;
	riskFlightBehavior?: boolean;
	riskWeaponPossession?: boolean;
	riskSexualBehavior?: boolean;
	riskDayNightRhythm?: boolean;
}

export interface AssignedLocationAddress {
	name?: string | null;
	street?: string | null;
	house_number?: string | null;
	house_number_addition?: string | null;
	postal_code?: string | null;
	city?: string | null;
}

export interface ListIntakeFormsResponse {
	id: string;
	registration_form_id: string;
	client_first_name: string;
	client_last_name: string;
	client_bsn_number: string;
	intake_status: IntakeConclusionEnum;
	goal_assessment_done: boolean;
	has_client: boolean;
	care_type: IntakeCareType;
	assigned_location_id?: string | null;
	assigned_location_address?: AssignedLocationAddress | null;
	date_of_intake?: string | null;
}

export interface ListIntakeFormsParams {
	page?: number;
	pageSize?: number;
	search?: string;
	status?: IntakeConclusionEnum;
	sortOrder?: 'asc' | 'desc';
}

export interface IntakeFormsTotalsResponse {
	further_investigation_total: number;
	without_goals_total: number;
}

export interface IntakeFormLocationDetails {
	name: string | null;
	street: string | null;
	house_number: string | null;
	house_number_addition: string | null;
	postal_code: string | null;
	city: string | null;
}

export interface MaturityGoal {
	title: string;
	description: string;
	priority: 'high' | 'medium' | 'low';
}

export interface IntakeGoalTopic {
	assessment_id: string;
	topic_id: string;
	topic_name: string;
	current_level: number;
	proposed_goals: MaturityGoal[];
	notes: string | null;
}

export interface GetIntakeFormResponse {
	id: string;
	registration_form_id: string;
	date_of_intake: string;
	care_type: IntakeCareType;
	intake_participants: IntakeParticipantsEnum[];
	family_situation: string | null;
	psychological_state: string | null;
	self_sufficiency: number;
	sender_id: string | null;
	assigned_location_id: string | null;
	risk_assessment: string | null;
	intake_conclusion: IntakeConclusionEnum;
	intake_conclusion_notes: string | null;
	evaluation_intervals_weeks: number;
	signature: string | null;
	created_at: string;
	updated_at: string;
	client_first_name: string;
	client_last_name: string;
	client_bsn_number: string;
	desired_goals: string[];
	sender_name: string | null;
	location: IntakeFormLocationDetails | null;
	intake_goals_assigned: IntakeGoalTopic[];
	has_client: boolean;
}

export interface CreateIntakeFormGoalItem {
	topic_id: string;
	current_level: number;
	proposed_goals: MaturityGoal[];
	notes: string | null;
}

export interface CreateIntakeFormGoalsRequest {
	assessments: CreateIntakeFormGoalItem[];
}

export interface UpdateIntakeConclusionRequest {
	decision: 'accept' | 'refuse';
	intake_conclusion_notes?: string;
}

export interface UpdateIntakeConclusionResponse {
	id: string;
	intake_conclusion: IntakeConclusionEnum;
	intake_conclusion_notes: string | null;
	updated_at: string;
}

export interface PromoteIntakeResponse {
	client_id: string;
	intake_form_id: string;
	registration_form_id: string;
	maturity_assessments_created: number;
	emergency_contacts_created: number;
}

export interface CreateIntakeRequest {
	registration_form_id: string;
	date_of_intake: string;
	care_type: IntakeCareType;
	intake_participants: IntakeParticipantsEnum[];
	family_situation?: string;
	psychological_state?: string;
	self_sufficiency: number;
	evaluation_interval_weeks: number;
	sender_id?: string;
	assigned_location_id?: string;
	risk_assessment?: string;
	intake_conclusion: IntakeConclusionEnum;
	intake_conclusion_notes?: string;
	signature?: string;
}

export interface UpdateIntakeRequest {
	date_of_intake?: string;
	care_type?: IntakeCareType;
	intake_participants?: IntakeParticipantsEnum[];
	family_situation?: string;
	psychological_state?: string;
	self_sufficiency?: number;
	evaluation_interval_weeks?: number;
	sender_id?: string;
	assigned_location_id?: string;
	risk_assessment?: string;
	intake_conclusion?: IntakeConclusionEnum;
	intake_conclusion_notes?: string;
	signature?: string;
}

export interface IntakeFormResponse extends CreateIntakeRequest {
	id: string;
	created_at: string;
}

export interface MaturityMatrixLevelDescription {
	level: number;
	name: string;
	description: string;
}

export interface ListCarePlanTopics {
	id: string;
	topic_name: string;
	level_descriptions: MaturityMatrixLevelDescription[];
}

export interface GenerateGoalsResponse {
	goals: MaturityGoal[];
}
