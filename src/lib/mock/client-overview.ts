export type ClientOverviewStatus =
	| 'on_waiting_list'
	| 'scheduled_in_care'
	| 'in_care'
	| 'scheduled_out_of_care'
	| 'out_of_care';

export interface ClientOverviewContact {
	id: string;
	name: string;
	relation: string;
	phone?: string;
	email?: string;
	primary?: boolean;
	permissions?: string[];
}

export interface ClientOverviewGoal {
	id: string;
	title: string;
	priority: 'high' | 'medium' | 'low';
	progressNote?: string;
}

export interface ClientTimelineItem {
	id: string;
	type: 'report' | 'incident' | 'evaluation' | 'ai_report' | 'document';
	title: string;
	meta: string;
	date: string;
	link: string;
	severity?: 'low' | 'medium' | 'high';
}

export interface ClientQuickLink {
	label: string;
	count: number;
	href: string;
}

export interface ClientOverviewData {
	id: string;
	fileNumber: string;
	firstName: string;
	lastName: string;
	status: ClientOverviewStatus;
	locationName?: string;
	careType?: string;
	coordinator?: string;
	dateOfBirth: string;
	phone?: string;
	email?: string;
	maskedBsn: string;
	address: string;
	cityLine: string;
	nationality?: string;
	gender?: string;
	nextEvaluationDate?: string;
	lastEvaluationDate?: string;
	plannedInCareDate?: string;
	plannedOutOfCareDate?: string;
	registrationStatus?: string;
	intakeAppointmentDate?: string;
	intakeAppointmentLocation?: string;
	alerts: Array<{ id: string; label: string; count: number; tone: 'brand' | 'warning' | 'danger' }>;
	goals: ClientOverviewGoal[];
	timeline: ClientTimelineItem[];
	contacts: ClientOverviewContact[];
	intakeSummary?: {
		conclusion: string;
		selfReliance: number;
		participants: string[];
		evaluationIntervalWeeks: number;
		notes?: string;
		lowestTopics: string[];
	};
	documentsChecklist: Array<{ id: string; label: string; present: boolean }>;
	contractSummary?: {
		status: string;
		startDate?: string;
		endDate?: string;
		financing?: string;
		outstandingInvoices?: { count: number; amount: string };
	};
	quickLinks: ClientQuickLink[];
}

const baseClient: Omit<
	ClientOverviewData,
	'status' | 'alerts' | 'goals' | 'timeline' | 'quickLinks' | 'documentsChecklist'
> = {
	id: 'client-001',
	fileNumber: 'MC-24-000873',
	firstName: 'Noah',
	lastName: 'van Dijk',
	locationName: 'Westland Residence',
	careType: 'Protected living',
	coordinator: 'Sanne Meijer',
	dateOfBirth: '2005-02-18',
	phone: '+31 6 3012 8890',
	email: 'noah.vdijk@example.com',
	maskedBsn: '***.**.482',
	address: 'Bosstraat 17A',
	cityLine: '3072 XL Rotterdam',
	nationality: 'Dutch',
	gender: 'Male',
	nextEvaluationDate: '2026-03-05',
	lastEvaluationDate: '2026-01-11',
	plannedInCareDate: '2026-03-10',
	plannedOutOfCareDate: '2026-05-24',
	registrationStatus: 'Processed',
	intakeAppointmentDate: '2026-02-14T09:30:00Z',
	intakeAppointmentLocation: 'Main Office - Room 3',
	contacts: [
		{
			id: 'contact-1',
			name: 'Marieke van Dijk',
			relation: 'Mother',
			phone: '+31 6 8811 0902',
			email: 'marieke@example.com',
			primary: true,
			permissions: ['Care reports', 'Incidents']
		},
		{
			id: 'contact-2',
			name: 'Joris van Dijk',
			relation: 'Father',
			phone: '+31 6 9988 1730',
			email: 'joris@example.com',
			permissions: ['General updates']
		}
	],
	intakeSummary: {
		conclusion: 'Suitable for supervised living',
		selfReliance: 58,
		participants: ['Client', 'Guardian', 'Care coordinator'],
		evaluationIntervalWeeks: 6,
		notes: 'Prefers smaller group setting with consistent routines.',
		lowestTopics: ['Financial management', 'Daily structure', 'Social resilience']
	},
	contractSummary: {
		status: 'Active',
		startDate: '2025-11-01',
		endDate: '2026-06-30',
		financing: 'WMO - Option B',
		outstandingInvoices: { count: 2, amount: 'EUR 1,140.00' }
	}
};

const quickLinksBase: ClientQuickLink[] = [
	{ label: 'Contracts', count: 1, href: '#' },
	{ label: 'Incidents', count: 2, href: '#' },
	{ label: 'Reports', count: 6, href: '#' },
	{ label: 'Evaluations', count: 4, href: '#' },
	{ label: 'Documents', count: 9, href: '#' },
	{ label: 'Appointments', count: 3, href: '#' }
];

const timelineBase: ClientTimelineItem[] = [
	{
		id: 'event-1',
		type: 'report',
		title: 'Weekly progress report',
		meta: 'By Sanne Meijer',
		date: '2026-02-05',
		link: '#'
	},
	{
		id: 'event-2',
		type: 'incident',
		title: 'Minor verbal escalation',
		meta: 'Severity: medium - unconfirmed',
		date: '2026-02-02',
		link: '#',
		severity: 'medium'
	},
	{
		id: 'event-3',
		type: 'evaluation',
		title: 'Goal evaluation completed',
		meta: 'Self-reliance check',
		date: '2026-01-11',
		link: '#'
	}
];

