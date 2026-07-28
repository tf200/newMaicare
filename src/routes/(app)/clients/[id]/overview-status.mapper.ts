import { m } from '$lib/paraglide/messages';
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
	maskBsn,
	mapSeverityToTone,
	mergeAlerts,
	toTitleCase
} from './overview-mapper.shared';
import type { ClientOverviewData, ClientOverviewStatus } from './overview.shared';

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

const careTypeLabels = {
	protected_living: m.protected_living,
	training_center: m.training_center,
	supported_independent_living: m.supported_independent_living,
	ambulatory_support: m.ambulatory_support,
	other: m.other
};

const genderLabels = {
	male: m.male,
	female: m.female,
	other: m.other,
	unknown: m.unknown
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
	message: m.missing_coordinator_alert()
});

const buildMissingDocumentsAlert = (count: number): GetClientAlert => ({
	code: 'missing_documents',
	severity: 'warning',
	message: count === 1 ? m.missing_document_alert() : m.missing_documents_alert({ count })
});

const buildMissingGoalsAlert = (): GetClientAlert => ({
	code: 'missing_goals',
	severity: 'info',
	message: m.missing_goals_alert()
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
		locationName: payload.client.location?.name ?? m.no_location(),
		careType: payload.client.care_type ? careTypeLabels[payload.client.care_type]() : m.unknown(),
		coordinator:
			overrides.coordinator ??
			(getDisplayName(payload.coordinator?.first_name, payload.coordinator?.last_name) ||
				m.unassigned()),
		dateOfBirth: payload.client.date_of_birth ?? '',
		age: payload.client.age,
		senderName: payload.sender?.name ?? undefined,
		phone: payload.sender?.phone_number ?? undefined,
		email: payload.sender?.email_address ?? undefined,
		maskedBsn: maskBsn(payload.client.bsn),
		bsnVerifiedByName: payload.client.bsn_verified_by_name ?? undefined,
		address,
		cityLine,
		gender: payload.client.gender ? genderLabels[payload.client.gender]() : m.unknown(),
		nextEvaluationDate: overrides.nextEvaluationDate,
		lastEvaluationDate: overrides.lastEvaluationDate,
		plannedInCareDate: overrides.plannedInCareDate,
		plannedOutOfCareDate: overrides.plannedOutOfCareDate,
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
			message: m.care_start_reached_alert()
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
			message: m.missing_active_contract_alert()
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
			message: m.discharge_due_missing_evaluation_alert()
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
		coordinator: m.unassigned(),
		lastEvaluationDate: payload.meta?.last_updated_at ?? undefined,
		plannedInCareDate: payload.meta?.waitlist_since ?? undefined,
		alerts: toOverviewAlerts(payload.alerts ?? []),
		timeline: [
			{
				id: 'event-last-updated',
				type: 'evaluation',
				title: m.client_waitlist_profile_updated(),
				meta: payload.meta?.last_updated_at
					? m.synchronized_from_api()
					: m.no_update_timestamp_available(),
				date: payload.meta?.last_updated_at ?? undefined
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
				title: m.care_start_planned(),
				meta:
					typeof payload.care_schedule?.days_until_start === 'number'
						? m.days_until_start({
								count: payload.care_schedule.days_until_start,
								unit: payload.care_schedule.days_until_start === 1 ? m.day_lower() : m.days_lower()
							})
						: m.start_date_not_available(),
				date: payload.care_schedule?.care_start_date ?? undefined
			},
			{
				id: 'event-status-change-reason',
				type: 'report',
				title: m.latest_status_change(),
				meta: payload.status_timeline?.last_change_reason ?? m.no_reason_provided(),
				date: payload.status_timeline?.last_changed_at ?? payload.meta?.last_updated_at ?? undefined
			}
		],
		contractSummary: undefined,
		quickLinks: buildQuickLinks(payload.counts, {
			contracts: payload.counts.approved_contracts_count ?? payload.counts.contracts,
			appointments: payload.counts.upcoming_appointments_count ?? payload.counts.appointments
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
				title: m.next_evaluation_milestone(),
				meta:
					typeof payload.evaluation_summary?.days_left === 'number'
						? m.evaluation_days_left({
								count: payload.evaluation_summary.days_left,
								unit: payload.evaluation_summary.days_left === 1 ? m.day_lower() : m.days_lower(),
								priority: payload.evaluation_summary.priority ?? m.normal()
							})
						: m.no_evaluation_due_date(),
				date:
					payload.evaluation_summary?.next_evaluation_date ??
					payload.care?.next_evaluation_date ??
					undefined
			},
			{
				id: 'event-status-change-reason',
				type: 'report',
				title: m.latest_status_change(),
				meta: payload.status_timeline?.last_change_reason ?? m.no_reason_provided(),
				date: payload.status_timeline?.last_changed_at ?? payload.meta?.last_updated_at ?? undefined
			}
		],
		intakeSummary: buildIntakeSummary(payload.intake, goals),
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
				title: m.discharge_planned(),
				meta:
					typeof daysUntilDischarge === 'number'
						? daysUntilDischarge >= 0
							? m.days_until_discharge({
									count: daysUntilDischarge,
									unit: daysUntilDischarge === 1 ? m.day_lower() : m.days_lower()
								})
							: m.discharge_due_days_ago({
									count: Math.abs(daysUntilDischarge),
									unit: Math.abs(daysUntilDischarge) === 1 ? m.day_lower() : m.days_lower()
								})
						: m.discharge_date_planned(),
				date: dischargeSchedule?.discharge_date ?? undefined
			},
			{
				id: 'event-status-change-reason',
				type: 'report',
				title: m.latest_status_change(),
				meta: payload.status_timeline?.last_change_reason ?? m.no_reason_provided(),
				date: payload.status_timeline?.last_changed_at ?? payload.meta?.last_updated_at ?? undefined
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
				title: m.client_discharged(),
				meta:
					dischargeSummary?.final_evaluation ??
					(dischargeSummary?.discharge_reason
						? m.discharge_reason({ reason: toTitleCase(dischargeSummary.discharge_reason) })
						: m.discharge_completed()),
				date: dischargeSummary?.discharge_date ?? undefined
			},
			{
				id: 'event-status-change-reason',
				type: 'report',
				title: m.latest_status_change(),
				meta: payload.status_timeline?.last_change_reason ?? m.no_reason_provided(),
				date: payload.status_timeline?.last_changed_at ?? payload.meta?.last_updated_at ?? undefined
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
