import { api } from '$lib/api/client';
import type { ApiEnvelope, AuthRequest, AuthTokenData, TwoFactorRequest } from '$lib/types/api';

export function requestAuthToken(payload: AuthRequest) {
	return api.post<ApiEnvelope<AuthTokenData>>('/auth/token', payload, { requiresAuth: false });
}

export function requestVerify2fa(payload: TwoFactorRequest) {
	return api.post<ApiEnvelope<AuthTokenData>>('/auth/verify_2fa', payload, { requiresAuth: false });
}
