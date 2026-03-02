import type { ClientOverviewData } from '$lib/mock/client-overview';
import type {
	GetClientAlert,
	GetClientCare,
	GetClientCareSchedule,
	GetClientContractSummary,
	GetClientCoordinator,
	GetClientCore,
	GetClientCounts,
	GetClientDocuments,
	GetClientEmergencyContact,
	GetClientResponse as ApiGetClientResponse,
	GetClientIntake,
	GetClientMeta,
	GetClientRisks,
	GetClientSender,
	GetClientStatusTimeline,
	ClientStatus
} from '$lib/types/api';

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

interface GetClientGoal {
	title: string;
	priority: 'high' | 'medium' | 'low';
	topic_name: string | null;
}

type GetClientResponse = ApiGetClientResponse & {
	discharge_schedule?: GetClientDischargeSchedule;
	discharge_summary?: GetClientDischargeSummary;
};

const toTitleCase = (value: string) =>
	value
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

const getDisplayName = (firstName?: string | null, lastName?: string | null) =>
	`${firstName ?? ''} ${lastName ?? ''}`.trim();

const mapSeverityToTone = (
	severity: 'info' | 'warning' | 'critical'
): 'brand' | 'warning' | 'danger' => {
	if (severity === 'critical') return 'danger';
	if (severity === 'warning') return 'warning';
	return 'brand';
};

const formatAddress = (payload: GetClientResponse) => {
	const address = payload.client.address;
	if (!address) {
		return { line: 'Unknown address', cityLine: 'Unknown city' };
	}

	const house = `${address.house_number ?? ''}${address.house_number_addition ?? ''}`.trim();
	const line = `${address.street ?? ''}${house ? ` ${house}` : ''}`.trim();
	const cityLine = `${address.postal_code ?? ''} ${address.city ?? ''}`.trim();

	return {
		line: line || 'Unknown address',
		cityLine: cityLine || 'Unknown city'
	};
};

const toDocumentLabel = (value: string) =>
	value
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

const maskBsn = (value: string | number | null) => {
	if (value === null || value === undefined) return '—';
	const normalized = String(value).trim();
	if (!normalized) return '—';
	const tail = normalized.slice(-3);
	return `***.***.${tail}`;
};

const mergeAlerts = (apiAlerts: GetClientAlert[], recommendedAlerts: GetClientAlert[]) => {
	const byCode = new Map<string, GetClientAlert>();

	for (const alert of [...apiAlerts, ...recommendedAlerts]) {
		if (!byCode.has(alert.code)) {
			byCode.set(alert.code, alert);
		}
	}

	return [...byCode.values()];
};

const buildScheduledOutRecommendedAlerts = (payload: GetClientResponse): GetClientAlert[] => {
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
		alerts.push({
			code: 'missing_documents',
			severity: 'warning',
			message: `${payload.documents.missing.length} required document(s) are missing.`
		});
	}

	if ((payload.goals ?? []).length === 0) {
		alerts.push({
			code: 'missing_goals',
			severity: 'info',
			message: 'No active goals defined.'
		});
	}

	return alerts;
};

const getQuickLinks = (payload: GetClientResponse) => [
	{ label: 'Contracts', count: payload.counts.contracts, href: '#' },
	{ label: 'Incidents', count: payload.counts.incidents, href: '#' },
	{ label: 'Reports', count: payload.counts.reports, href: '#' },
	{ label: 'Evaluations', count: payload.counts.evaluations, href: '#' },
	{ label: 'Documents', count: payload.counts.documents, href: '#' },
	{ label: 'Appointments', count: payload.counts.appointments, href: '#' }
];

const getContractSummary = (payload: GetClientResponse) => {
	if (!payload.contract_summary) return undefined;

	const financingLabel = payload.contract_summary.active_contract
		? [
				payload.contract_summary.active_contract.financing_act,
				payload.contract_summary.active_contract.financing_option
			]
				.filter(Boolean)
				.join(' - ')
		: undefined;

	const contractType = payload.contract_summary.active_contract?.care_type
		? toTitleCase(payload.contract_summary.active_contract.care_type)
		: undefined;

	return {
		status: payload.contract_summary.has_active_approved_contract
			? 'Active approved contract'
			: 'No active approved contract',
		startDate: payload.contract_summary.active_contract?.start_date ?? undefined,
		endDate: payload.contract_summary.active_contract?.end_date ?? undefined,
		daysUntilContractEnd: payload.contract_summary.days_until_contract_end ?? undefined,
		financing: [financingLabel, contractType].filter(Boolean).join(' / ') || undefined
	};
};

const getSharedClientSections = (payload: GetClientResponse) => {
	const { line: address, cityLine } = formatAddress(payload);
	const goals = payload.goals ?? [];
	const existingDocuments = new Set(payload.documents.existing);
	const checklistLabels = [...payload.documents.existing, ...payload.documents.missing];
	const uniqueChecklistLabels = [...new Set(checklistLabels)];
	const coordinatorName = getDisplayName(
		payload.coordinator?.first_name,
		payload.coordinator?.last_name
	);

	return {
		address,
		cityLine,
		goals,
		coordinatorName,
		documentsChecklist: uniqueChecklistLabels.map((label, index) => ({
			id: `doc-${index}`,
			label: toDocumentLabel(label),
			present: existingDocuments.has(label)
		})),
		contacts: (payload.emergency_contacts ?? []).slice(0, 2).map((contact, index) => ({
			id: contact.id,
			name: getDisplayName(contact.first_name, contact.last_name),
			relation: contact.relationship,
			phone: contact.phone_number ?? undefined,
			email: contact.email ?? undefined,
			primary: index === 0,
			permissions: undefined
		})),
		intakeSummary: payload.intake
			? {
					conclusion: payload.intake.conclusion
						? toTitleCase(payload.intake.conclusion)
						: 'Not available',
					selfReliance: Math.max(
						0,
						Math.min(100, Math.round((payload.intake.self_sufficiency_score ?? 0) * 20))
					),
					participants: [],
					evaluationIntervalWeeks: 0,
					notes: payload.intake.conclusion_notes ?? undefined,
					lowestTopics: goals
						.slice(0, 3)
						.map((goal) => goal.topic_name)
						.filter((topic): topic is string => Boolean(topic))
				}
			: undefined
	};
};

