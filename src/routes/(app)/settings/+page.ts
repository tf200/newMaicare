import type { PageLoad } from './$types';
import { getEmployeeProfileDetails } from '$lib/api/employees';
import type { EmployeeProfileDetailsResponse } from '$lib/types/api';

export interface SettingsProfileLoadResult {
	profile: EmployeeProfileDetailsResponse | null;
	loadError: string | null;
}

export interface SettingsProfilePageData {
	initial: SettingsProfileLoadResult;
	profileData: Promise<SettingsProfileLoadResult>;
}

export const createInitialSettingsProfile = (): SettingsProfileLoadResult => ({
	profile: null,
	loadError: null
});

export const load: PageLoad = () => {
	const profileData: Promise<SettingsProfileLoadResult> = getEmployeeProfileDetails()
		.then((response) => ({
			profile: response.data,
			loadError: null
		}))
		.catch(
			(error): SettingsProfileLoadResult => ({
				profile: null,
				loadError: error instanceof Error ? error.message : 'Failed to load profile details.'
			})
		);

	return {
		initial: createInitialSettingsProfile(),
		profileData
	} satisfies SettingsProfilePageData;
};