export const clientOverviewMocks: Record<ClientOverviewStatus, ClientOverviewData> = {
	on_waiting_list: {
		...baseClient,
		status: 'on_waiting_list',
		alerts: [
			{ id: 'a1', label: 'Missing registration documents', count: 2, tone: 'warning' },
			{ id: 'a2', label: 'Unconfirmed incidents', count: 1, tone: 'danger' },
			{ id: 'a3', label: 'Risks present', count: 3, tone: 'brand' }
		],
		goals: [
			{ id: 'g1', title: 'Build weekly structure', priority: 'high' },
			{ id: 'g2', title: 'Reduce impulsive reactions', priority: 'medium' },
			{ id: 'g3', title: 'Independent travel practice', priority: 'low' }
		],
		timeline: timelineBase,
		documentsChecklist: [
			{ id: 'd1', label: 'Registration form', present: true },
			{ id: 'd2', label: 'Intake form', present: false },
			{ id: 'd3', label: 'Consent declaration PDF', present: true },
			{ id: 'd4', label: 'Risk assessment PDF', present: false },
			{ id: 'd5', label: 'Collaboration agreement PDF', present: false }
		],
		quickLinks: quickLinksBase
	},
	scheduled_in_care: {
		...baseClient,
		status: 'scheduled_in_care',
		alerts: [
			{ id: 'a1', label: 'Contract ending soon', count: 1, tone: 'warning' },
			{ id: 'a2', label: 'Coordinator unassigned tasks', count: 2, tone: 'brand' }
		],
		goals: [
			{ id: 'g1', title: 'Daily rhythm start-up', priority: 'high' },
			{ id: 'g2', title: 'Family communication plan', priority: 'medium' },
			{ id: 'g3', title: 'Medication routine', priority: 'medium' }
		],
		timeline: timelineBase,
		documentsChecklist: [
			{ id: 'd1', label: 'Registration form', present: true },
			{ id: 'd2', label: 'Intake form', present: true },
			{ id: 'd3', label: 'Consent declaration PDF', present: true },
			{ id: 'd4', label: 'Risk assessment PDF', present: true },
			{ id: 'd5', label: 'Collaboration agreement PDF', present: true }
		],
		quickLinks: quickLinksBase
	},
	in_care: {
		...baseClient,
		status: 'in_care',
		alerts: [
			{ id: 'a1', label: 'Overdue evaluation', count: 1, tone: 'danger' },
			{ id: 'a2', label: 'Outstanding invoices', count: 2, tone: 'warning' }
		],
		goals: [
			{
				id: 'g1',
				title: 'Keep regular sleep schedule',
				priority: 'high',
				progressNote: '4/7 days stable'
			},
			{
				id: 'g2',
				title: 'Practice conflict de-escalation',
				priority: 'high',
				progressNote: '2 incidents avoided'
			},
			{
				id: 'g3',
				title: 'Weekly job coaching check-in',
				priority: 'medium',
				progressNote: 'On track'
			}
		],
		timeline: timelineBase,
		documentsChecklist: [
			{ id: 'd1', label: 'Registration form', present: true },
			{ id: 'd2', label: 'Intake form', present: true },
			{ id: 'd3', label: 'Consent declaration PDF', present: true },
			{ id: 'd4', label: 'Risk assessment PDF', present: true },
			{ id: 'd5', label: 'Collaboration agreement PDF', present: true },
			{ id: 'd6', label: 'Appointment card', present: true }
		],
		quickLinks: quickLinksBase
	},
	scheduled_out_of_care: {
		...baseClient,
		status: 'scheduled_out_of_care',
		alerts: [
			{ id: 'a1', label: 'Final evaluation missing', count: 1, tone: 'warning' },
			{ id: 'a2', label: 'Recent report required', count: 1, tone: 'brand' }
		],
		goals: [
			{ id: 'g1', title: 'Discharge readiness checklist', priority: 'high' },
			{ id: 'g2', title: 'Transition housing handoff', priority: 'medium' },
			{ id: 'g3', title: 'Family aftercare alignment', priority: 'medium' }
		],
		timeline: timelineBase,
		documentsChecklist: [
			{ id: 'd1', label: 'Registration form', present: true },
			{ id: 'd2', label: 'Intake form', present: true },
			{ id: 'd3', label: 'Consent declaration PDF', present: true },
			{ id: 'd4', label: 'Risk assessment PDF', present: true },
			{ id: 'd5', label: 'Collaboration agreement PDF', present: true }
		],
		quickLinks: quickLinksBase
	},
	out_of_care: {
		...baseClient,
		status: 'out_of_care',
		alerts: [{ id: 'a1', label: 'Closing report pending', count: 1, tone: 'brand' }],
		goals: [
			{ id: 'g1', title: 'Transition complete', priority: 'low' },
			{ id: 'g2', title: 'Follow-up check after 30 days', priority: 'medium' },
			{ id: 'g3', title: 'Archive final care plan', priority: 'low' }
		],
		timeline: timelineBase,
		documentsChecklist: [
			{ id: 'd1', label: 'Registration form', present: true },
			{ id: 'd2', label: 'Intake form', present: true },
			{ id: 'd3', label: 'Consent declaration PDF', present: true },
			{ id: 'd4', label: 'Risk assessment PDF', present: true },
			{ id: 'd5', label: 'Collaboration agreement PDF', present: true }
		],
		quickLinks: quickLinksBase
	}
};

export const clientStatusRouteMap: Record<ClientOverviewStatus, string> = {
	on_waiting_list: 'on-waiting-list',
	scheduled_in_care: 'scheduled-in-care',
	in_care: 'in-care',
	scheduled_out_of_care: 'scheduled-out-of-care',
	out_of_care: 'out-of-care'
};
