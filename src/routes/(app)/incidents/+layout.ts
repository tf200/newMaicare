import { getIncidentCounts } from '$lib/api/incidents';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { getAuthState } from '$lib/state/auth.svelte';
import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export interface IncidentCountsLoadResult {
	counts: {
		seriousFatal: number;
		pendingConfirmation: number;
		past24h: number;
	};
	loadError: string | null;
}

export const load: LayoutLoad = ({ fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CARE_COORDINATION.VIEW, PERMISSIONS.INCIDENT.VIEW])) {
		error(403, m.incident_statistics_access_denied());
	}

	depends('app:incidents:counts');

	const countsData: Promise<IncidentCountsLoadResult> = getIncidentCounts({ fetchFn: fetch })
		.then((response): IncidentCountsLoadResult => ({
			counts: {
				seriousFatal: response.data.serious_fatal_count,
				pendingConfirmation: response.data.pending_confirmation_count,
				past24h: response.data.past_24h_count
			},
			loadError: null
		}))
		.catch((error): IncidentCountsLoadResult => ({
			counts: {
				seriousFatal: 0,
				pendingConfirmation: 0,
				past24h: 0
			},
			loadError: error instanceof Error ? error.message : m.failed_load_incident_counts()
		}));

	return { countsData };
};
