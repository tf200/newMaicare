import type { PageLoad } from './$types';
import { m } from '$lib/paraglide/messages';
import { createOverviewViewModel, type OverviewLoadResult } from './overview.shared';
import { mapClientOverviewByStatus } from './overview-status.mapper';

export const load: PageLoad = ({ parent }) => {
	const overviewData: Promise<OverviewLoadResult> = parent()
		.then(({ clientData }) => clientData)
		.then((result): OverviewLoadResult => {
			if (!result.client) {
				return { overview: null, loadError: m.failed_load_client() };
			}

			const overview = mapClientOverviewByStatus(result.client);
			return {
				overview: createOverviewViewModel(overview, result.client, overview.status),
				loadError: null
			};
		})
		.catch((): OverviewLoadResult => ({ overview: null, loadError: m.failed_load_client() }));

	return { overviewData };
};
