import type { PageLoad } from './$types';
import { listInCareClients } from '$lib/api/clients';
import type { InCareClientStatus } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';

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

const allowedStatus = new Set<InCareClientStatus>(['in_care', 'scheduled_in_care']);

const normalizeStatus = (values: string[]) =>
	values.filter((value): value is InCareClientStatus =>
		allowedStatus.has(value as InCareClientStatus)
	);

export const load: PageLoad = async ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const requestedPageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const pageSize = Math.min(100, Math.max(5, requestedPageSize));
	const search = (url.searchParams.get('search') ?? '').trim();
	const status = normalizeStatus(url.searchParams.getAll('status'));
	const sortParam = (url.searchParams.get('sort_days_in_care') ?? 'desc').toLowerCase();
	const sortDirection: 'asc' | 'desc' = sortParam === 'asc' ? 'asc' : 'desc';

	try {
		const response = await listInCareClients({
			page,
			pageSize,
			search: search || undefined,
			status: status.length > 0 ? status : undefined,
			sortDaysInCare: sortDirection
		});

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
			stats: {
				total: count
			},
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
			sort: {
				direction: sortDirection
			},
			loadError: null
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load in-care clients.';
		return {
			rows: [],
			stats: {
				total: 0
			},
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
			sort: {
				direction: sortDirection
			},
			loadError: message
		};
	}
};
