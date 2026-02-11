import type { PageLoad } from './$types';
import { getClientById } from '$lib/api/clients';
import { clientOverviewMocks, type ClientOverviewData } from '$lib/mock/client-overview';
import { mapWaitlistClient } from '../waitlist-client';

export interface WaitlistClientLoadResult {
	client: ClientOverviewData;
	loadError: string | null;
}

export const load: PageLoad = ({ params }) => {
	const waitlistClientData: Promise<WaitlistClientLoadResult> = getClientById(params.id)
		.then((response) => ({
			client: mapWaitlistClient(response.data),
			loadError: null
		}))
		.catch((error): WaitlistClientLoadResult => {
			const message =
				error instanceof Error ? error.message : 'Failed to load waiting list client details.';

			return {
				client: clientOverviewMocks.on_waiting_list,
				loadError: message
			};
		});

	return {
		waitlistClientData
	};
};
