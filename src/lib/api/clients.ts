import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	ListClientsData,
	ClientStatusCountsResponse,
	ListClientsParams,
	ListClientContractsResponse,
	ListInCareClientsParams,
	ListInCareClientsResponse,
	GetClientResponse,
	ListWaitingListClientsParams,
	ListWaitingListClientsResponse,
	PutClientInCareRequest,
	PutClientOutOfCareRequest,
	PutClientOutOfCareResponse,
	GetAppointmentCardResponse,
	UpdateAppointmentCardRequest,
	PaginatedResponse,
	GetClientMedicalOverviewResponse,
	CreateClientDiagnosisRequest,
	UpdateClientDiagnosisRequest,
	ClientDiagnosisResponse,
	CreateClientMedicationOrderRequest,
	ClientMedicationOrderResponse,
	UpdateClientMedicationOrderRequest,
	ListProgressReportsParams,
	ListProgressReportsResponse,
	CreateProgressReportRequest,
	ProgressReport,
	GetProgressReportResponse,
	UpdateProgressReportRequest,
	UpdateProgressReportResponse,
	CreateClientGoalRequest,
	CreateClientGoalResponse,
	GenerateGoalsResponse,
	UpdateClientGoalRequest,
	UpdateClientGoalResponse,
	CreateClientEmergencyContactParams,
	CreateClientEmergencyContactResponse,
	ListClientEmergencyContactsParams,
	ListClientEmergencyContactsResponse
} from '$lib/types/api';

export function listWaitingListClients(params: ListWaitingListClientsParams) {
	const searchParams = new URLSearchParams();

	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));
	searchParams.set('sort_days', params.sortDays ?? 'desc');

	if (params.search) {
		searchParams.set('search', params.search);
	}

	if (params.placement) {
		searchParams.set('placement', params.placement);
	}

	const query = searchParams.toString();

	return api.get<ApiEnvelope<PaginatedResponse<ListWaitingListClientsResponse>>>(
		`/clients/waiting-list?${query}`
	);
}

export function getClientById(id: string) {
	return api.get<ApiEnvelope<GetClientResponse>>(`/clients/${id}`);
}

export function putClientInCare(id: string, payload: PutClientInCareRequest) {
	return api.put<ApiEnvelope<unknown>>(`/clients/${id}/put-in-care`, payload);
}

export function putClientOutOfCare(id: string, payload: PutClientOutOfCareRequest) {
	return api.put<ApiEnvelope<PutClientOutOfCareResponse>>(
		`/clients/${id}/put-out-of-care`,
		payload
	);
}

export function listInCareClients(params: ListInCareClientsParams) {
	const searchParams = new URLSearchParams();

	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));
	searchParams.set('sort_days_in_care', params.sortDaysInCare ?? 'desc');

	if (params.search) {
		searchParams.set('search', params.search);
	}

	for (const status of params.status ?? []) {
		searchParams.append('status', status);
	}

	const query = searchParams.toString();

	return api.get<ApiEnvelope<PaginatedResponse<ListInCareClientsResponse>>>(
		`/clients/in-care?${query}`
	);
}

export function listClients(params: ListClientsParams) {
	const searchParams = new URLSearchParams();

	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.pageSize));

	if (params.search) {
		searchParams.set('search', params.search);
	}

	if (params.status) {
		searchParams.set('status', params.status);
	}

	if (params.location_id) {
		searchParams.set('location_id', params.location_id);
	}

	const query = searchParams.toString();

	return api.get<ApiEnvelope<ListClientsData>>(`/clients?${query}`);
}

export function getClientStatusCounts() {
	return api.get<ApiEnvelope<ClientStatusCountsResponse>>('/clients/status-counts');
}

export function listClientContracts(id: string, page: number, pageSize: number) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(page));
	searchParams.set('page_size', String(pageSize));

	return api.get<ApiEnvelope<PaginatedResponse<ListClientContractsResponse>>>(
		`/clients/${id}/contracts?${searchParams.toString()}`
	);
}

export function getClientAppointmentCard(id: string) {
	return api.get<ApiEnvelope<GetAppointmentCardResponse>>(`/clients/${id}/appointment_cards`);
}

export function upsertClientAppointmentCard(id: string, payload: UpdateAppointmentCardRequest) {
	return api.put<ApiEnvelope<unknown>>(`/clients/${id}/appointment_cards`, payload);
}

export function generateClientAppointmentCardDocument(id: string) {
	return api.postBlob(`/clients/${id}/appointment_cards/generate_document`);
}

export function getClientMedicalOverview(id: string) {
	return api.get<ApiEnvelope<GetClientMedicalOverviewResponse>>(`/clients/${id}/medical/overview`);
}

export function createClientDiagnosis(id: string, payload: CreateClientDiagnosisRequest) {
	return api.post<ApiEnvelope<ClientDiagnosisResponse>>(
		`/clients/${id}/medical/diagnoses`,
		payload
	);
}

