import { getClientById } from '$lib/api/clients';
import {
	clientOverviewMocks,
	type ClientOverviewData,
	type ClientOverviewStatus
} from '$lib/mock/client-overview';

export type OverviewMetricKind =
	| 'waitlist_since'
	| 'days_on_waitlist'
	| 'start_date'
	| 'last_evaluation'
	| 'next_evaluation'
	| 'discharge_date'
	| 'coordinator'
	| 'contract_status'
	| 'intake_conclusion';

export interface OverviewMetric {
	kind: OverviewMetricKind;
	value: string;
	accent?: 'default' | 'warning' | 'success';
}

export interface OverviewActionState {
	canPutOutOfCare: boolean;
	canCreateIncident: boolean;
	canCreateProgressReport: boolean;
	canAddGoal: boolean;
	canUploadDocument: boolean;
	canEditClient: boolean;
}

export interface ClientOverviewViewModel {
	client: ClientOverviewData;
	status: ClientOverviewStatus;
	breadcrumbSectionLabel?: string;
	lifecycleMetrics: OverviewMetric[];
	actions: OverviewActionState;
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

const safeValue = (value?: string | null, fallback = '—') => value || fallback;

const getStatusLifecycleMetrics = (
	client: ClientOverviewData,
	status: ClientOverviewStatus
): OverviewMetric[] => {
	switch (status) {
		case 'on_waiting_list':
			return [
				{ kind: 'waitlist_since', value: safeValue(client.plannedInCareDate) },
				{ kind: 'days_on_waitlist', value: safeValue(client.plannedInCareDate) },
				{ kind: 'intake_conclusion', value: safeValue(client.intakeSummary?.conclusion) }
			];
		case 'scheduled_in_care':
			return [
				{ kind: 'start_date', value: safeValue(client.plannedInCareDate), accent: 'warning' },
				{ kind: 'coordinator', value: safeValue(client.coordinator) },
				{ kind: 'intake_conclusion', value: safeValue(client.intakeSummary?.conclusion) }
			];
		case 'in_care':
			return [
				{ kind: 'last_evaluation', value: safeValue(client.lastEvaluationDate) },
				{ kind: 'next_evaluation', value: safeValue(client.nextEvaluationDate) },
				{
					kind: 'contract_status',
					value: safeValue(client.contractSummary?.status),
					accent: 'success'
				}
			];
		case 'scheduled_out_of_care':
			return [
				{ kind: 'discharge_date', value: safeValue(client.plannedOutOfCareDate), accent: 'warning' },
				{ kind: 'next_evaluation', value: safeValue(client.nextEvaluationDate) },
				{
					kind: 'contract_status',
					value: safeValue(client.contractSummary?.status)
				}
			];
		case 'out_of_care':
			return [
				{ kind: 'discharge_date', value: safeValue(client.plannedOutOfCareDate) },
				{ kind: 'last_evaluation', value: safeValue(client.lastEvaluationDate) },
				{ kind: 'contract_status', value: safeValue(client.contractSummary?.status) }
			];
	}
};

const getActionState = (status: ClientOverviewStatus): OverviewActionState => ({
	canPutOutOfCare: status === 'in_care',
	canCreateIncident: status !== 'on_waiting_list',
	canCreateProgressReport: status !== 'on_waiting_list',
	canAddGoal: true,
	canUploadDocument: true,
	canEditClient: true
});

export const createOverviewViewModel = (
	client: ClientOverviewData,
	status: ClientOverviewStatus,
	breadcrumbSectionLabel = breadcrumbLabels[status]
): ClientOverviewViewModel => ({
	client,
	status,
	breadcrumbSectionLabel,
	lifecycleMetrics: getStatusLifecycleMetrics(client, status),
	actions: getActionState(status)
});

export const createOverviewLoad = async (
	clientId: string,
	status: ClientOverviewStatus,
	mapClient: (payload: Awaited<ReturnType<typeof getClientById>>['data']) => ClientOverviewData,
	failureMessage: string
): Promise<OverviewLoadResult> => {
	try {
		const response = await getClientById(clientId);

		return {
			overview: createOverviewViewModel(mapClient(response.data), status),
			loadError: null
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : failureMessage;

		return {
			overview: createOverviewViewModel(clientOverviewMocks[status], status),
			loadError: message
		};
	}
};
