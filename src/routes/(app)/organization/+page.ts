import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listOrganizations } from '$lib/api/organizations';
import type { OrganizationListItem } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';
import { PERMISSIONS } from '$lib/config/permissions';
import { getAuthState } from '$lib/state/auth.svelte';
import { m } from '$lib/paraglide/messages';

export interface OrganizationRow {
	id: string;
	name: string;
	street: string;
	houseNumber: string;
	houseNumberAddition: string | null;
	postalCode: string;
	city: string;
	email: string | null;
	kvkNumber: string | null;
	btwNumber: string | null;
	locationCount: number;
}

export interface OrganizationLoadResult {
	organisations: OrganizationRow[];
	pagination: PaginationState<{ name: string }>;
	loadError: string | null;
}

const mapOrganization = (org: OrganizationListItem): OrganizationRow => ({
	id: org.id,
	name: org.name,
	street: org.street,
	houseNumber: org.house_number,
	houseNumberAddition: org.house_number_addition,
	postalCode: org.postal_code,
	city: org.city,
	email: org.email,
	kvkNumber: org.kvk_number,
	btwNumber: org.btw_number,
	locationCount: org.location_count
});

const parsePositiveInteger = (value: string | null, fallback: number, maximum: number) => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
};

export const load: PageLoad = ({ url, fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.ORGANISATION.VIEW)) {
		error(403, 'You do not have permission to view this resource.');
	}

	depends('app:organization:list');

	const page = parsePositiveInteger(url.searchParams.get('page'), 1, 10_000);
	const pageSize = parsePositiveInteger(url.searchParams.get('page_size'), 8, 100);
	const name = url.searchParams.get('name') ?? '';

	const organizationsData: Promise<OrganizationLoadResult> = listOrganizations(
		{
			page,
			pageSize,
			name: name.trim() || undefined
		},
		{ fetchFn: fetch }
	)
		.then((response) => {
			const { count, page_size, results, next, previous } = response.data;

			return {
				organisations: results.map(mapOrganization),
				pagination: {
					count,
					page,
					pageSize: page_size || pageSize,
					next,
					previous,
					filters: {
						name
					}
				} satisfies PaginationState<{ name: string }>,
				loadError: null
			} satisfies OrganizationLoadResult;
		})
		.catch((): OrganizationLoadResult => {
			return {
				organisations: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters: {
						name
					}
				} satisfies PaginationState<{ name: string }>,
				loadError: m.failed_load_organizations()
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters: {
				name
			}
		},
		organizationsData
	};
};
