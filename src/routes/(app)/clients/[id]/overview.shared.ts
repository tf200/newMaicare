import type { ClientOverviewData, ClientOverviewStatus } from '$lib/mock/client-overview';
import type { GetClientResponse } from '$lib/types/api';

export interface ClientOverviewViewModel {
	client: ClientOverviewData;
	clientDetail: GetClientResponse;
	status: ClientOverviewStatus;
	breadcrumbSectionLabel?: string;
}

export interface OverviewLoadResult {
	overview: ClientOverviewViewModel | null;
	loadError: string | null;
}

const breadcrumbLabels: Record<ClientOverviewStatus, string> = {
	on_waiting_list: 'On Waiting List',
	scheduled_in_care: 'Scheduled In Care',
	in_care: 'In Care',
	scheduled_out_of_care: 'Scheduled Out of Care',
	out_of_care: 'Out of Care'
};
export const createOverviewViewModel = (
	client: ClientOverviewData,
	clientDetail: GetClientResponse,
	status: ClientOverviewStatus,
	breadcrumbSectionLabel = breadcrumbLabels[status]
): ClientOverviewViewModel => ({
	client,
	clientDetail,
	status,
	breadcrumbSectionLabel
});
