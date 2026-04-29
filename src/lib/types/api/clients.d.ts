import type { ClientGender } from './common';
import type { ContractCareType, ContractFinancingAct, ContractFinancingOption } from './contracts';
import type { IntakeCareType, IntakeConclusionEnum } from './intake';

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

export interface WaitingListStatsResponse {
	total_clients: number;
	total_crisis: number;
	total_regular: number;
	avg_days_in_waitlist: number;
}

export interface ListWaitingListClientsParams {
	page: number;
	pageSize: number;
	search?: string;
	placement?: string;
	sortDays?: 'asc' | 'desc';
}

export type InCareClientStatus = 'in_care' | 'scheduled_in_care';

export interface ListInCareClientsResponse {
	id: string;
	bsn: string | null;
	first_name: string;
	last_name: string;
	coordinator_name: string | null;
	location_name: string | null;
	status: InCareClientStatus;
	care_start_date: string | null;
	days_in_care: number;
	has_active_contract: boolean;
}

export interface InCareStatsResponse {
	clients_in_care: number;
	clients_scheduled_in_care: number;
	contracts_ending_soon: number;
	total: number;
}

export interface ListInCareClientsParams {
	page: number;
	pageSize: number;
	search?: string;
	status?: InCareClientStatus[];
	sortDaysInCare?: 'asc' | 'desc';
}

export type ClientStatus =
	| 'in_care'
	| 'on_waiting_list'
	| 'scheduled_in_care'
	| 'scheduled_out_of_care'
	| 'out_of_care';

export interface ListClientsResponse {
	id: string;
	first_name: string;
	last_name: string;
	bsn: string;
	filenumber: string;
	location_name: string | null;
	care_type: string | null;
	status: ClientStatus;
	goals_count: number;
	risk_count: number;
	created_at: string;
}

export interface ListClientsParams {
	status?: ClientStatus;
	location_id?: string;
	search?: string;
	page: number;
	pageSize: number;
}

export interface ListClientsData {
	results: ListClientsResponse[];
	total_count: number;
	page: number;
	page_size: number;
}

export interface ClientStatusCountsResponse {
	clients_in_or_scheduled_in_care: number;
	clients_on_waiting_list: number;
	clients_out_or_scheduled_out_of_care: number;
}

export interface PutClientInCareRequest {
	care_start_date: string;
	coordinator_employee_id: string;
	placed_in_care_at?: string;
	reason?: string;
}

export type ClientDischargeReason =
	| 'treatment_completed'
	| 'terminated_by_mutual_agreement'
	| 'terminated_by_client'
	| 'terminated_by_provider'
	| 'terminated_due_to_external_factors'
	| 'other';

export interface PutClientOutOfCareRequest {
	discharge_date: string;
	discharge_reason: ClientDischargeReason;
	final_evaluation?: string;
	reason?: string;
}

export interface PutClientOutOfCareResponse {
	id: string;
	status: 'scheduled_out_of_care' | 'out_of_care';
	discharge_date: string;
	discharge_reason: ClientDischargeReason;
	final_evaluation: string | null;
}

export interface AppointmentCardSections {
	general_information: string[];
	important_contacts: string[];
	household_info: string[];
	organization_agreements: string[];
	youth_officer_agreements: string[];
	treatment_agreements: string[];
	smoking_rules: string[];
	work: string[];
	school_internship: string[];
	travel: string[];
	leave: string[];
}

export interface UpdateAppointmentCardRequest extends AppointmentCardSections {}

export interface GetAppointmentCardResponse extends AppointmentCardSections {
	id: string;
	client_id: string;
	created_at: string;
	updated_at: string;
}

export type DiagnosisStatus = 'suspected' | 'confirmed' | 'resolved' | 'ruled_out';

export type DiagnosisSeverity = 'mild' | 'moderate' | 'severe' | 'unknown';

export type MedicationAdminMode = 'self' | 'staff' | 'shared';

export type MedicationOrderStatus = 'active' | 'paused' | 'stopped' | 'completed';

export interface MedicationScheduleItem {
	time: string;
}