export const mapScheduledOutOfCareClient = (payload: GetClientResponse): ClientOverviewData => {
	const shared = getSharedClientSections(payload);
	const combinedAlerts = mergeAlerts(
		payload.alerts ?? [],
		buildScheduledOutRecommendedAlerts(payload)
	);
	const dischargeSchedule = payload.discharge_schedule;
	const daysUntilDischarge = dischargeSchedule?.days_until_discharge;

	return {
		id: payload.client.id,
		fileNumber: payload.client.file_number ? String(payload.client.file_number) : '—',
		firstName: payload.client.first_name,
		lastName: payload.client.last_name,
		status: 'scheduled_out_of_care',
		locationName: payload.client.location?.name ?? 'No location',
		careType: payload.client.care_type ? toTitleCase(payload.client.care_type) : 'Unknown',
		coordinator: shared.coordinatorName || 'Unassigned',
		dateOfBirth: payload.client.date_of_birth ?? '',
		senderName: payload.sender?.name ?? undefined,
		phone: payload.sender?.phone_number ?? undefined,
		email: payload.sender?.email_address ?? undefined,
		maskedBsn: maskBsn(payload.client.bsn),
		address: shared.address,
		cityLine: shared.cityLine,
		nationality: undefined,
		gender: payload.client.gender ? toTitleCase(payload.client.gender) : 'Unknown',
		nextEvaluationDate: undefined,
		lastEvaluationDate: payload.meta?.last_updated_at ?? undefined,
		plannedInCareDate:
			payload.care?.care_start_date ?? payload.care_schedule?.care_start_date ?? undefined,
		plannedOutOfCareDate: dischargeSchedule?.discharge_date ?? undefined,
		registrationStatus:
			payload.status === 'scheduled_out_of_care' ? 'Scheduled out of care' : payload.status,
		intakeAppointmentDate: undefined,
		intakeAppointmentLocation: payload.client.location?.name ?? undefined,
		alerts: combinedAlerts.map((alert) => ({
			id: alert.code,
			label: alert.message,
			count: 1,
			tone: mapSeverityToTone(alert.severity)
		})),
		goals: shared.goals.map((goal, index) => ({
			id: `goal-${index}`,
			title: goal.title,
			priority: goal.priority,
			progressNote: goal.topic_name ?? undefined
		})),
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
		contacts: shared.contacts,
		intakeSummary: shared.intakeSummary,
		documentsChecklist: shared.documentsChecklist,
		contractSummary: getContractSummary(payload),
		quickLinks: getQuickLinks(payload)
	};
};

export const mapOutOfCareClient = (payload: GetClientResponse): ClientOverviewData => {
	const shared = getSharedClientSections(payload);
	const dischargeSummary = payload.discharge_summary;

	return {
		id: payload.client.id,
		fileNumber: payload.client.file_number ? String(payload.client.file_number) : '—',
		firstName: payload.client.first_name,
		lastName: payload.client.last_name,
		status: 'out_of_care',
		locationName: payload.client.location?.name ?? 'No location',
		careType: payload.client.care_type ? toTitleCase(payload.client.care_type) : 'Unknown',
		coordinator: shared.coordinatorName || 'Unassigned',
		dateOfBirth: payload.client.date_of_birth ?? '',
		senderName: payload.sender?.name ?? undefined,
		phone: payload.sender?.phone_number ?? undefined,
		email: payload.sender?.email_address ?? undefined,
		maskedBsn: maskBsn(payload.client.bsn),
		address: shared.address,
		cityLine: shared.cityLine,
		nationality: undefined,
		gender: payload.client.gender ? toTitleCase(payload.client.gender) : 'Unknown',
		nextEvaluationDate: undefined,
		lastEvaluationDate:
			dischargeSummary?.discharge_date ?? payload.meta?.last_updated_at ?? undefined,
		plannedInCareDate:
			payload.care?.care_start_date ?? payload.care_schedule?.care_start_date ?? undefined,
		plannedOutOfCareDate: dischargeSummary?.discharge_date ?? undefined,
		registrationStatus: payload.status === 'out_of_care' ? 'Out of care' : payload.status,
		intakeAppointmentDate: undefined,
		intakeAppointmentLocation: payload.client.location?.name ?? undefined,
		alerts: (payload.alerts ?? []).map((alert) => ({
			id: alert.code,
			label: alert.message,
			count: 1,
			tone: mapSeverityToTone(alert.severity)
		})),
		goals: shared.goals.map((goal, index) => ({
			id: `goal-${index}`,
			title: goal.title,
			priority: goal.priority,
			progressNote: goal.topic_name ?? undefined
		})),
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
		contacts: shared.contacts,
		intakeSummary: shared.intakeSummary,
		documentsChecklist: shared.documentsChecklist,
		contractSummary: getContractSummary(payload),
		quickLinks: getQuickLinks(payload)
	};
};
