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