export interface ClientDiagnosisResponse {
	id: string;
	client_id: string;
	code_system: string;
	code: string;
	title: string | null;
	description: string | null;
	status: DiagnosisStatus;
	severity: DiagnosisSeverity;
	diagnosed_on: string | null;
	resolved_on: string | null;
	diagnosing_clinician: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface ClientMedicationOrderResponse {
	id: string;
	client_id: string;
	diagnosis_id: string | null;
	medication_name: string;
	dosage_text: string;
	dose_amount: number | null;
	dose_unit: string | null;
	route: string | null;
	frequency_text: string | null;
	schedule: MedicationScheduleItem[];
	is_prn: boolean;
	prn_indication: string | null;
	max_doses_per_24h: number | null;
	start_date: string;
	end_date: string | null;
	status: string;
	admin_mode: MedicationAdminMode;
	responsible_employee_id: string | null;
	responsible_employee_first_name: string | null;
	responsible_employee_last_name: string | null;
	is_critical: boolean;
	notes: string | null;
	source_attachment_uuid: string | null;
	diagnosis_title: string | null;
	diagnosis_code_system: string | null;
	diagnosis_code: string | null;
	created_at: string;
	updated_at: string;
}

export interface GetClientMedicalOverviewResponse {
	diagnoses: ClientDiagnosisResponse[];
	medication_orders: ClientMedicationOrderResponse[];
}

export interface CreateClientDiagnosisRequest {
	code_system: string;
	code: string;
	title?: string | null;
	description?: string | null;
	status?: DiagnosisStatus | null;
	severity?: DiagnosisSeverity | null;
	diagnosed_on?: string | null;
	resolved_on?: string | null;
	diagnosing_clinician?: string | null;
	notes?: string | null;
}

export interface UpdateClientDiagnosisRequest {
	code_system?: string;
	code?: string;
	title?: string | null;
	description?: string | null;
	status?: DiagnosisStatus | null;
	severity?: DiagnosisSeverity | null;
	diagnosed_on?: string | null;
	resolved_on?: string | null;
	diagnosing_clinician?: string | null;
	notes?: string | null;
}

export interface CreateClientMedicationOrderRequest {
	diagnosis_id?: string | null;
	medication_name: string;
	dosage_text: string;
	dose_amount?: number | null;
	dose_unit?: string | null;
	route?: string | null;
	frequency_text?: string | null;
	schedule?: MedicationScheduleItem[];
	is_prn?: boolean;
	prn_indication?: string | null;
	max_doses_per_24h?: number | null;
	start_date: string;
	end_date?: string | null;
	status?: MedicationOrderStatus | null;
	admin_mode?: MedicationAdminMode | null;
	responsible_employee_id?: string | null;
	is_critical?: boolean;
	notes?: string | null;
	source_attachment_uuid?: string | null;
}

export interface UpdateClientMedicationOrderRequest {
	diagnosis_id?: string | null;
	medication_name?: string;
	dosage_text?: string;
	dose_amount?: number | null;
	dose_unit?: string | null;
	route?: string | null;
	frequency_text?: string | null;
	schedule?: MedicationScheduleItem[];
	is_prn?: boolean;
	prn_indication?: string | null;
	max_doses_per_24h?: number | null;
	start_date?: string;
	end_date?: string | null;
	status?: MedicationOrderStatus | null;
	admin_mode?: MedicationAdminMode | null;
	responsible_employee_id?: string | null;
	is_critical?: boolean;
	notes?: string | null;
	source_attachment_uuid?: string | null;
}

export interface GetClientAddress {
	street: string | null;
	house_number: string | null;
	house_number_addition: string | null;
	postal_code: string | null;
	city: string | null;
}

export interface GetClientLocation {
	id: string | null;
	name: string | null;
}

export interface GetClientSender {
	name: string | null;
	email_address: string | null;
	phone_number: string | null;
}

export interface GetClientEmergencyContact {
	id: string;
	first_name: string;
	last_name: string;
	relationship: string;
	phone_number: string | null;
	email: string | null;
}

export interface GetClientDocuments {
	existing: string[];
	missing: string[];
}

export interface GetClientGoal {
	title: string;
	priority: 'high' | 'medium' | 'low';
	topic_name: string | null;
}

export interface CreateClientGoalRequest {
	title: string;
	description: string;
	priority: 'high' | 'medium' | 'low';
	topic_id: string;
}

export interface CreateClientGoalResponse {
	id: string;
	client_id: string;
	title: string;
	description: string | null;
	priority: string;
	status: string;
	topic_name_snapshot: string | null;
	source: string;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface UpdateClientGoalRequest {
	title: string;
	description: string;
	priority: 'high' | 'medium' | 'low';
	topic_id: string;
	sort_order: number;
}

export interface UpdateClientGoalResponse {
	mutation_type: string;
	goal_id: string;
	replacement_goal_id: string | null;
	goal: CreateClientGoalResponse;
}

export interface GetClientIntake {
	self_sufficiency_score: number | null;
	conclusion: IntakeConclusionEnum | null;
	conclusion_notes: string | null;
}

export interface GetClientRisks {
	flags: string[];
	notes: string | null;
}

export interface GetClientCounts {
	contracts: number;
	incidents: number;
	reports: number;
	evaluations: number;
	documents: number;
	appointments: number;
	upcoming_appointments_count?: number;
	approved_contracts_count?: number;
}

export interface GetClientAlert {
	code: string;
	severity: 'info' | 'warning' | 'critical';
	message: string;
}

export interface GetClientMeta {
	waitlist_since: string | null;
	last_updated_at: string | null;
}

export interface GetClientCareSchedule {
	care_start_date: string | null;
	placed_in_care_at: string | null;
	days_until_start: number | null;
	should_be_active_now: boolean;
	next_evaluation_date: string | null;
}

export interface GetClientCoordinator {
	employee_id: string | null;
	first_name: string | null;
	last_name: string | null;
	start_date: string | null;
}

export interface GetClientStatusTimeline {
	last_change_reason: string | null;
	last_changed_at?: string | null;
	last_status?: ClientStatus | null;
}

export interface GetClientCare {
	care_start_date: string | null;
	placed_in_care_at: string | null;
	days_in_care: number;
	evaluation_intervals_weeks: number;
	last_evaluation_anchor_date: string | null;
	next_evaluation_date: string | null;
}

export interface GetClientContractSummaryActiveContract {
	id: string;
	status: 'approved' | 'submitted' | 'draft' | 'rejected' | string;
	start_date: string | null;
	end_date: string | null;
	financing_act: ContractFinancingAct | null;
	financing_option: ContractFinancingOption | null;
	care_type: ContractCareType | null;
}

export interface GetClientContractSummary {
	has_active_approved_contract: boolean;
	active_contract: GetClientContractSummaryActiveContract | null;
	days_until_contract_end: number | null;
}

export interface GetClientEvaluationSummaryDraft {
	id: string;
	updated_at: string | null;
}

export interface GetClientEvaluationSummaryLastCompleted {
	id: string;
	submitted_at: string | null;
	created_by_employee_id: string | null;
	creator_name: string | null;
}

export interface GetClientEvaluationSummary {
	next_evaluation_date: string | null;
	days_left: number | null;
	priority: 'critical' | 'normal' | null;
	draft: GetClientEvaluationSummaryDraft | null;
	last_completed: GetClientEvaluationSummaryLastCompleted | null;
}

export interface GetClientEducation {
	currently_enrolled: boolean;
	institution: string | null;
	mentor_name: string | null;
	mentor_phone: string | null;
	mentor_email: string | null;
	additional_notes: string | null;
	level: string;
}

export interface GetClientWork {
	currently_employed: boolean;
	current_employer: string | null;
	employer_phone: string | null;
	employer_email: string | null;
	current_position: string | null;
	start_date: string | null;
	additional_notes: string | null;
}

export interface GetClientCore {
	id: string;
	first_name: string;
	last_name: string;
	bsn: string | number | null;
	bsn_verified_by?: string | null;
	bsn_verified_by_name?: string | null;
	file_number: string | number | null;
	gender: ClientGender | null;
	date_of_birth: string | null;
	age: number | null;
	care_type: IntakeCareType | null;
	address: GetClientAddress | null;
	location: GetClientLocation | null;
	education?: GetClientEducation | null;
	work?: GetClientWork | null;
}

export interface GetClientResponse {
	schema_version: number;
	status: ClientStatus;
	client: GetClientCore;
	care?: GetClientCare | null;
	care_schedule?: GetClientCareSchedule | null;
	sender: GetClientSender | null;
	coordinator?: GetClientCoordinator | null;
	contract_summary?: GetClientContractSummary | null;
	evaluation_summary?: GetClientEvaluationSummary | null;
	emergency_contacts: GetClientEmergencyContact[];
	documents: GetClientDocuments;
	goals: GetClientGoal[];
	intake: GetClientIntake | null;
	risks: GetClientRisks | null;
	counts: GetClientCounts;
	alerts: GetClientAlert[];
	meta?: GetClientMeta;
	status_timeline?: GetClientStatusTimeline | null;
}

export type ProgressReportType =
	| 'morning_report'
	| 'evening_report'
	| 'night_report'
	| 'shift_report'
	| 'one_to_one_report'
	| 'process_report'
	| 'contact_journal'
	| 'other';

export type EmotionalState =
	| 'normal'
	| 'excited'
	| 'happy'
	| 'sad'
	| 'angry'
	| 'anxious'
	| 'depressed';

export interface ProgressReport {
	id: string;
	client_id: string;
	date: string;
	title: string | null;
	report_text: string;
	employee_id: string | null;
	type: ProgressReportType;
	emotional_state: EmotionalState;
	created_at: string;
	employee_first_name: string;
	employee_last_name: string;
	employee_profile_picture?: string | null;
}

export interface GetProgressReportResponse {
	id: string;
	client_id: string;
	date: string;
	title: string | null;
	report_text: string;
	employee_id: string | null;
	type: ProgressReportType;
	emotional_state: EmotionalState;
	created_at: string;
	employee_first_name: string;
	employee_last_name: string;
	employee_profile_picture: string | null;
}

export interface CreateProgressReportRequest {
	employee_id?: string | null;
	title?: string | null;
	date: string;
	report_text: string;
	type: ProgressReportType;
	emotional_state: EmotionalState;
}

export interface UpdateProgressReportRequest {
	client_id: string;
	employee_id?: string | null;
	title?: string | null;
	date: string;
	report_text?: string | null;
	type?: ProgressReportType | null;
	emotional_state?: EmotionalState | null;
}

export interface UpdateProgressReportResponse {
	id: string;
	client_id: string;
	date: string;
	title: string | null;
	report_text: string;
	employee_id: string | null;
	type: ProgressReportType;
	emotional_state: EmotionalState;
	created_at: string;
	employee_first_name: string;
	employee_last_name: string;
	employee_profile_picture: string | null;
}

export interface ListProgressReportsResponse {
	id: string;
	client_id: string;
	date: string;
	title: string | null;
	employee_id: string | null;
	type: ProgressReportType;
	emotional_state: EmotionalState;
	created_at: string;
	employee_first_name: string;
	employee_last_name: string;
	employee_profile_picture: string | null;
}

export interface ListProgressReportsParams {
	page: number;
	page_size: number;
	type?: ProgressReportType;
}

export interface CreateClientEmergencyContactParams {
	first_name?: string;
	last_name?: string;
	email?: string;
	phone_number?: string;
	address?: string;
	relationship?: string;
	relation_status?: string;
	medical_reports: boolean;
	incidents_reports: boolean;
	goals_reports: boolean;
}

export interface CreateClientEmergencyContactResponse {
	id: string;
	client_id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	phone_number: string | null;
	address: string | null;
	relationship: string | null;
	relation_status: string | null;
	created_at: string;
	is_verified: boolean;
	medical_reports: boolean;
	incidents_reports: boolean;
	goals_reports: boolean;
}

export interface ListClientEmergencyContactsParams {
	page: number;
	page_size: number;
	search?: string;
}

export type ListClientEmergencyContactsResponse =
	PaginatedResponse<CreateClientEmergencyContactResponse>;

export interface UpdateClientRequest {
	first_name: string;
	last_name: string;
	date_of_birth?: string | null;
	identity?: boolean;
	bsn?: string | null;
	bsn_verified_by?: string | null;
	nationality?: string | null;
	email?: string | null;
	phone_number?: string | null;
	gender?: ClientGender | null;
	filenumber?: string | null;
	sender_id?: string | null;
	location_id?: string | null;
	education_currently_enrolled?: boolean;
	education_institution?: string | null;
	education_mentor_name?: string | null;
	education_mentor_phone?: string | null;
	education_mentor_email?: string | null;
	education_additional_notes?: string | null;
	education_level?: string | null;
	work_currently_employed?: boolean;
	work_current_employer?: string | null;
	work_employer_phone?: string | null;
	work_employer_email?: string | null;
	work_current_position?: string | null;
	work_start_date?: string | null;
	work_additional_notes?: string | null;
}
