import type { PageLoad } from './$types';
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

export const load: PageLoad = ({ params, url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const name = url.searchParams.get('name') ?? '';

	const organizationData: Promise<OrganizationDetailLoadResult> = getOrganization(params.id)
		.then((organizationResponse) => ({
			organization: organizationResponse.data,
			loadError: null
		}))
		.catch(
			(error): OrganizationDetailLoadResult => ({
				organization: null,
				loadError: error instanceof Error ? error.message : 'Failed to load organization.'
			})
		);

	const countsData: Promise<OrganizationCountsLoadResult> = getOrganizationCounts(params.id)
		.then((countsResponse) => ({
			counts: countsResponse.data,
			loadError: null
		}))
		.catch(
			(error): OrganizationCountsLoadResult => ({
				counts: {
					organisation_id: params.id,
					organisation_name: '',
					employee_count: 0,
					client_count: 0,
					location_count: 0
				},
				loadError: error instanceof Error ? error.message : 'Failed to load organization counts.'
			})
		);

	const locationsData: Promise<OrganizationLocationsLoadResult> = listOrganizationLocations(
		params.id,
		{
			page,
			pageSize,
			name: name.trim() || undefined
		}
	)
		.then((locationsResponse) => {
			const { count, page_size, results, next, previous } = locationsResponse.data;
			return {
				locations: results as OrganizationLocation[],
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
		.catch(
			(error): OrganizationLocationsLoadResult => ({
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
				loadError: error instanceof Error ? error.message : 'Failed to load organization locations.'
			})
		);

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
