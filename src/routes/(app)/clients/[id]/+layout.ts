import { getClientById } from '$lib/api/clients';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params }) => {
	const clientId = params.id;
	try {
		const response = await getClientById(clientId);
		const client = response.data.client;
		const initials = [client.first_name, client.last_name]
			.filter(Boolean)
			.map((n) => n[0])
			.join('')
			.toUpperCase();

		return {
			clientName: `${client.first_name} ${client.last_name}`,
			clientInitials: initials || 'CP'
		};
	} catch (error) {
		console.error('Failed to load client for layout:', error);
		return {
			clientName: 'Client Profile'
		};
	}
};
