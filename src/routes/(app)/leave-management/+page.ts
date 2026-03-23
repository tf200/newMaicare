import type { PageLoad } from './$types';
import { listLeaveBalances } from '$lib/api/leave';
import type { LeaveBalanceListItemResponse } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';

export interface LeaveBalanceFilters {
	employeeSearch: string;
	year: number | null;
}

export type LeaveBalanceRow = LeaveBalanceListItemResponse;

export interface LeaveBalancesLoadResult {
	balances: LeaveBalanceRow[];
	pagination: PaginationState<LeaveBalanceFilters>;
	loadError: string | null;
}

export interface LeaveManagementPageData {
	initial: {
		page: number;
		pageSize: number;
		filters: LeaveBalanceFilters;
	};
	leaveBalancesData: Promise<LeaveBalancesLoadResult>;
}

const parseYear = (value: string | null) => {
	if (!value) return null;

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
		return null;
	}

	return parsed;
};

export const load: PageLoad = ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const requestedPageSize = Number(url.searchParams.get('page_size') ?? '20') || 20;
	const pageSize = Math.min(100, Math.max(5, requestedPageSize));
	const employeeSearch = (url.searchParams.get('employee_search') ?? '').trim().slice(0, 120);
	const year = parseYear(url.searchParams.get('year'));

	const leaveBalancesData: Promise<LeaveBalancesLoadResult> = listLeaveBalances({
		page,
		pageSize,
		employeeSearch: employeeSearch || undefined,
		year: year ?? undefined
	})
		.then((response) => {
			const { count, next, previous, page_size, results } = response.data;
			const effectivePageSize = page_size || pageSize;

			return {
				balances: results,
				pagination: {
					count,
					page,
					pageSize: effectivePageSize,
					next,
					previous,
					filters: {
						employeeSearch,
						year
					}
				} satisfies PaginationState<LeaveBalanceFilters>,
				loadError: null
			} satisfies LeaveBalancesLoadResult;
		})
		.catch((error): LeaveBalancesLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load leave balances.';

			return {
				balances: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters: {
						employeeSearch,
						year
					}
				} satisfies PaginationState<LeaveBalanceFilters>,
				loadError: message
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters: {
				employeeSearch,
				year
			}
		},
		leaveBalancesData
	};
};
