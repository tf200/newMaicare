import type { GetClientResponse } from '$lib/types/api';

export type ClientOverviewStatus = GetClientResponse['status'];

export interface ClientOverviewContact {
	id: string;
	name: string;
	relation: string;
	phone?: string;
	email?: string;
	primary?: boolean;
}

export interface ClientOverviewGoal {
	id: string;
	title: string;
	priority: 'high' | 'medium' | 'low';
	progressNote?: string;
}

export interface ClientTimelineItem {
	id: string;
	type: 'report' | 'incident' | 'evaluation' | 'document';
	title: string;
	meta: string;
	date?: string;
}

export type ClientOverviewTarget =
	'overview' | 'contracts' | 'incidents' | 'reports' | 'goals' | 'documents' | 'appointments';

export interface ClientQuickLink {
	target: ClientOverviewTarget;
	count: number;
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
	age: number | null;
	senderName?: string;
	phone?: string;
	email?: string;
	maskedBsn: string;
	bsnVerifiedByName?: string;
	address: string;
	cityLine: string;
	gender?: string;
	nextEvaluationDate?: string;
	lastEvaluationDate?: string;
	plannedInCareDate?: string;
	plannedOutOfCareDate?: string;
	alerts: Array<{ id: string; label: string; count: number; tone: 'brand' | 'warning' | 'danger' }>;
	goals: ClientOverviewGoal[];
	timeline: ClientTimelineItem[];
	contacts: ClientOverviewContact[];
	intakeSummary?: {
		conclusion: string;
		selfReliance: number;
		lowestTopics: string[];
	};
	documentsChecklist: Array<{ id: string; label: string; present: boolean }>;
	contractSummary?: {
		active: boolean;
		status: string;
		startDate?: string;
		endDate?: string;
		daysUntilContractEnd?: number;
		financing?: string;
	};
	education?: {
		currentlyEnrolled: boolean;
		institution: string | null;
		mentorName: string | null;
		mentorPhone: string | null;
		mentorEmail: string | null;
		additionalNotes: string | null;
		level: string;
	};
	work?: {
		currentlyEmployed: boolean;
		currentEmployer: string | null;
		employerPhone: string | null;
		employerEmail: string | null;
		currentPosition: string | null;
		startDate: string | null;
		additionalNotes: string | null;
	};
	quickLinks: ClientQuickLink[];
}

export interface ClientOverviewViewModel {
	client: ClientOverviewData;
	clientDetail: GetClientResponse;
	status: ClientOverviewStatus;
}

export interface OverviewLoadResult {
	overview: ClientOverviewViewModel | null;
	loadError: string | null;
}

export const createOverviewViewModel = (
	client: ClientOverviewData,
	clientDetail: GetClientResponse,
	status: ClientOverviewStatus
): ClientOverviewViewModel => ({
	client,
	clientDetail,
	status
});
