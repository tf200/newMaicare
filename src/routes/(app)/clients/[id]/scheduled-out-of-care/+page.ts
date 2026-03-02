import type { PageLoad } from './$types';
import { getClientById } from '$lib/api/clients';
import { clientOverviewMocks, type ClientOverviewData } from '$lib/mock/client-overview';
import { mapScheduledOutOfCareClient } from '../out-of-care-client';

export interface ScheduledOutOfCareClientLoadResult {
	client: ClientOverviewData;
	loadError: string | null;
}

export const load: PageLoad = ({ params }) => {
	const scheduledOutOfCareClientData: Promise<ScheduledOutOfCareClientLoadResult> = getClientById(
		params.id
	)
		.then((response) => ({
			client: mapScheduledOutOfCareClient(response.data as any),
			loadError: null
		}))
		.catch((error): ScheduledOutOfCareClientLoadResult => {
			const message =
				error instanceof Error
					? error.message
					: 'Failed to load scheduled out-of-care client details.';

			return {
				client: clientOverviewMocks.scheduled_out_of_care,
				loadError: message
			};
		});

	return {
		scheduledOutOfCareClientData
	};
};
