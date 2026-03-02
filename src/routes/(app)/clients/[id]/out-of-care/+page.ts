import type { PageLoad } from './$types';
import { getClientById } from '$lib/api/clients';
import { clientOverviewMocks, type ClientOverviewData } from '$lib/mock/client-overview';
import { mapOutOfCareClient } from '../out-of-care-client';

export interface OutOfCareClientLoadResult {
	client: ClientOverviewData;
	loadError: string | null;
}

export const load: PageLoad = ({ params }) => {
	const outOfCareClientData: Promise<OutOfCareClientLoadResult> = getClientById(params.id)
		.then((response) => ({
			client: mapOutOfCareClient(response.data as any),
			loadError: null
		}))
		.catch((error): OutOfCareClientLoadResult => {
			const message =
				error instanceof Error ? error.message : 'Failed to load out-of-care client details.';

			return {
				client: clientOverviewMocks.out_of_care,
				loadError: message
			};
		});

	return {
		outOfCareClientData
	};
};
