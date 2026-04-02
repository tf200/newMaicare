import { listShiftSwaps, type ShiftSwapFilter } from '$lib/api/shift-swaps';
import type { ShiftSwapResponse, ShiftSwapStatus } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';
import type { PageLoad } from './$types';

const ALLOWED_FILTERS = [
	'open',
	'to_approve',
	'history'
] as const satisfies readonly ShiftSwapFilter[];
const ALLOWED_STATUSES = [
	'pending_recipient',
	'recipient_rejected',
	'pending_admin',
	'admin_rejected',
	'confirmed',
	'cancelled',
	'expired'
] as const satisfies readonly ShiftSwapStatus[];

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 100;

const isAllowedFilter = (value: string | null): value is ShiftSwapFilter =>
	Boolean(value && ALLOWED_FILTERS.includes(value as ShiftSwapFilter));

const isAllowedStatus = (value: string | null): value is ShiftSwapStatus =>
	Boolean(value && ALLOWED_STATUSES.includes(value as ShiftSwapStatus));

const toErrorMessage = (error: unknown, fallback: string) =>
	error instanceof Error ? error.message : fallback;

const toPositiveInteger = (value: string | null, fallback: number, minimum = 1) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(minimum, Math.trunc(parsed));
};

const toPageSize = (value: string | null) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE;
	return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, Math.trunc(parsed)));
};

export interface ShiftSwapLoadResult {
	swaps: ShiftSwapResponse[];
	pagination: PaginationState<{
		filter: ShiftSwapFilter;
		status: ShiftSwapStatus | '';
		employeeId: string;
	}>;
	loadError: string | null;
}

export interface ShiftSwapCountsLoadResult {
	counts: Record<ShiftSwapFilter, number>;
	loadError: string | null;
}

export const load: PageLoad = ({ url }) => {
	const page = toPositiveInteger(url.searchParams.get('page'), DEFAULT_PAGE, 1);
	const pageSize = toPageSize(url.searchParams.get('page_size'));
	const rawFilter = url.searchParams.get('filter');
	const rawStatus = url.searchParams.get('status');
	const filter: ShiftSwapFilter = isAllowedFilter(rawFilter) ? rawFilter : 'open';
	const status: ShiftSwapStatus | '' = isAllowedStatus(rawStatus) ? rawStatus : '';
	const employeeId = (url.searchParams.get('employee_id') ?? '').trim();

	const swapsData: Promise<ShiftSwapLoadResult> = listShiftSwaps({
		page,
		pageSize,
		filter,
		status: status || undefined,
		employeeId: employeeId || undefined
	})
		.then((response) => {
			const { count, page_size, results, next, previous } = response.data;

			return {
				swaps: results,
				pagination: {
					count,
					page,
					pageSize: page_size || pageSize,
					next,
					previous,
					filters: {
						filter,
						status,
						employeeId
					}
				} satisfies PaginationState<{
					filter: ShiftSwapFilter;
					status: ShiftSwapStatus | '';
					employeeId: string;
				}>,
				loadError: null
			} satisfies ShiftSwapLoadResult;
		})
		.catch(
			(error): ShiftSwapLoadResult => ({
				swaps: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters: {
						filter,
						status,
						employeeId
					}
				},
				loadError: toErrorMessage(error, 'Failed to load shift swaps.')
			})
		);

	const countsData: Promise<ShiftSwapCountsLoadResult> = Promise.allSettled(
		ALLOWED_FILTERS.map(async (filterKey) => ({
			filter: filterKey,
			count: (await listShiftSwaps({ page: 1, pageSize: MIN_PAGE_SIZE, filter: filterKey })).data
				.count
		}))
	).then((results) => {
		const counts: Record<ShiftSwapFilter, number> = {
			open: 0,
			to_approve: 0,
			history: 0
		};

		const errors: string[] = [];

		for (const result of results) {
			if (result.status === 'fulfilled') {
				counts[result.value.filter] = result.value.count;
				continue;
			}

			errors.push(toErrorMessage(result.reason, 'Failed to load shift swap counts.'));
		}

		return {
			counts,
			loadError: errors[0] ?? null
		} satisfies ShiftSwapCountsLoadResult;
	});

	return {
		initial: {
			page,
			pageSize,
			filters: {
				filter,
				status,
				employeeId
			}
		},
		swapsData,
		countsData
	};
};