export function getClientDiagnosis(clientId: string, diagnosisId: string) {
	return api.get<ApiEnvelope<ClientDiagnosisResponse>>(
		`/clients/${clientId}/medical/diagnoses/${diagnosisId}`
	);
}

export function updateClientDiagnosis(
	clientId: string,
	diagnosisId: string,
	payload: UpdateClientDiagnosisRequest
) {
	return api.put<ApiEnvelope<ClientDiagnosisResponse>>(
		`/clients/${clientId}/medical/diagnoses/${diagnosisId}`,
		payload
	);
}

export function createClientMedicationOrder(
	id: string,
	payload: CreateClientMedicationOrderRequest
) {
	return api.post<ApiEnvelope<ClientMedicationOrderResponse>>(
		`/clients/${id}/medical/medication-orders`,
		payload
	);
}

export function getClientMedicationOrder(clientId: string, orderId: string) {
	return api.get<ApiEnvelope<ClientMedicationOrderResponse>>(
		`/clients/${clientId}/medical/medication-orders/${orderId}`
	);
}

export function updateClientMedicationOrder(
	clientId: string,
	orderId: string,
	payload: UpdateClientMedicationOrderRequest
) {
	return api.put<ApiEnvelope<ClientMedicationOrderResponse>>(
		`/clients/${clientId}/medical/medication-orders/${orderId}`,
		payload
	);
}

export function listClientProgressReports(id: string, params: ListProgressReportsParams) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.page_size));

	if (params.type) {
		searchParams.set('type', params.type);
	}

	return api.get<ApiEnvelope<PaginatedResponse<ListProgressReportsResponse>>>(
		`/clients/${id}/progress_reports?${searchParams.toString()}`
	);
}

export function createClientProgressReport(id: string, payload: CreateProgressReportRequest) {
	return api.post<ApiEnvelope<ProgressReport>>(`/clients/${id}/progress_reports`, payload);
}

export function getClientProgressReport(clientId: string, reportId: string, signal?: AbortSignal) {
	return api.get<ApiEnvelope<GetProgressReportResponse>>(
		`/clients/${clientId}/progress_reports/${reportId}`,
		signal ? { signal } : undefined
	);
}

export function updateClientProgressReport(
	clientId: string,
	reportId: string,
	payload: UpdateProgressReportRequest
) {
	return api.put<ApiEnvelope<UpdateProgressReportResponse>>(
		`/clients/${clientId}/progress_reports/${reportId}`,
		payload
	);
}

export function deleteClientProgressReport(clientId: string, reportId: string) {
	return api.delete<ApiEnvelope<null>>(`/clients/${clientId}/progress_reports/${reportId}`);
}

export interface ClientDocument {
	attachment_id: string;
	client_id: string;
	label: string;
	name: string;
	file: string;
	size: number;
	is_used: boolean;
	tag: string;
	updated: string;
	created: string;
}

export interface AddClientDocumentsRequest {
	documents: { attachment_id: string; label: string }[];
}

export interface AddClientDocumentsResponse {
	documents: ClientDocument[];
}

export function addClientDocuments(
	clientId: string,
	documents: { attachment_id: string; label: string }[]
) {
	return api.post<ApiEnvelope<AddClientDocumentsResponse>>(`/clients/${clientId}/documents`, {
		documents
	});
}

export function createClientGoal(clientId: string, payload: CreateClientGoalRequest) {
	return api.post<ApiEnvelope<CreateClientGoalResponse>>(`/clients/${clientId}/goals`, payload);
}

export function generateClientGoalSuggestion(clientId: string, topicId: string) {
	return api.post<ApiEnvelope<GenerateGoalsResponse>>(`/clients/${clientId}/goals/generate`, {
		topic_id: topicId
	});
}

export function updateClientGoal(
	clientId: string,
	goalId: string,
	payload: UpdateClientGoalRequest
) {
	return api.patch<ApiEnvelope<UpdateClientGoalResponse>>(
		`/clients/${clientId}/goals/${goalId}`,
		payload
	);
}

export function createClientEmergencyContact(
	clientId: string,
	payload: CreateClientEmergencyContactParams
) {
	return api.post<ApiEnvelope<CreateClientEmergencyContactResponse>>(
		`/clients/${clientId}/emergency_contacts`,
		payload
	);
}

export function listClientEmergencyContacts(
	clientId: string,
	params: ListClientEmergencyContactsParams
) {
	const searchParams = new URLSearchParams();
	searchParams.set('page', String(params.page));
	searchParams.set('page_size', String(params.page_size));

	if (params.search) {
		searchParams.set('search', params.search);
	}

	const query = searchParams.toString();

	return api.get<ApiEnvelope<ListClientEmergencyContactsResponse>>(
		`/clients/${clientId}/emergency_contacts?${query}`
	);
}
