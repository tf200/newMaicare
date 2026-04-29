import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getClientById } from '$lib/api/clients';
import { createOverviewViewModel, type OverviewLoadResult } from './overview.shared';
import { mapClientOverviewByStatus } from './overview-status.mapper';

export const load: PageLoad = async ({ params }) => {
	try {
		const response = await getClientById(params.id);
		const overview = mapClientOverviewByStatus(response.data);
		return {
			overviewData: Promise.resolve({
				overview: createOverviewViewModel(overview, overview.status),
				loadError: null
			} satisfies OverviewLoadResult)
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to load client overview.';
		error(500, message);
	}
};
