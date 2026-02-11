import type { PageLoad } from './$types';
import { listWaitingListClients } from '$lib/api/clients';
import type { ListWaitingListClientsResponse } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';

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

const matchesAdmissionType = (row: WaitingListRow, type: string) => {
	if (!type || type === 'all') return true;
	return row.admissionType === type;
};

export const load: PageLoad = ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const requestedPageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const pageSize = Math.min(100, Math.max(5, requestedPageSize));
	const search = (url.searchParams.get('search') ?? '').trim();
	const placement = (url.searchParams.get('placement') ?? '').trim();
	const admissionType = (url.searchParams.get('admission_type') ?? '').trim();
	const sortParam = (url.searchParams.get('sort_days') ?? 'desc').toLowerCase();
	const sortDirection: 'asc' | 'desc' = sortParam === 'asc' ? 'asc' : 'desc';

	const waitingListData: Promise<WaitingListLoadResult> = listWaitingListClients({
		page,
		pageSize,
		search: search || undefined,
		placement: placement || undefined,
		sortDays: sortDirection
	})
		.then((response) => {
			const { count, next, previous, page_size, results } = response.data;
			const mappedRows = results.map(
				(item): WaitingListRow => ({
					id: item.id,
					clientFirstName: item.first_name,
					clientLastName: item.last_name,
					clientBsnNumber: item.bsn,
					careType: mapCareType(item.care_type),
					senderName: item.sender_name ?? '—',
					daysInWaitingList: item.days_in_waitlist,
					admissionType: mapAdmissionType(item.admission_type)
				})
			);

			const filteredRows = mappedRows.filter((row) => matchesAdmissionType(row, admissionType));

			return {
				rows: filteredRows,
				stats: {
					total: admissionType ? filteredRows.length : count
				},
				pagination: {
					count: admissionType ? filteredRows.length : count,
					page,
					pageSize: page_size || pageSize,
					next: admissionType ? null : next,
					previous: admissionType ? null : previous,
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
			const message = error instanceof Error ? error.message : 'Failed to load waiting list.';
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
