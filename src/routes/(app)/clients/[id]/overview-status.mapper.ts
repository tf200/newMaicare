import type { ClientOverviewData, ClientOverviewStatus } from '$lib/mock/client-overview';
import type {
	ClientStatus,
	GetClientAlert,
	GetClientResponse as ApiGetClientResponse
} from '$lib/types/api';
import {
	buildContacts,
	buildContractSummary,
	buildDocumentsChecklist,
	buildGoals,
	buildIntakeSummary,
	buildQuickLinks,
	formatAddress,
	getDisplayName,
	mapSeverityToTone,
	mergeAlerts,
	toTitleCase
} from './overview-mapper.shared';

interface GetClientDischargeSchedule {
	discharge_date: string | null;
	discharge_reason: string | null;
	final_evaluation: string | null;
	days_until_discharge: number | null;
	is_due: boolean;
	missing_final_evaluation: boolean;
}

interface GetClientDischargeSummary {
	discharge_date: string | null;
	discharge_reason: string | null;
	final_evaluation: string | null;
}

type OverviewGetClientResponse = ApiGetClientResponse & {
	discharge_schedule?: GetClientDischargeSchedule;
	discharge_summary?: GetClientDischargeSummary;
};

const registrationLabels: Record<ClientOverviewStatus, string> = {
	on_waiting_list: 'On waiting list',
	scheduled_in_care: 'Scheduled in care',
	in_care: 'In care',
	scheduled_out_of_care: 'Scheduled out of care',
	out_of_care: 'Out of care'
};

const toOverviewAlerts = (alerts: GetClientAlert[]): ClientOverviewData['alerts'] =>
	alerts.map((alert) => ({
		id: alert.code,
		label: alert.message,
		count: 1,
		tone: mapSeverityToTone(alert.severity)
	}));

const buildCoordinatorAlert = (): GetClientAlert => ({
	code: 'missing_coordinator',
	severity: 'warning',
	message: 'No coordinator assigned yet.'
});

const buildMissingDocumentsAlert = (count: number): GetClientAlert => ({
	code: 'missing_documents',
	severity: 'warning',
	message: `${count} required document(s) are missing.`
});

const buildMissingGoalsAlert = (): GetClientAlert => ({
	code: 'missing_goals',
	severity: 'info',
	message: 'No active goals defined.'
});

