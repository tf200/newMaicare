export interface OrtBreakdown {
	earlyMorningHours: number;
	eveningHours: number;
	nightHours: number;
	saturdayDayHours: number;
	sundayHolidayHours: number;
	totalOrtHours: number;
}

export interface OrtAmounts {
	earlyMorningOrt: number;
	eveningOrt: number;
	nightOrt: number;
	saturdayDayOrt: number;
	sundayHolidayOrt: number;
	totalOrt: number;
}

export interface EmployeeSalaryRow {
	employee: {
		id: string;
		name: string;
		first_name: string;
		last_name: string;
		department: string | null;
		salary_scale: number | null;
		salary_periodiek: number | null;
		hours_per_week: number | null;
		contract_hours_type: string;
		employee_type: string;
		status: string;
		organizational_role_id: string | null;
		hourly_rate: number | null;
		birth_date: string | null;
		start_date: string | null;
		bsn: string | number | null;
		tax_credit: boolean | null;
		wage_tax_table: string | null;
	};
	shifts: number;
	regularHours: number;
	ortBreakdown: OrtBreakdown;
	hourlyRate: number | null;
	monthlySalary: number | null;
	regularPay: number;
	ortAmounts: OrtAmounts | null;
	totalOrt: number;
	totalGross: number;
	maxShifts: number;
	shiftsDifference: number;
	isOverScheduled: boolean;
	isUnderScheduled: boolean;
	maxHoursPerMonth: number;
	hoursDifference: number;
	isOverHours: boolean;
	isUnderHours: boolean;
	isZeroHoursContract: boolean;
	isZorgcoordinator: boolean;
}

export interface ZzpSalaryRow {
	employee: {
		id: string;
		name: string;
		first_name: string;
		last_name: string;
		department: string | null;
		hourly_rate: number | null;
		employee_type: string;
		status: string;
	};
	shifts: number;
	regularHours: number;
	hourlyRate: number | null;
	totalCost: number;
}

export interface SalaryTotals {
	totalShifts: number;
	regularHours: number;
	totalOrtHours: number;
	earlyMorningOrtHours: number;
	eveningOrtHours: number;
	nightOrtHours: number;
	saturdayOrtHours: number;
	sundayOrtHours: number;
	regularPay: number;
	totalOrt: number;
	totalGross: number;
}

export interface ZzpTotals {
	totalShifts: number;
	totalHours: number;
	totalCost: number;
}

export interface CaoSalaryScale {
	id: string;
	scale_number: number;
	periodiek: number;
	monthly_salary: number;
	hourly_rate: number | null;
	is_uitloop: boolean;
}

export interface ShiftAssignment {
	id: string;
	employee_id: string;
	service_id: string;
	shift_date: string;
	start_time: string | null;
	end_time: string | null;
}

export interface Service {
	id: string;
	legacy_id: string | null;
	name: string;
	start_time: string | null;
	end_time: string | null;
	paid_hours: number | null;
}

export interface ContractChange {
	id: string;
	employee_id: string;
	field_changed: string;
	old_value: string | null;
	new_value: string | null;
	change_date: string;
}

export interface LeaveBalance {
	employee_id: string;
	year: number;
	vacation_hours_total: number;
	vacation_hours_used: number;
	leave_budget_hours_total: number;
	leave_budget_hours_used: number;
}

export interface LeavePayout {
	id: string;
	employee_id: string;
	salary_month: string;
	payout_code: string | null;
	leave_type: string;
	hours_requested: number;
	hourly_rate: number;
	total_amount: number;
	status: string;
}
