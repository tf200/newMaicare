import { listIncidents } from '$lib/api/incidents';
import type { IncidentListItemResponse } from '$lib/types/api';
import type { Incident, IncidentStats } from '$lib/types/incidents';
import type { PaginationState } from '$lib/types/ui';
import type { PageLoad } from './$types';

export interface IncidentFilters {
	isConfirmed: '' | 'true' | 'false';
	search: string;
}

export interface IncidentsLoadResult {
	incidents: Incident[];
	stats: IncidentStats;
	pagination: PaginationState<IncidentFilters>;
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
				stats: {
					total: count,
					pendingConfirmation: incidents.filter((item) => !item.isConfirmed).length,
					seriousOrFatal: incidents.filter(
						(item) => item.severity === 'serious' || item.severity === 'fatal'
					).length,
					thisMonth: incidents.filter((item) => {
						const occurredAt = new Date(item.occurredAt);
						const now = new Date();
						return (
							occurredAt.getFullYear() === now.getFullYear() &&
							occurredAt.getMonth() === now.getMonth()
						);
					}).length
				},
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
				stats: {
					total: 0,
					pendingConfirmation: 0,
					seriousOrFatal: 0,
					thisMonth: 0
				},
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

	return {
		initial: {
			page,
			pageSize,
			filters: {
				isConfirmed: isConfirmedFilter,
				search: normalizedSearch
			}
		},
		incidentsData
	};
};
