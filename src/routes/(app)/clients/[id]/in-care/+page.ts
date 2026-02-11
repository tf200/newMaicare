import type { PageLoad } from './$types';
import { getClientById } from '$lib/api/clients';
import { clientOverviewMocks, type ClientOverviewData } from '$lib/mock/client-overview';
import { mapInCareClient } from '../in-care-client';

export interface InCareClientLoadResult {
	client: ClientOverviewData;
	loadError: string | null;
}

export const load: PageLoad = ({ params }) => {
	const inCareClientData: Promise<InCareClientLoadResult> = getClientById(params.id)
		.then((response) => ({
			client: mapInCareClient(response.data),
			loadError: null
		}))
		.catch((error): InCareClientLoadResult => {
			const message =
				error instanceof Error ? error.message : 'Failed to load in-care client details.';

			return {
				client: clientOverviewMocks.in_care,
				loadError: message
			};
		});

	return {
		inCareClientData
	};
};
