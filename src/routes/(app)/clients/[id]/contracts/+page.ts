import { listClientContracts } from '$lib/api/clients';
import type { ListClientContractsResponse } from '$lib/types/api';
import type { PageLoad } from './$types';

export interface ClientContractsLoadResult {
	rows: ListClientContractsResponse[];
	pagination: {
		page: number;
		pageSize: number;
		count: number;
	};
	loadError: string | null;
}

const toPositiveInt = (value: string | null, fallback: number) => {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed < 1) return fallback;
	return parsed;
};

export const load: PageLoad = ({ params, url }) => {
	const page = toPositiveInt(url.searchParams.get('page'), 1);
	const requestedPageSize = toPositiveInt(url.searchParams.get('page_size'), 10);
	const pageSize = Math.min(100, Math.max(5, requestedPageSize));

	const contractsData: Promise<ClientContractsLoadResult> = listClientContracts(
		params.id,
		page,
		pageSize
	)
		.then((response) => ({
			rows: response.data.results,
			pagination: {
				page,
				pageSize,
				count: response.data.count
			},
			loadError: null
		}))
		.catch((error) => ({
			rows: [],
			pagination: {
				page,
				pageSize,
				count: 0
			},
			loadError: error instanceof Error ? error.message : 'Failed to load client contracts.'
		}));

	return {
		initial: {
			page,
			pageSize
		},
		contractsData
	};
};
