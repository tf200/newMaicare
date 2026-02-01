import type { PageLoad } from './$types';
import { listSenders } from '$lib/api/senders';
import type { SenderListItem } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';

interface SenderRow {
	id: string;
	types: string;
	name: string;
	street: string | null;
	houseNumber: string | null;
	houseNumberAddition: string | null;
	postalCode: string | null;
	city: string | null;
	land: string | null;
	kvkNumber: string | null;
	btwNumber: string | null;
	phoneNumber: string | null;
	clientNumber: string | null;
	clientsCount: number;
	createdAt: string;
	updatedAt: string;
}

const mapSender = (sender: SenderListItem): SenderRow => ({
	id: sender.id,
	types: sender.types,
	name: sender.name,
	street: sender.street,
	houseNumber: sender.house_number,
	houseNumberAddition: sender.house_number_addition,
	postalCode: sender.postal_code,
	city: sender.city,
	land: sender.land,
	kvkNumber: sender.KVKnumber,
	btwNumber: sender.BTWnumber,
	phoneNumber: sender.phone_number,
	clientNumber: sender.client_number,
	clientsCount: sender.clients_count ?? 0,
	createdAt: sender.created_at,
	updatedAt: sender.updated_at
});

export const load: PageLoad = async ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const search = url.searchParams.get('search') ?? '';
	const includeArchivedParam = url.searchParams.get('include_archived');
	const includeArchived =
		includeArchivedParam === 'true' ? true : includeArchivedParam === 'false' ? false : undefined;

	const response = await listSenders({
		page,
		pageSize,
		search: search.trim() || undefined,
		includeArchived
	});

	const { count, page_size, results, next, previous } = response.data;

	return {
		senders: results.map(mapSender),
		pagination: {
			count,
			page,
			pageSize: page_size || pageSize,
			next,
			previous,
			filters: {
				search,
				includeArchived
			}
		} satisfies PaginationState<{ search: string; includeArchived?: boolean }>
	};
};
