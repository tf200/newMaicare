import type { PageLoad } from './$types';
import { getIntakeFormsTotals, listIntakeForms } from '$lib/api/intakes';
import { m } from '$lib/paraglide/messages';
import type {
	AssignedLocationAddress,
	IntakeConclusionEnum,
	ListIntakeFormsResponse
} from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';
import { error } from '@sveltejs/kit';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';

export interface IntakeRow {
	id: string;
	clientFirstName: string;
	clientLastName: string;
	clientBsnNumber: string;
	intakeDate?: string | null;
	intakeStatus: IntakeConclusionEnum;
	goalAssessmentStatus: 'done' | 'pending';
	hasClient: boolean;
	careProtectedLiving: boolean;
	careAssistedIndependentLiving: boolean;
	careRoomTrainingCenter: boolean;
	careAmbulatoryGuidance: boolean;
	assignedLocationCity: string;
	assignedLocationAddress: string;
}

export interface IntakeFilters {
	search: string;
	status: '' | IntakeConclusionEnum;
}

export interface IntakesLoadResult {
	intakes: IntakeRow[];
	pagination: PaginationState<IntakeFilters>;
	loadError: string | null;
}

export interface IntakesStatsLoadResult {
	stats: {
		furtherInvestigation: number;
		withoutGoals: number;
	};
	loadError: string | null;
}

const formatLocationParts = (address?: AssignedLocationAddress | null) => {
	if (!address) return { city: '—', address: '—' };

	const name = address.name?.trim();
	const street = [address.street, address.house_number, address.house_number_addition]
		.filter(Boolean)
		.join(' ');
	const city = [address.postal_code, address.city].filter(Boolean).join(' ');
	const addressLine = [name, street].filter(Boolean).join(', ');

	return {
		city: city || '—',
		address: addressLine || '—'
	};
};

const mapIntake = (item: ListIntakeFormsResponse): IntakeRow => {
	const locationParts = formatLocationParts(item.assigned_location_address);

	return {
		id: item.id,
		clientFirstName: item.client_first_name,
		clientLastName: item.client_last_name,
		clientBsnNumber: item.client_bsn_number,
		intakeDate: item.date_of_intake ?? null,
		intakeStatus: item.intake_status,
		goalAssessmentStatus: item.goal_assessment_done ? 'done' : 'pending',
		hasClient: item.has_client,
		careProtectedLiving: item.care_type === 'protected_living',
		careAssistedIndependentLiving: item.care_type === 'supported_independent_living',
		careRoomTrainingCenter: item.care_type === 'training_center',
		careAmbulatoryGuidance: item.care_type === 'ambulatory_support',
		assignedLocationCity: locationParts.city,
		assignedLocationAddress: locationParts.address
	};
};

export const load: PageLoad = ({ depends, fetch, url }) => {
	const auth = getAuthState();
	if (
		!auth.hasAnyPermission([PERMISSIONS.INTAKE_FORM.VIEW, PERMISSIONS.CARE_COORDINATION.VIEW])
	) {
		error(403, 'You do not have permission to view intakes.');
	}

	depends('app:intakes:list');
	depends('app:intakes:stats');

	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const search = url.searchParams.get('search') ?? '';
	const normalizedSearch = search.trim();
	const status = (url.searchParams.get('status') ?? '') as IntakeFilters['status'];

	const statsData: Promise<IntakesStatsLoadResult> = getIntakeFormsTotals({ fetchFn: fetch })
		.then((response) => ({
			stats: {
				furtherInvestigation: response.data.further_investigation_total,
				withoutGoals: response.data.without_goals_total
			},
			loadError: null
		}))
		.catch((error): IntakesStatsLoadResult => ({
			stats: {
				furtherInvestigation: 0,
				withoutGoals: 0
			},
			loadError: error instanceof Error ? error.message : m.failed_load_intake_statistics()
		}));

	const intakesData: Promise<IntakesLoadResult> = listIntakeForms(
		{
			page,
			pageSize,
			search: normalizedSearch || undefined,
			status: status === '' ? undefined : status
		},
		{ fetchFn: fetch }
	)
		.then((response) => {
			const { count, page_size, results, next, previous } = response.data;
			const mapped = results.map(mapIntake);

			return {
				intakes: mapped,
				pagination: {
					count,
					page,
					pageSize: page_size || pageSize,
					next,
					previous,
					filters: {
						search: normalizedSearch,
						status
					}
				} satisfies PaginationState<IntakeFilters>,
				loadError: null
			} satisfies IntakesLoadResult;
		})
		.catch((error): IntakesLoadResult => {
			const message = error instanceof Error ? error.message : m.failed_load_intakes();
			return {
				intakes: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters: {
						search: normalizedSearch,
						status
					}
				} satisfies PaginationState<IntakeFilters>,
				loadError: message
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters: {
				search: normalizedSearch,
				status
			}
		},
		intakesData,
		statsData
	};
};
