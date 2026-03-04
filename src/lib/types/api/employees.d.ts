export type GenderEnum = 'male' | 'female' | 'other' | 'unknown';

export type ContractTypeEnum = 'loondienst' | 'ZZP' | 'none';

export interface EmployeeRole {
	id: string;
	name: string;
}

export interface ActiveSessionDetail {
	id: string;
	user_agent: string;
	client_ip: string;
	expires_at: string;
	created_at: string;
}

export interface BriefEducationDetail {
	institution_name: string;
	degree: string;
	field_of_study: string;
	start_date: string | null;
	end_date: string | null;
}

export interface BriefExperienceDetail {
	job_title: string;
	company_name: string;
	start_date: string | null;
	end_date: string | null;
}

export interface EmployeeProfileDetailsResponse {
	user_id: string;
	employee_id: string;
	email: string;
	two_factor_enabled: boolean;
	last_login: string;
	first_name: string;
	last_name: string;
	roles: EmployeeRole[];
	active_sessions: ActiveSessionDetail[];
	education: BriefEducationDetail[];
	work_experience: BriefExperienceDetail[];
	street: string;
	house_number: string;
	house_number_addition: string | null;
	postal_code: string;
	city: string;
	position: string | null;
	department: string | null;
	employee_number: string | null;
	employment_number: string | null;
	private_email_address: string | null;
	work_email_address: string | null;
	private_phone_number: string | null;
	work_phone_number: string | null;
	home_telephone_number: string | null;
	date_of_birth: string | null;
	gender: GenderEnum;
	location_id: string | null;
	location_name: string | null;
	organisation_name: string | null;
	has_borrowed: boolean;
	out_of_service: boolean | null;
	is_archived: boolean;
	contract_type: ContractTypeEnum;
	contract_hours: number | null;
	contract_start_date: string | null;
	contract_end_date: string | null;
	contract_rate: number | null;
}
