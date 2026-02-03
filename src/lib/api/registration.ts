import { api } from './client';
import type {
	ApiEnvelope,
	GetRegistrationFormResponse,
	ListRegistrationFormsParams,
	ListRegistrationFormsResponse,
	PaginatedResponse,
	ProcessRegistrationRequest,
	RegistrationRequest
} from '$lib/types/api';

export async function submitRegistration(data: RegistrationRequest): Promise<void> {
	await api.post('/registration_forms', data);
}

export async function processRegistrationForm(
	id: string,
	data: ProcessRegistrationRequest
): Promise<void> {
	await api.post(`/registration_forms/${id}/process`, data);
}

export function listRegistrationForms(params: ListRegistrationFormsParams = {}) {
	const searchParams = new URLSearchParams();

	if (params.page) {
		searchParams.set('page', String(params.page));
	}
	if (params.pageSize) {
		searchParams.set('page_size', String(params.pageSize));
	}
	if (params.search) {
		searchParams.set('search', params.search);
	}
	if (params.status) {
		searchParams.set('status', params.status);
	}
	if (params.riskAggressiveBehavior != null) {
		searchParams.set('risk_aggressive_behavior', String(params.riskAggressiveBehavior));
	}
	if (params.riskSuicidalSelfharm != null) {
		searchParams.set('risk_suicidal_selfharm', String(params.riskSuicidalSelfharm));
	}
	if (params.riskSubstanceAbuse != null) {
		searchParams.set('risk_substance_abuse', String(params.riskSubstanceAbuse));
	}
	if (params.riskPsychiatricIssues != null) {
		searchParams.set('risk_psychiatric_issues', String(params.riskPsychiatricIssues));
	}
	if (params.riskCriminalHistory != null) {
		searchParams.set('risk_criminal_history', String(params.riskCriminalHistory));
	}
	if (params.riskFlightBehavior != null) {
		searchParams.set('risk_flight_behavior', String(params.riskFlightBehavior));
	}
	if (params.riskWeaponPossession != null) {
		searchParams.set('risk_weapon_possession', String(params.riskWeaponPossession));
	}
	if (params.riskSexualBehavior != null) {
		searchParams.set('risk_sexual_behavior', String(params.riskSexualBehavior));
	}
	if (params.riskDayNightRhythm != null) {
		searchParams.set('risk_day_night_rhythm', String(params.riskDayNightRhythm));
	}

	const query = searchParams.toString();
	const endpoint = query ? `/registration_forms?${query}` : '/registration_forms';

	return api.get<ApiEnvelope<PaginatedResponse<ListRegistrationFormsResponse>>>(endpoint);
}

export function getRegistrationForm(id: string) {
	return api.get<ApiEnvelope<GetRegistrationFormResponse>>(`/registration_forms/${id}`);
}
