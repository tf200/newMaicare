import type { ClientOverviewData } from '$lib/mock/client-overview';
import type { GetClientAlert, GetClientResponse } from '$lib/types/api';

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

const buildRecommendedAlerts = (payload: GetClientResponse): GetClientAlert[] => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const careStartDate = payload.care_schedule?.care_start_date;
	const careStartReached = careStartDate ? new Date(careStartDate) <= today : false;

	const alerts: GetClientAlert[] = [];

	if (careStartReached && payload.status === 'scheduled_in_care') {
		alerts.push({
			code: 'start_date_reached_not_activated',
			severity: 'warning',
			message: 'Care start date has been reached, but client is still scheduled.'
		});
	}

	if (!payload.coordinator?.employee_id) {
		alerts.push({
			code: 'missing_coordinator',
			severity: 'warning',
			message: 'No coordinator assigned yet.'
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

const mergeAlerts = (apiAlerts: GetClientAlert[], recommendedAlerts: GetClientAlert[]) => {
	const byCode = new Map<string, GetClientAlert>();

	for (const alert of [...apiAlerts, ...recommendedAlerts]) {
		if (!byCode.has(alert.code)) {
			byCode.set(alert.code, alert);
		}
	}

	return [...byCode.values()];
};

export const mapScheduledInCareClient = (payload: GetClientResponse): ClientOverviewData => {
	const { line: address, cityLine } = formatAddress(payload);
	const goals = payload.goals ?? [];
	const combinedAlerts = mergeAlerts(payload.alerts ?? [], buildRecommendedAlerts(payload));

	const quickLinks = [
		{
			label: 'Contracts',
			count: payload.counts.approved_contracts_count ?? payload.counts.contracts,
			href: '#'
		},
		{ label: 'Incidents', count: payload.counts.incidents, href: '#' },
		{ label: 'Reports', count: payload.counts.reports, href: '#' },
		{ label: 'Evaluations', count: payload.counts.evaluations, href: '#' },
		{ label: 'Documents', count: payload.counts.documents, href: '#' },
		{
			label: 'Appointments',
			count: payload.counts.upcoming_appointments_count ?? payload.counts.appointments,
			href: '#'
		}
	];

	const existingDocuments = new Set(payload.documents.existing);
	const checklistLabels = [...payload.documents.existing, ...payload.documents.missing];
	const uniqueChecklistLabels = [...new Set(checklistLabels)];

	const coordinatorName = getDisplayName(
		payload.coordinator?.first_name,
		payload.coordinator?.last_name
	);

	return {
		id: payload.client.id,
		fileNumber: payload.client.file_number ? String(payload.client.file_number) : '—',
		firstName: payload.client.first_name,
		lastName: payload.client.last_name,
		status: 'scheduled_in_care',
		locationName: payload.client.location?.name ?? 'No location',
		careType: payload.client.care_type ? toTitleCase(payload.client.care_type) : 'Unknown',
		coordinator: coordinatorName || 'Unassigned',
		dateOfBirth: payload.client.date_of_birth ?? '',
		senderName: payload.sender?.name ?? undefined,
		phone: payload.sender?.phone_number ?? undefined,
		email: payload.sender?.email_address ?? undefined,
		maskedBsn: maskBsn(payload.client.bsn),
		address,
		cityLine,
		nationality: undefined,
		gender: payload.client.gender ? toTitleCase(payload.client.gender) : 'Unknown',
		nextEvaluationDate: payload.care_schedule?.next_evaluation_date ?? undefined,
		lastEvaluationDate:
			payload.meta?.last_updated_at ?? payload.care_schedule?.placed_in_care_at ?? undefined,
		plannedInCareDate: payload.care_schedule?.care_start_date ?? undefined,
		plannedOutOfCareDate: undefined,
		registrationStatus:
			payload.status === 'scheduled_in_care' ? 'Scheduled in care' : payload.status,
		intakeAppointmentDate: undefined,
		intakeAppointmentLocation: payload.client.location?.name ?? undefined,
		alerts: combinedAlerts.map((alert) => ({
			id: alert.code,
			label: alert.message,
			count: 1,
			tone: mapSeverityToTone(alert.severity)
		})),
		goals: goals.map((goal, index) => ({
			id: `goal-${index}`,
			title: goal.title,
			priority: goal.priority,
			progressNote: goal.topic_name ?? undefined
		})),
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
			: undefined,
		documentsChecklist: uniqueChecklistLabels.map((label, index) => ({
			id: `doc-${index}`,
			label: toDocumentLabel(label),
			present: existingDocuments.has(label)
		})),
		contractSummary: undefined,
		quickLinks
	};
};
