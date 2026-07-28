import type { PageLoad } from './$types';
import { listWaitingListClients } from '$lib/api/clients';
import type { ListWaitingListClientsResponse } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';
import { m } from '$lib/paraglide/messages';

export interface WaitingListFilters {
	search: string;
	admissionType: string;
	placement: string;
}

export interface WaitingListRow {
	id: string;
	clientFirstName: string;
	clientLastName: string;
	clientBsnNumber: string | null;
	careType:
		| 'protected_living'
		| 'training_center'
		| 'supported_independent_living'
		| 'ambulatory_support'
		| 'other'
		| 'unknown';
	senderName: string;
	daysInWaitingList: number;
	admissionType: 'crisis' | 'regular' | 'unknown';
}

export interface WaitingListLoadResult {
	rows: WaitingListRow[];
	stats: { total: number };
	pagination: PaginationState<WaitingListFilters>;
	loadError: string | null;
}

const mapAdmissionType = (
	admissionType: ListWaitingListClientsResponse['admission_type']
): WaitingListRow['admissionType'] => {
	if (admissionType === 'crisis_admission') return 'crisis';
	if (admissionType === 'regular_placement') return 'regular';
	return 'unknown';
};

const mapCareType = (careType: string | null) => {
	if (!careType) return 'unknown';
	if (careType === 'protected_living') return 'protected_living';
	if (careType === 'training_center') return 'training_center';
	if (careType === 'supported_independent_living') return 'supported_independent_living';
	if (careType === 'ambulatory_support') return 'ambulatory_support';
	if (careType === 'other') return 'other';
	return 'unknown';
};

const getAdmissionTypeParam = (
	value: string
): 'crisis_admission' | 'regular_placement' | undefined => {
	if (value === 'crisis') return 'crisis_admission';
	if (value === 'regular') return 'regular_placement';
	return undefined;
};

const parsePositiveInteger = (value: string | null, fallback: number, maximum?: number) => {
	if (value == null || value.trim() === '') return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	const normalized = Math.max(1, Math.trunc(parsed));
	return maximum == null ? normalized : Math.min(maximum, normalized);
};

export const load: PageLoad = ({ url, fetch, depends }) => {
	depends('app:waiting-list:list');

	const page = parsePositiveInteger(url.searchParams.get('page'), 1);
	const pageSize = Math.max(5, parsePositiveInteger(url.searchParams.get('page_size'), 8, 100));
	const search = (url.searchParams.get('search') ?? '').trim();
	const placement = (url.searchParams.get('placement') ?? '').trim();
	const requestedAdmissionType = (url.searchParams.get('admission_type') ?? '').trim();
	const admissionType =
		requestedAdmissionType === 'crisis' || requestedAdmissionType === 'regular'
			? requestedAdmissionType
			: '';
	const sortParam = (url.searchParams.get('sort_days') ?? 'desc').toLowerCase();
	const sortDirection: 'asc' | 'desc' = sortParam === 'asc' ? 'asc' : 'desc';

	const waitingListData: Promise<WaitingListLoadResult> = listWaitingListClients(
		{
			page,
			pageSize,
			search: search || undefined,
			placement: placement || undefined,
			admissionType: getAdmissionTypeParam(admissionType),
			sortDays: sortDirection
		},
		{ fetchFn: fetch }
	)
		.then((response) => {
			const { count, next, previous, page_size, results } = response.data;
			const mappedRows = results.map((item): WaitingListRow => ({
				id: item.id,
				clientFirstName: item.first_name,
				clientLastName: item.last_name,
				clientBsnNumber: item.bsn,
				careType: mapCareType(item.care_type),
				senderName: item.sender_name ?? '—',
				daysInWaitingList: item.days_in_waitlist,
				admissionType: mapAdmissionType(item.admission_type)
			}));

			return {
				rows: mappedRows,
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
						admissionType,
						placement
					}
				} satisfies PaginationState<WaitingListFilters>,
				loadError: null
			} satisfies WaitingListLoadResult;
		})
		.catch((error): WaitingListLoadResult => {
			const message = error instanceof Error ? error.message : m.failed_load_waiting_list();
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
						admissionType,
						placement
					}
				} satisfies PaginationState<WaitingListFilters>,
				loadError: message
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters: {
				search,
				admissionType,
				placement
			},
			sort: {
				direction: sortDirection
			}
		},
		waitingListData
	};
};
