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

export interface SendersLoadResult {
	senders: SenderRow[];
	pagination: PaginationState<{ search: string; includeArchived?: boolean }>;
	loadError: string | null;
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

export const load: PageLoad = ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const search = url.searchParams.get('search') ?? '';
	const includeArchivedParam = url.searchParams.get('include_archived');
	const includeArchived =
		includeArchivedParam === 'true' ? true : includeArchivedParam === 'false' ? false : undefined;

	const sendersData: Promise<SendersLoadResult> = listSenders({
		page,
		pageSize,
		search: search.trim() || undefined,
		includeArchived
	})
		.then((response) => {
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
				} satisfies PaginationState<{ search: string; includeArchived?: boolean }>,
				loadError: null
			} satisfies SendersLoadResult;
		})
		.catch((error): SendersLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load senders.';
			return {
				senders: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters: {
						search,
						includeArchived
					}
				} satisfies PaginationState<{ search: string; includeArchived?: boolean }>,
				loadError: message
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters: {
				search,
				includeArchived
			}
		},
		sendersData
	};
};
