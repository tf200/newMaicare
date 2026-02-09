import type { PageLoad } from './$types';
import { listClients } from '$lib/api/clients';
import type { ClientStatus } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';

export interface ClientsFilters {
	search: string;
	status: ClientStatus | '';
	locationId: string;
}

export interface ClientsRow {
	id: string;
	firstName: string;
	lastName: string;
	bsn: string;
	fileNumber: string;
	locationName: string;
	careType: string;
	status: ClientStatus;
	goalsCount: number;
	riskCount: number;
	createdAt: string;
}

const allowedStatus = new Set<ClientStatus>([
	'in_care',
	'on_waiting_list',
	'scheduled_in_care',
	'scheduled_out_of_care',
	'out_of_care'
]);

const normalizeStatus = (value: string | null): ClientStatus | '' => {
	if (!value) return '';
	return allowedStatus.has(value as ClientStatus) ? (value as ClientStatus) : '';
};

export const load: PageLoad = async ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const requestedPageSize = Number(url.searchParams.get('page_size') ?? '10') || 10;
	const pageSize = Math.min(100, Math.max(5, requestedPageSize));
	const search = (url.searchParams.get('search') ?? '').trim();
	const status = normalizeStatus(url.searchParams.get('status'));
	const locationId = (url.searchParams.get('location_id') ?? '').trim();

	try {
		const response = await listClients({
			page,
			pageSize,
			search: search || undefined,
			status: status || undefined,
			location_id: locationId || undefined
		});

		const { results, total_count, page: responsePage, page_size } = response.data;

		const rows: ClientsRow[] = results.map((item) => ({
			id: item.id,
			firstName: item.first_name,
			lastName: item.last_name,
			bsn: item.bsn,
			fileNumber: item.filenumber,
			locationName: item.location_name ?? '—',
			careType: item.care_type ?? '—',
			status: item.status,
			goalsCount: item.goals_count,
			riskCount: item.risk_count,
			createdAt: item.created_at
		}));

		const currentPage = responsePage || page;
		const effectivePageSize = page_size || pageSize;
		const hasPrevious = currentPage > 1;
		const hasNext = currentPage * effectivePageSize < total_count;

		return {
			rows,
			stats: {
				total: total_count
			},
			pagination: {
				count: total_count,
				page: currentPage,
				pageSize: effectivePageSize,
				next: hasNext ? 'true' : null,
				previous: hasPrevious ? 'true' : null,
				filters: {
					search,
					status,
					locationId
				}
			} satisfies PaginationState<ClientsFilters>,
			loadError: null
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load clients.';

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
					status,
					locationId
				}
			} satisfies PaginationState<ClientsFilters>,
			loadError: message
		};
	}
};
