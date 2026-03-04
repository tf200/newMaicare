import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	AuthRequest,
	AuthTokenData,
	EmployeeProfile,
	TwoFactorRequest
} from '$lib/types/api';

export function requestAuthToken(payload: AuthRequest) {
	return api.post<ApiEnvelope<AuthTokenData>>('/auth/token', payload, { requiresAuth: false });
}

export function requestVerify2fa(payload: TwoFactorRequest) {
	return api.post<ApiEnvelope<AuthTokenData>>('/auth/verify_2fa', payload, { requiresAuth: false });
}

export function requestEmployeeProfile() {
	return api.get<ApiEnvelope<EmployeeProfile>>('/employees/profile');
}

export function requestLogout() {
	return api.request<ApiEnvelope<null>>('/auth/logout', { method: 'POST' });
}
