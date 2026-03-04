import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	AuthRequest,
	AuthTokenData,
	Enable2faRequest,
	Enable2faResponse,
	EmployeeProfile,
	Setup2faRequest,
	Setup2faResponse,
	TwoFactorRequest
} from '$lib/types/api';

export function requestAuthToken(payload: AuthRequest) {
	return api.post<ApiEnvelope<AuthTokenData>>('/auth/token', payload, { requiresAuth: false });
}

export function requestVerify2fa(payload: TwoFactorRequest) {
	return api.post<ApiEnvelope<AuthTokenData>>('/auth/verify_2fa', payload, { requiresAuth: false });
}

export function requestSetup2fa(payload: Setup2faRequest) {
	return api.post<ApiEnvelope<Setup2faResponse>>('/auth/setup_2fa', payload);
}

export function requestEnable2fa(payload: Enable2faRequest) {
	return api.post<ApiEnvelope<Enable2faResponse>>('/auth/enable_2fa', payload);
}

export function requestEmployeeProfile() {
	return api.get<ApiEnvelope<EmployeeProfile>>('/employees/profile');
}

export function requestLogout() {
	return api.request<ApiEnvelope<null>>('/auth/logout', { method: 'POST' });
}
