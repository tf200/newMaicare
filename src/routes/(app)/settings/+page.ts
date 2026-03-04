import type { PageLoad } from './$types';
import { getEmployeeProfileDetails } from '$lib/api/employees';
import type { EmployeeProfileDetailsResponse } from '$lib/types/api';

export interface SettingsProfileLoadResult {
	profile: EmployeeProfileDetailsResponse | null;
	loadError: string | null;
}

export const load: PageLoad = async () => {
	try {
		const response = await getEmployeeProfileDetails();

		return {
			profile: response.data,
			loadError: null
		} satisfies SettingsProfileLoadResult;
	} catch (error) {
		return {
			profile: null,
			loadError: error instanceof Error ? error.message : 'Failed to load profile details.'
		} satisfies SettingsProfileLoadResult;
	}
};
