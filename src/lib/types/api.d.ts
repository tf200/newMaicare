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

export type SenderContact = Record<string, unknown>;

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

export interface AuthRequest {
	email: string;
	password: string;
}

export interface TwoFactorRequest {
	temp_token: string;
	validation_code: string;
}
