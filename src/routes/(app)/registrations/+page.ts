import type { PageLoad } from './$types';
import { getRegistrationCounts, listRegistrationForms } from '$lib/api/registration';
import type { ListRegistrationFormsResponse } from '$lib/types/api';
import type { FormStatus } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';
import type { RegistrationFilters } from '$lib/types/registrations';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { resolve } from '$app/paths';

export interface RegistrationRow {
	id: string;
	clientFirstName: string;
	clientLastName: string;
	clientBsnNumber: string;
	referrerFirstName: string;
	referrerLastName: string;
	careProtectedLiving: boolean | null;
	careAssistedIndependentLiving: boolean | null;
	careRoomTrainingCenter: boolean | null;
	careAmbulatoryGuidance: boolean | null;
	riskCount: number;
	formStatus: FormStatus;
	intakeFormId?: string | null;
	submittedAt: string;
}

export interface RegistrationsLoadResult {
	registrations: RegistrationRow[];
	pagination: PaginationState<RegistrationFilters>;
	loadError: string | null;
}

export interface RegistrationCountsLoadResult {
	counts: {
		total: number;
		pendingReview: number;
		processed: number;
		highRisk: number;
	};
	loadError: string | null;
}

const mapRegistration = (item: ListRegistrationFormsResponse): RegistrationRow => ({
	id: item.id,
	clientFirstName: item.client_first_name,
	clientLastName: item.client_last_name,
	clientBsnNumber: item.client_bsn_number,
	referrerFirstName: item.referrer_first_name,
	referrerLastName: item.referrer_last_name,
	careProtectedLiving: item.care_protected_living,
	careAssistedIndependentLiving: item.care_assisted_independent_living,
	careRoomTrainingCenter: item.care_room_training_center,
	careAmbulatoryGuidance: item.care_ambulatory_guidance,
	riskCount: item.risk_count,
	formStatus: item.form_status,
	intakeFormId: item.intake_form_id,
	submittedAt: item.submitted_at
});

const parseBoolean = (value: string | null) => {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return undefined;
};

export const load: PageLoad = ({ url, fetch, depends }) => {
	const auth = getAuthState();
	if (
		!auth.hasAnyPermission([PERMISSIONS.REGISTRATION_FORM.VIEW, PERMISSIONS.CARE_COORDINATION.VIEW])
	) {
		error(403, 'You do not have permission to view registrations.');
	}

	depends('app:registrations:list');
	depends('app:registrations:stats');

	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const status = (url.searchParams.get('status') ?? '') as RegistrationFilters['status'];
	const search = url.searchParams.get('search') ?? '';

	const filters: RegistrationFilters = {
		status,
		search: search.trim() || undefined,
		riskAggressiveBehavior: parseBoolean(url.searchParams.get('risk_aggressive_behavior')),
		riskSuicidalSelfharm: parseBoolean(url.searchParams.get('risk_suicidal_selfharm')),
		riskSubstanceAbuse: parseBoolean(url.searchParams.get('risk_substance_abuse')),
		riskPsychiatricIssues: parseBoolean(url.searchParams.get('risk_psychiatric_issues')),
		riskCriminalHistory: parseBoolean(url.searchParams.get('risk_criminal_history')),
		riskFlightBehavior: parseBoolean(url.searchParams.get('risk_flight_behavior')),
		riskWeaponPossession: parseBoolean(url.searchParams.get('risk_weapon_possession')),
		riskSexualBehavior: parseBoolean(url.searchParams.get('risk_sexual_behavior')),
		riskDayNightRhythm: parseBoolean(url.searchParams.get('risk_day_night_rhythm'))
	};

	const registrationsData: Promise<RegistrationsLoadResult> = listRegistrationForms(
		{
			page,
			pageSize,
			status: status === '' ? undefined : status,
			search: filters.search,
			riskAggressiveBehavior: filters.riskAggressiveBehavior,
			riskSuicidalSelfharm: filters.riskSuicidalSelfharm,
			riskSubstanceAbuse: filters.riskSubstanceAbuse,
			riskPsychiatricIssues: filters.riskPsychiatricIssues,
			riskCriminalHistory: filters.riskCriminalHistory,
			riskFlightBehavior: filters.riskFlightBehavior,
			riskWeaponPossession: filters.riskWeaponPossession,
			riskSexualBehavior: filters.riskSexualBehavior,
			riskDayNightRhythm: filters.riskDayNightRhythm
		},
		{ fetchFn: fetch }
	)
		.then((response) => {
			const { count, page_size, results, next, previous } = response.data;

			return {
				registrations: results.map(mapRegistration),
				pagination: {
					count,
					page,
					pageSize: page_size || pageSize,
					next,
					previous,
					filters
				} satisfies PaginationState<RegistrationFilters>,
				loadError: null
			} satisfies RegistrationsLoadResult;
		})
		.catch((error): RegistrationsLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load registrations.';
			return {
				registrations: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters
				} satisfies PaginationState<RegistrationFilters>,
				loadError: message
			};
		});

	const registrationsCountsData: Promise<RegistrationCountsLoadResult> = getRegistrationCounts({
		fetchFn: fetch
	})
		.then((response) => ({
			counts: {
				total: response.data.total,
				pendingReview: response.data.pending_review,
				processed: response.data.processed,
				highRisk: response.data.high_risk
			},
			loadError: null
		}))
		.catch((error): RegistrationCountsLoadResult => ({
			counts: {
				total: 0,
				pendingReview: 0,
				processed: 0,
				highRisk: 0
			},
			loadError: error instanceof Error ? error.message : 'Failed to load registration counts.'
		}));

	return {
		initial: {
			page,
			pageSize,
			filters
		},
		registrationsData,
		registrationsCountsData
	};
};
