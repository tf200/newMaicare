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

export const load: PageLoad = async ({ params, url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const name = url.searchParams.get('name') ?? '';

	const [organizationResponse, countsResponse, locationsResponse] = await Promise.all([
		getOrganization(params.id),
		getOrganizationCounts(params.id),
		listOrganizationLocations(params.id, {
			page,
			pageSize,
			name: name.trim() || undefined
		})
	]);

	const organization: GetOrganizationResponse = organizationResponse.data;
	const counts: OrganizationCounts = countsResponse.data;
	const { count, page_size, results, next, previous } = locationsResponse.data;

	return {
		organization,
		counts,
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
		} satisfies PaginationState<{ name: string }>
	};
};
