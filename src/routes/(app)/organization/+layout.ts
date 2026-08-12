import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { getGlobalOrganizationCounts } from '$lib/api/organizations';
import { PERMISSIONS } from '$lib/config/permissions';
import { getAuthState } from '$lib/state/auth.svelte';
import { m } from '$lib/paraglide/messages';

export interface OrganizationCountsLoadResult {
	counts: {
		totalLocations: number;
		totalCapacity: number;
	};
	loadError: string | null;
}

export const load: LayoutLoad = ({ fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.ORGANISATION.VIEW)) {
		error(403, 'You do not have permission to view this resource.');
	}

	depends('app:organization:counts');

	const countsData: Promise<OrganizationCountsLoadResult> = getGlobalOrganizationCounts({
		fetchFn: fetch
	})
		.then((response) => ({
			counts: {
				totalLocations: response.data.total_locations,
				totalCapacity: response.data.total_capacity
			},
			loadError: null
		}))
		.catch((): OrganizationCountsLoadResult => ({
			counts: {
				totalLocations: 0,
				totalCapacity: 0
			},
			loadError: m.failed_load_organization_counts()
		}));

	return { countsData };
};
