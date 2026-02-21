import { getClientMedicalOverview } from '$lib/api/clients';
import type { GetClientMedicalOverviewResponse } from '$lib/types/api';
import type { PageLoad } from './$types';

export interface ClientMedicalOverviewLoadResult {
	overview: GetClientMedicalOverviewResponse;
	loadError: string | null;
}

export const load: PageLoad = ({ params }) => {
	const medicalOverviewData: Promise<ClientMedicalOverviewLoadResult> = getClientMedicalOverview(
		params.id
	)
		.then((response) => ({
			overview: response.data,
			loadError: null
		}))
		.catch((error) => ({
			overview: {
				diagnoses: [],
				medication_orders: []
			},
			loadError: error instanceof Error ? error.message : 'Failed to load medical overview.'
		}));

	return {
		medicalOverviewData
	};
};
