import type { PageLoad } from './$types';
import { createOverviewViewModel, type OverviewLoadResult } from './overview.shared';
import { mapClientOverviewByStatus } from './overview-status.mapper';

export const load: PageLoad = ({ parent }) => {
	const overviewData: Promise<OverviewLoadResult> = parent().then(({ clientData }) =>
		clientData.then((result) => {
			if (!result.client) {
				return { overview: null, loadError: result.loadError ?? 'Failed to load client overview.' };
			}

			const overview = mapClientOverviewByStatus(result.client);
			return {
				overview: createOverviewViewModel(overview, result.client, overview.status),
				loadError: null
			};
		})
	);

	return { overviewData };
};
