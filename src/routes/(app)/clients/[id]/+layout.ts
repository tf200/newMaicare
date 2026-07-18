import { getClientById } from '$lib/api/clients';
import type { GetClientResponse } from '$lib/types/api';
import type { LayoutLoad } from './$types';

export interface ClientDetailLoadResult {
	client: GetClientResponse | null;
	clientName: string;
	clientInitials: string;
	loadError: string | null;
}

export const load: LayoutLoad = ({ params, fetch, depends }) => {
	const clientId = params.id;
	depends(`app:client:${clientId}:detail`);

	const clientData: Promise<ClientDetailLoadResult> = getClientById(clientId, { fetchFn: fetch })
		.then((response) => {
			const client = response.data.client;
			const initials = [client.first_name, client.last_name]
				.filter(Boolean)
				.map((name) => name[0])
				.join('')
				.toUpperCase();

			return {
				client: response.data,
				clientName: `${client.first_name} ${client.last_name}`.trim(),
				clientInitials: initials || 'CP',
				loadError: null
			};
		})
		.catch((error) => ({
			client: null,
			clientName: 'Client Profile',
			clientInitials: 'CP',
			loadError: error instanceof Error ? error.message : 'Failed to load client.'
		}));

	return { clientId, clientData };
};
