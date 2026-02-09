export interface ApiEnvelope<T> {
	data: T;
	message: string;
	success: boolean;
}

export interface PaginatedResponse<T> {
	next: string | null;
	previous: string | null;
	count: number;
	page_size: number;
	results: T[];
}

export interface OrganizationListItem {
	id: string;
	name: string;
	street: string;
	house_number: string;
	house_number_addition: string | null;
	postal_code: string;
	city: string;
	email: string | null;
	kvk_number: string | null;
	btw_number: string | null;
	location_count: number;
}

export interface GetOrganizationResponse {
	id: string;
	name: string;
	street: string;
	house_number: string;
	house_number_addition: string | null;
	postal_code: string;
	city: string;
	email: string | null;
	kvk_number: string | null;
	btw_number: string | null;
	location_count: number;
	created_at: string;
	updated_at: string;
}

export interface OrganizationCounts {
	client_count: number;
	employee_count: number;
	location_count: number;
	organisation_id: string;
	organisation_name: string;
}

export interface OrganizationLocation {
	id: string;
	name: string;
	street: string;
	house_number: string;
	house_number_addition: string | null;
	postal_code: string;
	city: string;
	capacity: number | null;
	occupied: number;
	available: number;
	created_at: string;
	updated_at: string;
}

export interface SenderContact {
	name?: string | null;
	email?: string | null;
	phone_number?: string | null;
}

export interface TemplateItem {
	id: string;
	item_tag: string;
	description: string;
	source_table: string;
	source_column: string;
}

