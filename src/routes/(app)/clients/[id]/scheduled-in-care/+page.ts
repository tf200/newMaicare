import type { PageLoad } from './$types';
import { getClientById } from '$lib/api/clients';
import { clientOverviewMocks, type ClientOverviewData } from '$lib/mock/client-overview';
import { mapScheduledInCareClient } from '../scheduled-client';

export interface ScheduledInCareClientLoadResult {
	client: ClientOverviewData;
	loadError: string | null;
}

export const load: PageLoad = ({ params }) => {
	const scheduledClientData: Promise<ScheduledInCareClientLoadResult> = getClientById(params.id)
		.then((response) => ({
			client: mapScheduledInCareClient(response.data),
			loadError: null
		}))
		.catch((error): ScheduledInCareClientLoadResult => {
			const message =
				error instanceof Error ? error.message : 'Failed to load scheduled in-care client details.';

			return {
				client: clientOverviewMocks.scheduled_in_care,
				loadError: message
			};
		});

	return {
		scheduledClientData
	};
};
