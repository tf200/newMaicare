import { m } from '$lib/paraglide/messages';
import type {
	GetClientAlert,
	GetClientContractSummary,
	GetClientEmergencyContact,
	GetClientGoal,
	GetClientIntake,
	GetClientResponse
} from '$lib/types/api';
import type { ClientOverviewData, ClientOverviewTarget } from './overview.shared';

export const toTitleCase = (value: string) =>
	value
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

export const getDisplayName = (firstName?: string | null, lastName?: string | null) =>
	`${firstName ?? ''} ${lastName ?? ''}`.trim();

export const mapSeverityToTone = (
	severity: 'info' | 'warning' | 'critical'
): 'brand' | 'warning' | 'danger' => {
	if (severity === 'critical') return 'danger';
	if (severity === 'warning') return 'warning';
	return 'brand';
};

export const formatAddress = (payload: GetClientResponse) => {
	const address = payload.client.address;
	if (!address) {
		return { line: m.unknown_address(), cityLine: m.unknown_city() };
	}

	const house = `${address.house_number ?? ''}${address.house_number_addition ?? ''}`.trim();
	const line = `${address.street ?? ''}${house ? ` ${house}` : ''}`.trim();
	const cityLine = `${address.postal_code ?? ''} ${address.city ?? ''}`.trim();

	return {
		line: line || m.unknown_address(),
		cityLine: cityLine || m.unknown_city()
	};
};

const documentLabels: Record<string, () => string> = {
	registration_form: m.overview_document_registration_form,
	intake_form: m.overview_document_intake_form,
	consent_form: m.overview_document_consent_form,
	consent_declaration_pdf: m.overview_document_consent_form,
	risk_assessment: m.risk_assessment,
	risk_assessment_pdf: m.risk_assessment,
	self_reliance_matrix: m.overview_document_self_reliance_matrix,
	force_inventory: m.overview_document_force_inventory,
	care_plan: m.overview_document_care_plan,
	signaling_plan: m.overview_document_signaling_plan,
	cooperation_agreement: m.overview_document_cooperation_agreement,
	collaboration_agreement_pdf: m.overview_document_cooperation_agreement,
	appointment_card: m.appointment_card
};

export const toDocumentLabel = (value: string) => documentLabels[value]?.() ?? toTitleCase(value);

export const maskBsn = (value: string | number | null) => {
	if (value === null || value === undefined) return '—';
	const normalized = String(value).trim();
	if (!normalized) return '—';
	const tail = normalized.slice(-3);
	return `***.***.${tail}`;
};

export const mergeAlerts = (apiAlerts: GetClientAlert[], recommendedAlerts: GetClientAlert[]) => {
	const byCode = new Map<string, GetClientAlert>();

	for (const alert of [...apiAlerts, ...recommendedAlerts]) {
		if (!byCode.has(alert.code)) {
			byCode.set(alert.code, alert);
		}
	}

	return [...byCode.values()];
};

export const buildGoals = (goals: GetClientGoal[]): ClientOverviewData['goals'] =>
	goals.map((goal, index) => ({
		id: `goal-${index}`,
		title: goal.title,
		priority: goal.priority,
		progressNote: goal.topic_name ?? undefined
	}));

export const buildDocumentsChecklist = (documents: GetClientResponse['documents']) => {
	const existingDocuments = new Set(documents.existing);
	const checklistLabels = [...documents.existing, ...documents.missing];
	const uniqueChecklistLabels = [...new Set(checklistLabels)];

	return uniqueChecklistLabels.map((label, index) => ({
		id: `doc-${index}`,
		label: toDocumentLabel(label),
		present: existingDocuments.has(label)
	}));
};

export const buildContacts = (
	contacts: GetClientEmergencyContact[]
): ClientOverviewData['contacts'] =>
	contacts.slice(0, 2).map((contact, index) => ({
		id: contact.id,
		name: getDisplayName(contact.first_name, contact.last_name),
		relation: contact.relationship,
		phone: contact.phone_number ?? undefined,
		email: contact.email ?? undefined,
		primary: index === 0
	}));

export const buildIntakeSummary = (
	intake: GetClientIntake | null | undefined,
	goals: GetClientGoal[]
): ClientOverviewData['intakeSummary'] =>
	intake
		? {
				conclusion: intake.conclusion
					? {
							suitable: m.suitable(),
							unsuitable: m.unsuitable(),
							further_investigation: m.further_investigation(),
							possible_palcement_date: m.possible_placement_date(),
							other: m.other()
						}[intake.conclusion]
					: m.not_available(),
				selfReliance: Math.max(
					0,
					Math.min(100, Math.round((intake.self_sufficiency_score ?? 0) * 20))
				),
				lowestTopics: goals
					.slice(0, 3)
					.map((goal) => goal.topic_name)
					.filter((topic): topic is string => Boolean(topic))
			}
		: undefined;

export const buildQuickLinks = (
	counts: GetClientResponse['counts'],
	overrides?: Partial<Record<ClientOverviewTarget, number>>
): ClientOverviewData['quickLinks'] => [
	{ target: 'contracts', count: overrides?.contracts ?? counts.contracts },
	{ target: 'incidents', count: counts.incidents },
	{ target: 'reports', count: counts.reports },
	{ target: 'goals', count: counts.evaluations },
	{ target: 'documents', count: counts.documents },
	{
		target: 'appointments',
		count: overrides?.appointments ?? counts.appointments
	}
];

export const buildContractSummary = (
	contractSummary: GetClientContractSummary | null | undefined
): ClientOverviewData['contractSummary'] => {
	if (!contractSummary) return undefined;

	const financingLabel = contractSummary.active_contract
		? [
				contractSummary.active_contract.financing_act,
				contractSummary.active_contract.financing_option
			]
				.filter(Boolean)
				.join(' - ')
		: undefined;

	const contractType = contractSummary.active_contract?.care_type
		? toTitleCase(contractSummary.active_contract.care_type)
		: undefined;

	return {
		active: contractSummary.has_active_approved_contract,
		status: contractSummary.has_active_approved_contract
			? m.active_approved_contract()
			: m.no_active_approved_contract(),
		startDate: contractSummary.active_contract?.start_date ?? undefined,
		endDate: contractSummary.active_contract?.end_date ?? undefined,
		daysUntilContractEnd: contractSummary.days_until_contract_end ?? undefined,
		financing: [financingLabel, contractType].filter(Boolean).join(' / ') || undefined
	};
};
