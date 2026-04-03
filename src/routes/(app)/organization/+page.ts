import type { PageLoad } from './$types';
import { getGlobalOrganizationCounts, listOrganizations } from '$lib/api/organizations';
import type { OrganizationListItem } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';

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

export interface OrganizationCountsLoadResult {
	counts: {
		totalLocations: number;
		totalEmployees: number;
	};
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

export const load: PageLoad = ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const name = url.searchParams.get('name') ?? '';

	const organizationsData: Promise<OrganizationLoadResult> = listOrganizations({
		page,
		pageSize,
		name: name.trim() || undefined
	})
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
		.catch((error): OrganizationLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load organizations.';
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
				loadError: message
			};
		});

	const countsData: Promise<OrganizationCountsLoadResult> = getGlobalOrganizationCounts()
		.then((response) => ({
			counts: {
				totalLocations: response.data.total_locations,
				totalEmployees: response.data.total_employees
			},
			loadError: null
		}))
		.catch(
			(error): OrganizationCountsLoadResult => ({
				counts: {
					totalLocations: 0,
					totalEmployees: 0
				},
				loadError:
					error instanceof Error ? error.message : 'Failed to load global organization counts.'
			})
		);

	return {
		initial: {
			page,
			pageSize,
			filters: {
				name
			}
		},
		organizationsData,
		countsData
	};
};
