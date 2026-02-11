export type ContractStatus = 'approved' | 'submitted' | 'draft' | 'rejected' | 'expired';
export type FinancingAct = 'WMO' | 'ZVW' | 'WLZ' | 'JW' | 'WPG';
export type FinancingOption = 'ZIN' | 'PGB';
export type ContractCareType = 'ambulante' | 'accommodation';

export interface ClientContract {
	id: string;
	status: ContractStatus;
	start_date: string;
	end_date: string | null;
	financing_act: FinancingAct;
	financing_option: FinancingOption;
	care_type: ContractCareType;
	notes?: string;
	summary?: string;
}
