import type { ClientOverviewData, ClientOverviewStatus } from '$lib/mock/client-overview';

export interface ClientOverviewViewModel {
	client: ClientOverviewData;
	status: ClientOverviewStatus;
	breadcrumbSectionLabel?: string;
}

export interface OverviewLoadResult {
	overview: ClientOverviewViewModel;
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
	status: ClientOverviewStatus,
	breadcrumbSectionLabel = breadcrumbLabels[status]
): ClientOverviewViewModel => ({
	client,
	status,
	breadcrumbSectionLabel
});
