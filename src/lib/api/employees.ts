import { api } from '$lib/api/client';
import type { ApiEnvelope, PaginatedResponse } from '$lib/types/api';
import type { EmployeeProfileDetailsResponse, EmployeeScheduleTimelineDay } from '$lib/types/api';

export type EmployeeContractType = 'loondienst' | 'ZZP' | 'none';

export interface ListEmployeesParams {
	page?: number;
	pageSize?: number;
	page_size?: number;
	isArchived?: boolean;
	outOfService?: boolean;
	locationId?: string;
	contractType?: EmployeeContractType;
	search?: string;
}

export interface EmployeeListItem {
	id: string;
	first_name: string;
	last_name: string;
	bsn: string | number;
	contract_type: EmployeeContractType | string;
	department: string | null;
	department_name?: string | null;
	location_address: string | null;
	contract_end_date: string | null;
}

export type EmployeeGender = 'male' | 'female' | 'not_specified';

export interface CreateEmployeeRequest {
	employee_number?: string;
	employment_number?: string;
	location_id?: string;
	department_id?: string;
	first_name: string;
	last_name: string;
	bsn: string;
	street: string;
	house_number: string;
	house_number_addition?: string;
	postal_code: string;
	city: string;
	position?: string;
	private_email_address?: string;
	work_email_address: string;
	work_phone_number?: string;
	private_phone_number?: string;
	date_of_birth?: string;
	home_telephone_number?: string;
	gender: EmployeeGender;
	contract_hours?: number;
	contract_start_date?: string;
	contract_end_date?: string;
	contract_type: EmployeeContractType;
	contract_rate?: number;
	role_id: string;
}

export interface CreateEmployeeResponse {
	id: string;
	user_id: string;
	first_name: string;
	last_name: string;
	position: string | null;
	department: string | null;
	employee_number: string | null;
	employment_number: string | null;
	private_email_address: string | null;
	email: string;
	private_phone_number: string | null;
	work_phone_number: string | null;
	date_of_birth: string;
	home_telephone_number: string | null;
	created_at: string;
	gender: EmployeeGender;
	location_id: string | null;
	has_borrowed: boolean;
	out_of_service: boolean;
	is_archived: boolean;
}

export function listEmployees(params: ListEmployeesParams = {}) {
	const query = new URLSearchParams();
	if (params.page != null) query.set('page', String(params.page));
	if (params.page_size != null) {
		query.set('page_size', String(params.page_size));
	} else if (params.pageSize != null) {
		query.set('page_size', String(params.pageSize));
	}

	if (params.isArchived != null) query.set('is_archived', String(params.isArchived));
	if (params.outOfService != null) query.set('out_of_service', String(params.outOfService));
	if (params.locationId) query.set('location_id', params.locationId);
	if (params.contractType) query.set('contract_type', params.contractType);
	if (params.search) query.set('search', params.search);

	const queryString = query.toString();
	const endpoint = queryString ? `/employees?${queryString}` : '/employees';
	return api.get<ApiEnvelope<PaginatedResponse<EmployeeListItem>>>(endpoint);
}

export function createEmployee(payload: CreateEmployeeRequest) {
	return api.post<ApiEnvelope<CreateEmployeeResponse>>('/employees', payload);
}

export function getEmployeeProfileDetails() {
	return api.get<ApiEnvelope<EmployeeProfileDetailsResponse>>('/employees/profile/details');
}

export interface GetMyScheduleTimelineParams {
	startDate: string;
	endDate: string;
}

export function getMyScheduleTimeline(params: GetMyScheduleTimelineParams) {
	const query = new URLSearchParams();
	query.set('start_date', params.startDate);
	query.set('end_date', params.endDate);

	return api.get<ApiEnvelope<EmployeeScheduleTimelineDay[]>>(
		`/employees/profile/schedules?${query.toString()}`
	);
}
