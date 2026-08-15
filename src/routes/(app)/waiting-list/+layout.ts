import type { LayoutLoad } from './$types';
import { getWaitingListStats } from '$lib/api/clients';
import { m } from '$lib/paraglide/messages';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { error } from '@sveltejs/kit';

export interface WaitingListStatsResult {
	totalClients: number;
	totalCrisis: number;
	totalRegular: number;
	avgDaysInWaitlist: number;
	loadError: string | null;
}

export const load: LayoutLoad = ({ fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CARE_COORDINATION.VIEW, PERMISSIONS.CLIENT.VIEW])) {
		error(403, 'You do not have permission to view waiting-list statistics.');
	}

	depends('app:waiting-list:stats');

	const waitingListStats: Promise<WaitingListStatsResult> = getWaitingListStats({ fetchFn: fetch })
		.then((response): WaitingListStatsResult => ({
			totalClients: response.data.total_clients,
			totalCrisis: response.data.total_crisis,
			totalRegular: response.data.total_regular,
			avgDaysInWaitlist: response.data.avg_days_in_waitlist,
			loadError: null
		}))
		.catch((error): WaitingListStatsResult => ({
			totalClients: 0,
			totalCrisis: 0,
			totalRegular: 0,
			avgDaysInWaitlist: 0,
			loadError: error instanceof Error ? error.message : m.failed_load_waiting_list_stats()
		}));

	return { waitingListStats };
};
