import { listLocations } from '$lib/api/locations';
import type { OrganizationLocation } from '$lib/types/api';
import type { PageLoad } from './$types';

export interface SchedulesPageLoadResult {
	locations: OrganizationLocation[];
	baseDate: string;
	locationsLoadError: string | null;
}

function formatDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

async function fetchAllLocations(): Promise<OrganizationLocation[]> {
	const pageSize = 100;
	let page = 1;
	let hasNext = true;
	const locations: OrganizationLocation[] = [];

	while (hasNext) {
		const response = await listLocations({ page, pageSize });
		locations.push(...response.data.results);
		hasNext = Boolean(response.data.next);
		page += 1;
	}

	return locations;
}

export const load: PageLoad = async (): Promise<SchedulesPageLoadResult> => {
	const baseDate = formatDateKey(new Date());

	try {
		const locations = await fetchAllLocations();

		return {
			locations,
			baseDate,
			locationsLoadError: null
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Failed to load locations for schedules.';

		return {
			locations: [],
			baseDate,
			locationsLoadError: message
		};
	}
};
