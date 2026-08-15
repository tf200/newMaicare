import type { PageLoad } from './$types';
import { listInCareClients } from '$lib/api/clients';
import type { InCareClientStatus } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';

export interface InCareFilters {
	search: string;
	status: InCareClientStatus[];
}

export interface InCareRow {
	id: string;
	clientFirstName: string;
	clientLastName: string;
	clientBsnNumber: string | null;
	status: InCareClientStatus;
	coordinator: string;
	startDate: string | null;
	daysInCare: number;
	location: string;
	contractActive: boolean;
}

export interface InCareLoadResult {
	rows: InCareRow[];
	pagination: PaginationState<InCareFilters>;
	loadError: string | null;
}

const allowedStatus = new Set<InCareClientStatus>(['in_care', 'scheduled_in_care']);

const normalizeStatus = (values: string[]) =>
	values.filter((value): value is InCareClientStatus =>
		allowedStatus.has(value as InCareClientStatus)
	);

const parsePositiveInteger = (value: string | null, fallback: number, maximum?: number) => {
	if (value == null || value.trim() === '') return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	const normalized = Math.max(1, Math.trunc(parsed));
	return maximum == null ? normalized : Math.min(maximum, normalized);
};

export const load: PageLoad = ({ url, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CARE_COORDINATION.VIEW, PERMISSIONS.CLIENT.VIEW])) {
		error(403, 'You do not have permission to view clients in care.');
	}

	depends('app:in-care:list');

	const page = parsePositiveInteger(url.searchParams.get('page'), 1);
	const pageSize = Math.max(5, parsePositiveInteger(url.searchParams.get('page_size'), 8, 100));
	const search = (url.searchParams.get('search') ?? '').trim();
	const status = normalizeStatus(url.searchParams.getAll('status'));
	const sortParam = (url.searchParams.get('sort_days_in_care') ?? 'desc').toLowerCase();
	const sortDirection: 'asc' | 'desc' = sortParam === 'asc' ? 'asc' : 'desc';

	const inCareData: Promise<InCareLoadResult> = listInCareClients(
		{
			page,
			pageSize,
			search: search || undefined,
			status: status.length > 0 ? status : undefined,
			sortDaysInCare: sortDirection
		},
		{ fetchFn: fetch }
	)
		.then((response) => {
			const { count, next, previous, page_size, results } = response.data;
			const rows: InCareRow[] = results.map((item) => ({
				id: item.id,
				clientFirstName: item.first_name,
				clientLastName: item.last_name,
				clientBsnNumber: item.bsn,
				status: item.status,
				coordinator: item.coordinator_name ?? '—',
				startDate: item.care_start_date,
				daysInCare: item.days_in_care,
				location: item.location_name ?? '—',
				contractActive: item.has_active_contract
			}));

			return {
				rows,
				pagination: {
					count,
					page,
					pageSize: page_size || pageSize,
					next,
					previous,
					filters: {
						search,
						status
					}
				} satisfies PaginationState<InCareFilters>,
				loadError: null
			} satisfies InCareLoadResult;
		})
		.catch((error): InCareLoadResult => {
			const message = error instanceof Error ? error.message : m.failed_load_in_care_clients();
			return {
				rows: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters: {
						search,
						status
					}
				} satisfies PaginationState<InCareFilters>,
				loadError: message
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters: {
				search,
				status
			},
			sort: {
				direction: sortDirection
			}
		},
		inCareData
	};
};
