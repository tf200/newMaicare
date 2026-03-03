export type ContractStatus = 'approved' | 'draft' | 'terminated' | 'stopped' | 'expired';
export type ContractCareType = 'ambulante' | 'accommodation';
export type ContractPriceTimeUnit = 'minute' | 'hourly' | 'daily' | 'weekly';
export type ContractHoursType = 'weekly' | 'all_period';
export type ContractFinancingAct = 'WMO' | 'ZVW' | 'WLZ' | 'JW' | 'WPG';
export type ContractFinancingOption = 'ZIN' | 'PGB';

export interface ListContractsResponse {
	id: string;
	client_id: string;
	client_first_name: string;
	client_last_name: string;
	client_filenumber: string;
	sender_id: string;
	sender_name: string;
	care_name: string;
	care_type: ContractCareType;
	price: number;
	price_time_unit: ContractPriceTimeUnit;
	hours: number | null;
	hours_type: ContractHoursType | null;
	financing_act: ContractFinancingAct;
	financing_option: ContractFinancingOption;
	start_date: string;
	end_date: string;
	days_left: number;
	status: ContractStatus;
	approved_at: string | null;
	updated_at: string;
}

export interface ListContractsParams {
	page?: number;
	pageSize?: number;
	search?: string;
	client_name?: string;
	sender_name?: string;
	status?: ContractStatus[];
	care_type?: ContractCareType[];
	financing_act?: ContractFinancingAct[];
	financing_option?: ContractFinancingOption[];
	end_date_from?: string;
	end_date_to?: string;
}

export interface ListClientContractsResponse {
	id: string;
	start_date: string;
	end_date: string;
	days_left: number;
	care_name: string;
	care_type: ContractCareType;
	financing_act: ContractFinancingAct;
	financing_option: ContractFinancingOption;
}

export interface ContractAttachment {
	id: string;
	name: string;
	size: number;
	download_url: string;
}

export interface GetContractResponse {
	id: string;
	type_id: string | null;
	type_name: string | null;
	status: ContractStatus;
	approved_at: string | null;
	start_date: string;
	end_date: string;
	reminder_period: number;
	VAT: number | null;
	price: number;
	price_time_unit: ContractPriceTimeUnit;
	hours: number | null;
	hours_type: ContractHoursType | null;
	care_name: string;
	care_type: ContractCareType;
	attachment_ids: string[];
	financing_act: ContractFinancingAct;
	financing_option: ContractFinancingOption;
	departure_reason: string | null;
	departure_report: string | null;
	updated_at: string;
	created_at: string;
	client_id: string;
	client_first_name: string;
	client_last_name: string;
	client_filenumber: string;
	client_bsn: string | null;
	sender_id: string;
	sender_name: string;
	sender_type: string;
	sender_street: string | null;
	sender_house_number: string | null;
	sender_house_number_addition: string | null;
	sender_postal_code: string | null;
	sender_city: string | null;
	sender_land: string | null;
	sender_kvknumber: string | null;
	sender_btwnumber: string | null;
	sender_phone_number: string | null;
	sender_client_number: string | null;
	sender_email_address: string | null;
	attachments?: ContractAttachment[];
}

export interface CreateContractRequest {
	client_id: string;
	start_date: string;
	end_date: string;
	price: number;
	price_time_unit: ContractPriceTimeUnit;
	care_type: ContractCareType;
	care_name: string;
	sender_id: string;
	financing_act: ContractFinancingAct;
	financing_option: ContractFinancingOption;
	type_id?: string | null;
	reminder_period?: number | null;
	VAT?: number | null;
	hours?: number | null;
	hours_type?: ContractHoursType | null;
	attachment_ids?: string[];
}

export interface CreateContractResponse {
	id: string;
	status: ContractStatus;
	client_id: string;
	start_date: string;
	end_date: string;
	price: number;
	price_time_unit: ContractPriceTimeUnit;
	care_type: ContractCareType;
	care_name: string;
	sender_id: string;
	financing_act: ContractFinancingAct;
	financing_option: ContractFinancingOption;
	type_id: string | null;
	reminder_period: number;
	VAT: number | null;
	hours: number | null;
	hours_type: ContractHoursType | null;
	attachment_ids: string[];
	attachments: ContractAttachment[];
}

export interface UpdateContractRequest {
	type_id?: string;
	start_date?: string;
	end_date?: string;
	reminder_period?: number;
	VAT?: number;
	price?: number;
	price_time_unit?: ContractPriceTimeUnit;
	hours?: number | null;
	hours_type?: ContractHoursType | null;
	care_name?: string;
	sender_id?: string;
	attachment_ids?: string[];
	financing_act?: ContractFinancingAct;
	financing_option?: ContractFinancingOption;
}

export interface UpdateContractResponse {
	id: string;
	type_id: string | null;
	type_name: string | null;
	status: ContractStatus;
	approved_at: string | null;
	start_date: string;
	end_date: string;
	reminder_period: number;
	VAT: number | null;
	price: number;
	price_time_unit: ContractPriceTimeUnit;
	hours: number | null;
	hours_type: ContractHoursType | null;
	care_name: string;
	care_type: ContractCareType;
	attachment_ids: string[];
	attachments: ContractAttachment[];
	financing_act: ContractFinancingAct;
	financing_option: ContractFinancingOption;
	departure_reason: string | null;
	departure_report: string | null;
	updated_at: string;
	created_at: string;
	client_id: string;
	sender_id: string;
}

export interface UpdateContractStatusRequest {
	status: ContractStatus;
}

export interface UpdateContractStatusResponse {
	id: string;
	status: ContractStatus;
}