const buildBaseOverview = (
	payload: OverviewGetClientResponse,
	status: ClientOverviewStatus,
	overrides: {
		coordinator?: string;
		nextEvaluationDate?: string;
		lastEvaluationDate?: string;
		plannedInCareDate?: string;
		plannedOutOfCareDate?: string;
		alerts: ClientOverviewData['alerts'];
		timeline: ClientOverviewData['timeline'];
		contractSummary?: ClientOverviewData['contractSummary'];
		quickLinks?: ClientOverviewData['quickLinks'];
		intakeSummary?: ClientOverviewData['intakeSummary'];
	}
): ClientOverviewData => {
	const { line: address, cityLine } = formatAddress(payload);
	const goals = payload.goals ?? [];

	return {
		id: payload.client.id,
		fileNumber: payload.client.file_number ? String(payload.client.file_number) : '—',
		firstName: payload.client.first_name,
		lastName: payload.client.last_name,
		status,
		locationName: payload.client.location?.name ?? 'No location',
		careType: payload.client.care_type ? toTitleCase(payload.client.care_type) : 'Unknown',
		coordinator:
			overrides.coordinator ??
			(getDisplayName(payload.coordinator?.first_name, payload.coordinator?.last_name) ||
				'Unassigned'),
		dateOfBirth: payload.client.date_of_birth ?? '',
		senderName: payload.sender?.name ?? undefined,
		phone: payload.sender?.phone_number ?? undefined,
		email: payload.sender?.email_address ?? undefined,
		maskedBsn: payload.client.bsn ? String(payload.client.bsn) : '—',
		bsnVerifiedBy: payload.client.bsn_verified_by ?? undefined,
		bsnVerifiedByName: payload.client.bsn_verified_by_name ?? undefined,
		address,
		cityLine,
		nationality: undefined,
		gender: payload.client.gender ? toTitleCase(payload.client.gender) : 'Unknown',
		nextEvaluationDate: overrides.nextEvaluationDate,
		lastEvaluationDate: overrides.lastEvaluationDate,
		plannedInCareDate: overrides.plannedInCareDate,
		plannedOutOfCareDate: overrides.plannedOutOfCareDate,
		registrationStatus: payload.status === status ? registrationLabels[status] : payload.status,
		intakeAppointmentDate: undefined,
		intakeAppointmentLocation: payload.client.location?.name ?? undefined,
		alerts: overrides.alerts,
		goals: buildGoals(goals),
		timeline: overrides.timeline,
		contacts: buildContacts(payload.emergency_contacts ?? []),
		intakeSummary: overrides.intakeSummary ?? buildIntakeSummary(payload.intake, goals),
		documentsChecklist: buildDocumentsChecklist(payload.documents),
		contractSummary: overrides.contractSummary,
		quickLinks: overrides.quickLinks ?? buildQuickLinks(payload.counts),
		education: payload.client.education
			? {
					currentlyEnrolled: payload.client.education.currently_enrolled,
					institution: payload.client.education.institution,
					mentorName: payload.client.education.mentor_name,
					mentorPhone: payload.client.education.mentor_phone,
					mentorEmail: payload.client.education.mentor_email,
					additionalNotes: payload.client.education.additional_notes,
					level: payload.client.education.level
				}
			: undefined,
		work: payload.client.work
			? {
					currentlyEmployed: payload.client.work.currently_employed,
					currentEmployer: payload.client.work.current_employer,
					employerPhone: payload.client.work.employer_phone,
					employerEmail: payload.client.work.employer_email,
					currentPosition: payload.client.work.current_position,
					startDate: payload.client.work.start_date,
					additionalNotes: payload.client.work.additional_notes
				}
			: undefined
	};
};

