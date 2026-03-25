import type { PageLoad } from './$types';
import { getClientById } from '$lib/api/clients';
import { clientOverviewMocks } from '$lib/mock/client-overview';
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
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load client overview.';
		return {
			overviewData: Promise.resolve({
				overview: createOverviewViewModel(clientOverviewMocks.in_care, 'in_care'),
				loadError: message
			} satisfies OverviewLoadResult)
		};
	}
};
