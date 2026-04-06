import type { PageLoad } from './$types';
import type {
	CaoSalaryScale,
	ShiftAssignment,
	Service,
	ContractChange,
	LeaveBalance,
	PayoutRequest
} from '$lib/types/api/salary';

export interface SalaryPageData {
	initial: {
		monthStart: string;
		monthEnd: string;
	};
}

export interface ResolvedSalaryData {
	scales: CaoSalaryScale[];
	assignments: ShiftAssignment[];
	services: Service[];
	contractChanges: ContractChange[];
	leaveBalances: LeaveBalance[];
	leavePayouts: PayoutRequest[];
	loadErrors: string[];
}

export const load: PageLoad = ({ url }) => {
	const now = new Date();
	const monthParam = url.searchParams.get('month');

	let currentMonth: Date;
	if (monthParam) {
		const parsed = new Date(monthParam + '-01');
		currentMonth = isNaN(parsed.getTime()) ? now : parsed;
	} else {
		currentMonth = now;
	}

	const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
	const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

	const formatISO = (d: Date) => d.toISOString().split('T')[0];

	return {
		initial: {
			monthStart: formatISO(monthStart),
			monthEnd: formatISO(monthEnd)
		}
	};
};
