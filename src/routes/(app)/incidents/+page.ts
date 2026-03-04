import { getIncidentCounts, listIncidents } from '$lib/api/incidents';
import type { IncidentListItemResponse } from '$lib/types/api';
import type { Incident } from '$lib/types/incidents';
import type { PaginationState } from '$lib/types/ui';
import type { PageLoad } from './$types';

export interface IncidentFilters {
	isConfirmed: '' | 'true' | 'false';
	search: string;
}

export interface IncidentsLoadResult {
	incidents: Incident[];
	pagination: PaginationState<IncidentFilters>;
	loadError: string | null;
}

export interface IncidentCountsLoadResult {
	counts: {
		seriousFatal: number;
		pendingConfirmation: number;
		past24h: number;
	};
	loadError: string | null;
}

const mapIncident = (item: IncidentListItemResponse): Incident => ({
	id: item.id,
	clientId: item.client_id,
	occurredAt: item.occurred_at,
	incidentType: item.incident_type,
	severity: item.severity_of_incident,
	isConfirmed: item.is_confirmed,
	clientFirstName: item.client_first_name,
	clientLastName: item.client_last_name,
	clientBsnNumber: item.client_bsn ?? undefined,
	employeeFirstName: item.employee_first_name,
	employeeLastName: item.employee_last_name,
	locationName: item.location_name
});

export const load: PageLoad = ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '10') || 10;
	const search = url.searchParams.get('search') ?? '';
	const normalizedSearch = search.trim().slice(0, 120);
	const isConfirmedParam = url.searchParams.get('is_confirmed');
	const isConfirmedFilter: IncidentFilters['isConfirmed'] =
		isConfirmedParam === 'true' || isConfirmedParam === 'false' ? isConfirmedParam : '';

	const incidentsData: Promise<IncidentsLoadResult> = listIncidents({
		page,
		pageSize,
		isConfirmed: isConfirmedFilter === '' ? undefined : isConfirmedFilter === 'true' ? true : false,
		search: normalizedSearch || undefined
	})
		.then((response) => {
			const { count, page_size, results, next, previous } = response.data;
			const incidents = results.map(mapIncident);

			return {
				incidents,
				pagination: {
					count,
					page,
					pageSize: page_size || pageSize,
					next,
					previous,
					filters: {
						isConfirmed: isConfirmedFilter,
						search: normalizedSearch
					}
				} satisfies PaginationState<IncidentFilters>,
				loadError: null
			} satisfies IncidentsLoadResult;
		})
		.catch((error): IncidentsLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load incidents.';
			return {
				incidents: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters: {
						isConfirmed: isConfirmedFilter,
						search: normalizedSearch
					}
				} satisfies PaginationState<IncidentFilters>,
				loadError: message
			};
		});

	const countsData: Promise<IncidentCountsLoadResult> = getIncidentCounts()
		.then((response) => ({
			counts: {
				seriousFatal: response.data.serious_fatal_count,
				pendingConfirmation: response.data.pending_confirmation_count,
				past24h: response.data.past_24h_count
			},
			loadError: null
		}))
		.catch(
			(error): IncidentCountsLoadResult => ({
				counts: {
					seriousFatal: 0,
					pendingConfirmation: 0,
					past24h: 0
				},
				loadError: error instanceof Error ? error.message : 'Failed to load incident counts.'
			})
		);

	return {
		initial: {
			page,
			pageSize,
			filters: {
				isConfirmed: isConfirmedFilter,
				search: normalizedSearch
			}
		},
		incidentsData,
		countsData
	};
};
