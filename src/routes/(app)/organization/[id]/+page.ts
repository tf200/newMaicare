import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import {
	getOrganization,
	getOrganizationCounts,
	listOrganizationLocations
} from '$lib/api/organizations';
import type {
	GetOrganizationResponse,
	OrganizationCounts,
	OrganizationLocation
} from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';
import { PERMISSIONS } from '$lib/config/permissions';
import { getAuthState } from '$lib/state/auth.svelte';
import { m } from '$lib/paraglide/messages';

export interface OrganizationDetailLoadResult {
	organization: GetOrganizationResponse | null;
	loadError: string | null;
}

export interface OrganizationCountsLoadResult {
	counts: OrganizationCounts;
	loadError: string | null;
}

export interface OrganizationLocationsLoadResult {
	locations: OrganizationLocation[];
	pagination: PaginationState<{ name: string }>;
	loadError: string | null;
}

const parsePositiveInteger = (value: string | null, fallback: number, maximum: number) => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
};

export const load: PageLoad = ({ params, url, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.ORGANISATION.VIEW)) {
		error(403, 'You do not have permission to view this resource.');
	}

	depends('app:organization:detail');
	depends('app:organization:detail-counts');
	depends('app:organization:locations');

	const page = parsePositiveInteger(url.searchParams.get('page'), 1, 10_000);
	const pageSize = parsePositiveInteger(url.searchParams.get('page_size'), 8, 100);
	const name = url.searchParams.get('name') ?? '';

	const organizationData: Promise<OrganizationDetailLoadResult> = getOrganization(params.id, {
		fetchFn: fetch
	})
		.then((organizationResponse) => ({
			organization: organizationResponse.data,
			loadError: null
		}))
		.catch((error): OrganizationDetailLoadResult => ({
			organization: null,
			loadError: error instanceof Error ? error.message : m.failed_load_organization()
		}));

	const countsData: Promise<OrganizationCountsLoadResult> = getOrganizationCounts(params.id, {
		fetchFn: fetch
	})
		.then((countsResponse) => ({
			counts: countsResponse.data,
			loadError: null
		}))
		.catch((error): OrganizationCountsLoadResult => ({
			counts: {
				organisation_id: params.id,
				organisation_name: '',
				employee_count: 0,
				client_count: 0,
				location_count: 0
			},
			loadError: error instanceof Error ? error.message : m.failed_load_organization_counts()
		}));

	const locationsData: Promise<OrganizationLocationsLoadResult> = listOrganizationLocations(
		params.id,
		{
			page,
			pageSize,
			name: name.trim() || undefined
		},
		{ fetchFn: fetch }
	)
		.then((locationsResponse) => {
			const { count, page_size, results, next, previous } = locationsResponse.data;
			return {
				locations: results,
				pagination: {
					count,
					page,
					pageSize: page_size || pageSize,
					next,
					previous,
					filters: {
						name
					}
				} satisfies PaginationState<{ name: string }>,
				loadError: null
			} satisfies OrganizationLocationsLoadResult;
		})
		.catch((error): OrganizationLocationsLoadResult => ({
			locations: [],
			pagination: {
				count: 0,
				page,
				pageSize,
				next: null,
				previous: null,
				filters: {
					name
				}
			} satisfies PaginationState<{ name: string }>,
			loadError: error instanceof Error ? error.message : m.failed_load_locations()
		}));

	return {
		initial: {
			page,
			pageSize,
			filters: {
				name
			}
		},
		organizationData,
		countsData,
		locationsData
	};
};