const buildScheduledInCareAlerts = (payload: OverviewGetClientResponse): GetClientAlert[] => {
	const alerts: GetClientAlert[] = [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const careStartDate = payload.care_schedule?.care_start_date;
	const careStartReached = careStartDate ? new Date(careStartDate) <= today : false;

	if (careStartReached && payload.status === 'scheduled_in_care') {
		alerts.push({
			code: 'start_date_reached_not_activated',
			severity: 'warning',
			message: 'Care start date has been reached, but client is still scheduled.'
		});
	}

	if (!payload.coordinator?.employee_id) alerts.push(buildCoordinatorAlert());
	if ((payload.documents.missing ?? []).length > 0) {
		alerts.push(buildMissingDocumentsAlert(payload.documents.missing.length));
	}
	if ((payload.goals ?? []).length === 0) alerts.push(buildMissingGoalsAlert());

	return alerts;
};

const buildInCareAlerts = (payload: OverviewGetClientResponse): GetClientAlert[] => {
	const alerts: GetClientAlert[] = [];

	if (!payload.coordinator?.employee_id) alerts.push(buildCoordinatorAlert());
	if (!payload.contract_summary?.has_active_approved_contract) {
		alerts.push({
			code: 'missing_active_contract',
			severity: 'warning',
			message: 'No active approved contract found.'
		});
	}
	if ((payload.documents.missing ?? []).length > 0) {
		alerts.push(buildMissingDocumentsAlert(payload.documents.missing.length));
	}
	if ((payload.goals ?? []).length === 0) alerts.push(buildMissingGoalsAlert());

	return alerts;
};

const buildScheduledOutOfCareAlerts = (payload: OverviewGetClientResponse): GetClientAlert[] => {
	const alerts: GetClientAlert[] = [];
	const dischargeSchedule = payload.discharge_schedule;

	if (
		payload.status === 'scheduled_out_of_care' &&
		dischargeSchedule?.is_due &&
		dischargeSchedule.missing_final_evaluation
	) {
		alerts.push({
			code: 'discharge_due_missing_final_evaluation',
			severity: 'warning',
			message: 'Discharge is due but final evaluation is missing'
		});
	}
	if ((payload.documents.missing ?? []).length > 0) {
		alerts.push(buildMissingDocumentsAlert(payload.documents.missing.length));
	}
	if ((payload.goals ?? []).length === 0) alerts.push(buildMissingGoalsAlert());

	return alerts;
};

export const mapWaitlistClient = (payload: OverviewGetClientResponse): ClientOverviewData =>
	buildBaseOverview(payload, 'on_waiting_list', {
		coordinator: 'Unassigned',
		lastEvaluationDate: payload.meta?.last_updated_at ?? undefined,
		plannedInCareDate: payload.meta?.waitlist_since ?? undefined,
		alerts: toOverviewAlerts(payload.alerts ?? []),
		timeline: [
			{
				id: 'event-last-updated',
				type: 'evaluation',
				title: 'Client waitlist profile updated',
				meta: payload.meta?.last_updated_at
					? 'Synchronized from API'
					: 'No update timestamp available',
				date: payload.meta?.last_updated_at ?? new Date().toISOString(),
				link: '#'
			}
		],
		contractSummary: undefined
	});

export const mapScheduledInCareClient = (
	payload: OverviewGetClientResponse
): ClientOverviewData => {
	const combinedAlerts = mergeAlerts(payload.alerts ?? [], buildScheduledInCareAlerts(payload));

	return buildBaseOverview(payload, 'scheduled_in_care', {
		nextEvaluationDate: payload.care_schedule?.next_evaluation_date ?? undefined,
		lastEvaluationDate:
			payload.meta?.last_updated_at ?? payload.care_schedule?.placed_in_care_at ?? undefined,
		plannedInCareDate: payload.care_schedule?.care_start_date ?? undefined,
		alerts: toOverviewAlerts(combinedAlerts),
		timeline: [
			{
				id: 'event-care-start',
				type: 'evaluation',
				title: 'Care start planned',
				meta: payload.care_schedule?.days_until_start
					? `${payload.care_schedule.days_until_start} day(s) until start`
					: 'Start date not available',
				date: payload.care_schedule?.care_start_date ?? new Date().toISOString(),
				link: '#'
			},
			{
				id: 'event-status-change-reason',
				type: 'report',
				title: 'Latest status change',
				meta: payload.status_timeline?.last_change_reason ?? 'No reason provided',
				date: payload.meta?.last_updated_at ?? new Date().toISOString(),
				link: '#'
			}
		],
		contractSummary: undefined,
		quickLinks: buildQuickLinks(payload.counts, {
			Contracts: payload.counts.approved_contracts_count ?? payload.counts.contracts,
			Appointments: payload.counts.upcoming_appointments_count ?? payload.counts.appointments
		})
	});
};

export const mapInCareClient = (payload: OverviewGetClientResponse): ClientOverviewData => {
	const goals = payload.goals ?? [];
	const combinedAlerts = mergeAlerts(payload.alerts ?? [], buildInCareAlerts(payload));

	return buildBaseOverview(payload, 'in_care', {
		nextEvaluationDate:
			payload.care?.next_evaluation_date ??
			payload.evaluation_summary?.next_evaluation_date ??
			undefined,
		lastEvaluationDate:
			payload.care?.last_evaluation_anchor_date ??
			payload.evaluation_summary?.last_completed?.submitted_at ??
			payload.meta?.last_updated_at ??
			undefined,
		plannedInCareDate: payload.care?.care_start_date ?? undefined,
		alerts: toOverviewAlerts(combinedAlerts),
		timeline: [
			{
				id: 'event-evaluation-next',
				type: 'evaluation',
				title: 'Next evaluation milestone',
				meta: payload.evaluation_summary?.days_left
					? `${payload.evaluation_summary.days_left} day(s) left (${payload.evaluation_summary.priority ?? 'normal'})`
					: 'No evaluation due date available',
				date:
					payload.evaluation_summary?.next_evaluation_date ??
					payload.care?.next_evaluation_date ??
					new Date().toISOString(),
				link: '#'
			},
			{
				id: 'event-status-change-reason',
				type: 'report',
				title: 'Latest status change',
				meta: payload.status_timeline?.last_change_reason ?? 'No reason provided',
				date:
					payload.status_timeline?.last_changed_at ??
					payload.meta?.last_updated_at ??
					new Date().toISOString(),
				link: '#'
			}
		],
		intakeSummary: buildIntakeSummary(
			payload.intake,
			goals,
			payload.care?.evaluation_intervals_weeks ?? 0
		),
		contractSummary: buildContractSummary(payload.contract_summary)
	});
};

export const mapScheduledOutOfCareClient = (
	payload: OverviewGetClientResponse
): ClientOverviewData => {
	const combinedAlerts = mergeAlerts(payload.alerts ?? [], buildScheduledOutOfCareAlerts(payload));
	const dischargeSchedule = payload.discharge_schedule;
	const daysUntilDischarge = dischargeSchedule?.days_until_discharge;

	return buildBaseOverview(payload, 'scheduled_out_of_care', {
		lastEvaluationDate: payload.meta?.last_updated_at ?? undefined,
		plannedInCareDate:
			payload.care?.care_start_date ?? payload.care_schedule?.care_start_date ?? undefined,
		plannedOutOfCareDate: dischargeSchedule?.discharge_date ?? undefined,
		alerts: toOverviewAlerts(combinedAlerts),
		timeline: [
			{
				id: 'event-discharge-date',
				type: 'evaluation',
				title: 'Discharge planned',
				meta:
					typeof daysUntilDischarge === 'number'
						? daysUntilDischarge >= 0
							? `${daysUntilDischarge} day(s) until discharge`
							: `Discharge due ${Math.abs(daysUntilDischarge)} day(s) ago`
						: 'Discharge date planned',
				date: dischargeSchedule?.discharge_date ?? new Date().toISOString(),
				link: '#'
			},
			{
				id: 'event-status-change-reason',
				type: 'report',
				title: 'Latest status change',
				meta: payload.status_timeline?.last_change_reason ?? 'No reason provided',
				date:
					payload.status_timeline?.last_changed_at ??
					payload.meta?.last_updated_at ??
					new Date().toISOString(),
				link: '#'
			}
		],
		contractSummary: buildContractSummary(payload.contract_summary)
	});
};

export const mapOutOfCareClient = (payload: OverviewGetClientResponse): ClientOverviewData => {
	const dischargeSummary = payload.discharge_summary;

	return buildBaseOverview(payload, 'out_of_care', {
		lastEvaluationDate:
			dischargeSummary?.discharge_date ?? payload.meta?.last_updated_at ?? undefined,
		plannedInCareDate:
			payload.care?.care_start_date ?? payload.care_schedule?.care_start_date ?? undefined,
		plannedOutOfCareDate: dischargeSummary?.discharge_date ?? undefined,
		alerts: toOverviewAlerts(payload.alerts ?? []),
		timeline: [
			{
				id: 'event-discharged',
				type: 'evaluation',
				title: 'Client discharged',
				meta:
					dischargeSummary?.final_evaluation ??
					(dischargeSummary?.discharge_reason
						? `Reason: ${toTitleCase(dischargeSummary.discharge_reason)}`
						: 'Discharge completed'),
				date: dischargeSummary?.discharge_date ?? new Date().toISOString(),
				link: '#'
			},
			{
				id: 'event-status-change-reason',
				type: 'report',
				title: 'Latest status change',
				meta: payload.status_timeline?.last_change_reason ?? 'No reason provided',
				date:
					payload.status_timeline?.last_changed_at ??
					payload.meta?.last_updated_at ??
					new Date().toISOString(),
				link: '#'
			}
		],
		contractSummary: buildContractSummary(payload.contract_summary)
	});
};

export const mapClientOverviewByStatus = (
	payload: OverviewGetClientResponse,
	status: ClientStatus = payload.status
): ClientOverviewData => {
	switch (status) {
		case 'on_waiting_list':
			return mapWaitlistClient(payload);
		case 'scheduled_in_care':
			return mapScheduledInCareClient(payload);
		case 'in_care':
			return mapInCareClient(payload);
		case 'scheduled_out_of_care':
			return mapScheduledOutOfCareClient(payload);
		case 'out_of_care':
			return mapOutOfCareClient(payload);
	}
};
