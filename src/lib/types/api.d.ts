export interface ApiEnvelope<T> {
	data: T;
	message: string;
	success: boolean;
}

export interface User {
	id: string;
	email: string;
	role: 'admin' | 'user';
	name: string;
	avatar?: string;
}

export interface AuthTokenData {
	access: string;
	refresh: string;
	requires_2fa: boolean;
	temp_token: string;
}

export interface AuthRequest {
	email: string;
	password: string;
}

export interface TwoFactorRequest {
	temp_token: string;
	validation_code: string;
}
