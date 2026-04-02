export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export type ExpenseCategory =
	| 'reiskosten'
	| 'verblijfkosten'
	| 'maaltijden'
	| 'telefoon'
	| 'kantoorbenodigdheden'
	| 'opleidingen'
	| 'representatie'
	| 'overig';

export interface Expense {
	id: string;
	employee_id: string;
	employee_name: string;
	date: string;
	category: ExpenseCategory;
	description: string | null;
	amount: number;
	status: ExpenseStatus;
	created_at: string;
}
