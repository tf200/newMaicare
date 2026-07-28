import { api } from './client';
import type {
	ApiEnvelope,
	GetRegistrationFormResponse,
	InitRegistrationUploadRequest,
	InitRegistrationUploadResponse,
	ListRegistrationFormsParams,
	ListRegistrationFormsResponse,
	PaginatedResponse,
	ProcessRegistrationRequest,
	RegistrationCountsResponse,
	UpdateRegistrationDocumentRequest,
	RegistrationUploadSessionResponse,
	RegistrationRequest,
	UpdateRegistrationFormRequest
} from '$lib/types/api';

export async function submitRegistration(
	data: RegistrationRequest,
	registrationToken: string
): Promise<void> {
	await api.post('/registration_forms', data, {
		requiresAuth: false,
		headers: {
			'X-Registration-Token': registrationToken
		}
	});
}

export async function createRegistrationUploadSession(): Promise<RegistrationUploadSessionResponse> {
	const response = await api.post<ApiEnvelope<RegistrationUploadSessionResponse>>(
		'/public/registration-upload-sessions',
		{},
		{ requiresAuth: false }
	);
	return response.data;
}

export async function initRegistrationUpload(
	data: InitRegistrationUploadRequest,
	registrationToken: string
): Promise<InitRegistrationUploadResponse> {
	const response = await api.post<ApiEnvelope<InitRegistrationUploadResponse>>(
		'/public/registration-uploads/init',
		data,
		{
			requiresAuth: false,
			headers: {
				'X-Registration-Token': registrationToken
			}
		}
	);
	return response.data;
}

export function uploadRegistrationFile(
	uploadUrl: string,
	file: File,
	contentType: InitRegistrationUploadRequest['content_type'],
	onProgress?: (progress: number) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.open('PUT', uploadUrl);
		xhr.setRequestHeader('Content-Type', contentType);

		if (onProgress) {
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					onProgress(Math.round((event.loaded / event.total) * 100));
				}
			};
		}

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
			} else {
				reject(new Error(`Storage upload failed with status ${xhr.status}: ${xhr.statusText}`));
			}
		};

		xhr.onerror = () => {
			reject(new Error('Storage upload failed before the server responded.'));
		};

		xhr.send(file);
	});
}

export async function processRegistrationForm(
	id: string,
	data: ProcessRegistrationRequest
): Promise<void> {
	await api.post(`/registration_forms/${id}/process`, data);
}

export async function updateRegistrationForm(
	id: string,
	data: UpdateRegistrationFormRequest
): Promise<void> {
	await api.put(`/registration_forms/${id}`, data);
}

export async function updateRegistrationDocument(
	id: string,
	data: UpdateRegistrationDocumentRequest
): Promise<void> {
	await api.put(`/registration_forms/${id}/documents`, data);
}

export function listRegistrationForms(
	params: ListRegistrationFormsParams = {},
	options: { fetchFn?: typeof fetch } = {}
) {
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

	return api.get<ApiEnvelope<PaginatedResponse<ListRegistrationFormsResponse>>>(endpoint, options);
}

export function getRegistrationCounts(options: { fetchFn?: typeof fetch } = {}) {
	return api.get<ApiEnvelope<RegistrationCountsResponse>>('/registration_forms/counts', options);
}

export function getRegistrationForm(id: string, options: { fetchFn?: typeof fetch } = {}) {
	return api.get<ApiEnvelope<GetRegistrationFormResponse>>(`/registration_forms/${id}`, options);
}

export function deleteRegistrationForm(id: string, options: { fetchFn?: typeof fetch } = {}) {
	return api.delete<ApiEnvelope<null>>(`/registration_forms/${id}`, options);
}
