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

export interface GlobalOrganizationCounts {
	total_locations: number;
	total_employees: number;
}

export interface LocationShift {
	id?: string;
	location_id?: string;
	slot?: number;
	shift: string;
	start_time: string;
	end_time: string;
}

export interface LocationScheduleShiftItem {
	schedule_id: string;
	employee_id: string;
	employee_first_name: string;
	employee_last_name: string;
	start_time: string;
	end_time: string;
	location_id: string;
	color: string | null;
	shift_name: string | null;
	location_shift_id: string | null;
	is_custom: boolean;
}

export interface LocationScheduleDay {
	date: string;
	shifts: LocationScheduleShiftItem[];
}

export interface OrganizationLocation {
	id: string;
	name: string;
	street: string;
	house_number: string;
	house_number_addition: string | null;
	postal_code: string;
	city: string;
	shifts?: LocationShift[];
	created_at: string;
	updated_at: string;
}

export interface SenderContact {
	name?: string | null;
	email?: string | null;
	phone_number?: string | null;
}

export interface TemplateItem {
	id: string;
	item_tag: string;
	description: string;
	source_table: string;
	source_column: string;
}

export interface GetSenderByIdResponse {
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
	email_address: string | null;
	contacts: SenderContact[];
	invoice_template_items: TemplateItem[];
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

export interface UpdateSenderRequest {
	name?: string;
	street?: string;
	house_number?: string;
	house_number_addition?: string;
	postal_code?: string;
	city?: string;
	land?: string;
	KVKnumber?: string;
	BTWnumber?: string;
	phone_number?: string;
	client_number?: string;
	email_address?: string;
	contacts?: SenderContact[];
	is_archived?: boolean;
	types?: 'main_provider' | 'local_authority' | 'particular_party' | 'healthcare_institution';
}

export interface UpdateSenderResponse {
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
	email_address: string | null;
	contacts: SenderContact[];
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

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

export interface CreateSenderRequest {
	types: string;
	name: string;
	street?: string;
	house_number?: string;
	house_number_addition?: string;
	postal_code?: string;
	city?: string;
	land?: string;
	KVKnumber?: string;
	BTWnumber?: string;
	phone_number?: string;
	client_number?: string;
	contacts: SenderContact[];
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
	shifts?: LocationShift[];
}

export interface UpdateLocationRequest {
	name?: string;
	street?: string;
	house_number?: string;
	house_number_addition?: string;
	postal_code?: string;
	city?: string;
	shifts?: LocationShift[];
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
