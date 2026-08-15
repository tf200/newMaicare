import { listIncidents } from '$lib/api/incidents';
import type { IncidentListItemResponse } from '$lib/types/api';
import type { Incident } from '$lib/types/incidents';
import type { PaginationState } from '$lib/types/ui';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';
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

const parsePositiveInteger = (value: string | null, fallback: number, maximum?: number) => {
	if (value == null || value.trim() === '') return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	const normalized = Math.max(1, Math.trunc(parsed));
	return maximum == null ? normalized : Math.min(maximum, normalized);
};

export const load: PageLoad = ({ url, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CARE_COORDINATION.VIEW, PERMISSIONS.INCIDENT.VIEW])) {
		error(403, 'You do not have permission to view incidents.');
	}

	depends('app:incidents:list');

	const page = parsePositiveInteger(url.searchParams.get('page'), 1);
	const pageSize = Math.max(5, parsePositiveInteger(url.searchParams.get('page_size'), 10, 100));
	const search = url.searchParams.get('search') ?? '';
	const normalizedSearch = search.trim().slice(0, 120);
	const isConfirmedParam = url.searchParams.get('is_confirmed');
	const isConfirmedFilter: IncidentFilters['isConfirmed'] =
		isConfirmedParam === 'true' || isConfirmedParam === 'false' ? isConfirmedParam : '';

	const incidentsData: Promise<IncidentsLoadResult> = listIncidents(
		{
			page,
			pageSize,
			isConfirmed:
				isConfirmedFilter === '' ? undefined : isConfirmedFilter === 'true' ? true : false,
			search: normalizedSearch || undefined
		},
		{ fetchFn: fetch }
	)
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
			const message = error instanceof Error ? error.message : m.failed_load_incidents();
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
