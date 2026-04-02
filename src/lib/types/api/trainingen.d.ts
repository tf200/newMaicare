export type TrainingStatus = 'planned' | 'in_progress' | 'completed' | 'expired';

export interface Training {
	id: string;
	name: string;
	description: string | null;
	category: string;
	duration_hours: number | null;
	validity_months: number | null;
	is_mandatory: boolean;
	is_active: boolean;
}

export interface EmployeeTraining {
	id: string;
	employee_id: string;
	employee_name: string;
	employee_department: string;
	training_id: string;
	training_name: string;
	training_category: string;
	completed_date: string | null;
	expiry_date: string | null;
	status: TrainingStatus;
	notes: string | null;
}
