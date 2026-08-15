import type { LayoutLoad } from './$types';
import { getInCareStats } from '$lib/api/clients';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';

export interface InCareStatsResult {
	clientsInCare: number;
	clientsScheduledInCare: number;
	contractsEndingSoon: number;
	total: number;
	loadError: string | null;
}

export const load: LayoutLoad = ({ fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CARE_COORDINATION.VIEW, PERMISSIONS.CLIENT.VIEW])) {
		error(403, 'You do not have permission to view in-care statistics.');
	}

	depends('app:in-care:stats');

	const inCareStats: Promise<InCareStatsResult> = getInCareStats({ fetchFn: fetch })
		.then((response): InCareStatsResult => ({
			clientsInCare: response.data.clients_in_care,
			clientsScheduledInCare: response.data.clients_scheduled_in_care,
			contractsEndingSoon: response.data.contracts_ending_soon,
			total: response.data.total,
			loadError: null
		}))
		.catch((error): InCareStatsResult => ({
			clientsInCare: 0,
			clientsScheduledInCare: 0,
			contractsEndingSoon: 0,
			total: 0,
			loadError: error instanceof Error ? error.message : m.failed_load_in_care_stats()
		}));

	return { inCareStats };
};