export interface GetSenderByIdResponse {
	id: string;
	types: string;
	name: string;
	street: string | null;
	house_number: string | null;
	house_number_addition: string | null;
	postal_code: string | null;
	city: string | null;
	land: string | null;
	KVKnumber: string | null;
	BTWnumber: string | null;
	phone_number: string | null;
	client_number: string | null;
	email_address: string | null;
	contacts: SenderContact[];
	invoice_template_items: TemplateItem[];
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

export interface UpdateSenderRequest {
	name?: string;
	street?: string;
	house_number?: string;
	house_number_addition?: string;
	postal_code?: string;
	city?: string;
	land?: string;
	KVKnumber?: string;
	BTWnumber?: string;
	phone_number?: string;
	client_number?: string;
	email_address?: string;
	contacts?: SenderContact[];
	is_archived?: boolean;
	types?: 'main_provider' | 'local_authority' | 'particular_party' | 'healthcare_institution';
}

export interface UpdateSenderResponse {
	id: string;
	types: string;
	name: string;
	street: string | null;
	house_number: string | null;
	house_number_addition: string | null;
	postal_code: string | null;
	city: string | null;
	land: string | null;
	KVKnumber: string | null;
	BTWnumber: string | null;
	phone_number: string | null;
	client_number: string | null;
	email_address: string | null;
	contacts: SenderContact[];
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

export interface SenderListItem {
	id: string;
	types: string;
	name: string;
	street: string | null;
	house_number: string | null;
	house_number_addition: string | null;
	postal_code: string | null;
	city: string | null;
	land: string | null;
	KVKnumber: string | null;
	BTWnumber: string | null;
	phone_number: string | null;
	client_number: string | null;
	clients_count: number | null;
	contacts: SenderContact[];
	created_at: string;
	updated_at: string;
}

export interface CreateSenderRequest {
	types: string;
	name: string;
	street?: string;
	house_number?: string;
	house_number_addition?: string;
	postal_code?: string;
	city?: string;
	land?: string;
	KVKnumber?: string;
	BTWnumber?: string;
	phone_number?: string;
	client_number?: string;
	contacts: SenderContact[];
}

export interface CreateOrganizationRequest {
	name: string;
	street: string;
	house_number: string;
	house_number_addition?: string;
	postal_code: string;
	city: string;
	email?: string;
	kvk_number?: string;
	btw_number?: string;
}

export interface CreateLocationRequest {
	name: string;
	street: string;
	house_number: string;
	house_number_addition?: string;
	postal_code: string;
	city: string;
	capacity?: number;
}

export interface UpdateLocationRequest {
	name?: string;
	street?: string;
	house_number?: string;
	house_number_addition?: string;
	postal_code?: string;
	city?: string;
	capacity?: number;
}

export interface UpdateOrganizationRequest {
	name?: string;
	street?: string;
	house_number?: string;
	house_number_addition?: string;
	postal_code?: string;
	city?: string;
	email?: string;
	kvk_number?: string;
	btw_number?: string;
}

export interface User {
	id: string;
	email: string;
	role: 'admin' | 'user';
	name: string;
	avatar?: string;
}

export interface Permission {
	id: string;
	method: string;
	name: string;
	resource: string;
}

export interface EmployeeProfile {
	email: string;
	employee_id: string;
	first_name: string;
	last_login: string;
	last_name: string;
	permissions: Permission[];
	role_id: string;
	two_factor_enabled: boolean;
	user_id: string;
}

export interface AuthTokenData {
	access: string;
	refresh: string;
	requires_2fa: boolean;
	temp_token: string;
}

export interface RefreshTokenData {
	access: string;
	refresh?: string;
}

export interface InitUploadRequest {
	filename: string;
	content_type: string;
	size: number;
}

export interface InitUploadResponse {
	upload_url: string;
	file_id: string;
	key: string;
}

export interface ConfirmUploadRequest {
	file_id: string;
}

export interface ConfirmUploadResponse {
	file_url: string;
	file_id: string;
	created_at: string;
	size: number;
}

export interface AuthRequest {
	email: string;
	password: string;
}

export interface TwoFactorRequest {
	temp_token: string;
	validation_code: string;
}

export type FormStatus = 'pending' | 'processed';
export type ClientGender = 'male' | 'female' | 'other';
export type EducationLevel = 'primary' | 'secondary' | 'higher' | 'none';

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

export interface IntakeFormLocationDetails {
	name: string | null;
	street: string | null;
	house_number: string | null;
	house_number_addition: string | null;
	postal_code: string | null;
	city: string | null;
}

export interface IntakeGoalTopic {
	assessment_id: string; // uuid
	topic_id: string; // uuid
	topic_name: string;
	current_level: number;
	proposed_goals: MaturityGoal[];
	notes: string | null;
}

export interface GetIntakeFormResponse {
	id: string; // uuid
	registration_form_id: string; // uuid
	date_of_intake: string; // time.Time
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
	topic_id: string; // uuid
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
	registration_form_id: string; // uuid
	date_of_intake: string; // time.Time (ISO string)
	care_type: IntakeCareType;
	intake_participants: IntakeParticipantsEnum[];
	family_situation?: string; // *string
	psychological_state?: string; // *string
	self_sufficiency: number; // int32
	evaluation_interval_weeks: number; // int32
	sender_id?: string; // *uuid.UUID
	assigned_location_id?: string; // *uuid.UUID
	risk_assessment?: string; // *string
	intake_conclusion: IntakeConclusionEnum;
	intake_conclusion_notes?: string; // *string
	signature?: string; // *string
}

export interface IntakeFormResponse extends CreateIntakeRequest {
	id: string;
	created_at: string;
}

export interface MaturityGoal {
	title: string;
	description: string;
	priority: 'high' | 'medium' | 'low';
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

export interface ListWaitingListClientsResponse {
	id: string;
	first_name: string;
	last_name: string;
	care_type: string | null;
	bsn: string;
	sender_name: string | null;
	days_in_waitlist: number;
	admission_type: 'crisis_admission' | 'regular_placement' | null;
}

export interface ListWaitingListClientsParams {
	page: number;
	pageSize: number;
	search?: string;
	placement?: string;
	sortDays?: 'asc' | 'desc';
}

export interface PutClientInCareRequest {
	care_start_date: string;
	coordinator_employee_id: string;
	placed_in_care_at?: string;
	reason?: string;
}
