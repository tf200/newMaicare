import type { LayoutLoad } from './$types';
import { getRegistrationCounts } from '$lib/api/registration';

export interface RegistrationCountsLoadResult {
	counts: {
		total: number;
		pendingReview: number;
		processed: number;
		highRisk: number;
	};
	loadError: string | null;
}

export const load: LayoutLoad = ({ depends, fetch }) => {
	depends('app:registrations:stats');

	const registrationsCountsData: Promise<RegistrationCountsLoadResult> = getRegistrationCounts({
		fetchFn: fetch
	})
		.then((response) => ({
			counts: {
				total: response.data.total,
				pendingReview: response.data.pending_review,
				processed: response.data.processed,
				highRisk: response.data.high_risk
			},
			loadError: null
		}))
		.catch((error): RegistrationCountsLoadResult => ({
			counts: {
				total: 0,
				pendingReview: 0,
				processed: 0,
				highRisk: 0
			},
			loadError: error instanceof Error ? error.message : 'Failed to load registration counts.'
		}));

	return {
		registrationsCountsData
	};
};
