import type { PageLoad } from './$types';
import { listOrganizations } from '$lib/api/organizations';
import type { OrganizationListItem } from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';

interface OrganizationRow {
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

export const load: PageLoad = async ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const name = url.searchParams.get('name') ?? '';

	const response = await listOrganizations({
		page,
		pageSize,
		name: name.trim() || undefined
	});

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
		} satisfies PaginationState<{ name: string }>
	};
};
