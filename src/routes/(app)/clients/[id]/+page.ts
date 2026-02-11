import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getClientById } from '$lib/api/clients';
import type { ClientStatus } from '$lib/types/api';
import { mapWaitlistClient } from './waitlist-client';

export interface WaitlistClientLoadResult {
	client: import('$lib/mock/client-overview').ClientOverviewData;
	loadError: string | null;
}

const statusRouteMap: Record<ClientStatus, string> = {
	on_waiting_list: 'on-waiting-list',
	scheduled_in_care: 'scheduled-in-care',
	in_care: 'in-care',
	scheduled_out_of_care: 'scheduled-out-of-care',
	out_of_care: 'out-of-care'
};

export const load: PageLoad = async ({ params }) => {
	let response;

	try {
		response = await getClientById(params.id);
	} catch {
		throw redirect(307, `/clients/${params.id}/in-care`);
	}

	const status = response.data.status;

	if (status === 'on_waiting_list') {
		return {
			waitlistClientData: Promise.resolve({
				client: mapWaitlistClient(response.data),
				loadError: null
			} satisfies WaitlistClientLoadResult)
		};
	}

	const route = statusRouteMap[status] ?? 'in-care';
	throw redirect(307, `/clients/${params.id}/${route}`);
};
