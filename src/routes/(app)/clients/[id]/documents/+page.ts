import { getClientAppointmentCard } from '$lib/api/clients';
import type { AppointmentCardSections } from '$lib/types/api';
import type { PageLoad } from './$types';

export interface AppointmentCardDocument {
	id: string | null;
	client_id: string;
	general_information: string[];
	important_contacts: string[];
	household_info: string[];
	organization_agreements: string[];
	youth_officer_agreements: string[];
	treatment_agreements: string[];
	smoking_rules: string[];
	work: string[];
	school_internship: string[];
	travel: string[];
	leave: string[];
	created_at: string | null;
	updated_at: string | null;
}

export interface AppointmentCardLoadResult {
	appointmentCard: AppointmentCardDocument;
	loadError: string | null;
}

const emptySections = (): AppointmentCardSections => ({
	general_information: [],
	important_contacts: [],
	household_info: [],
	organization_agreements: [],
	youth_officer_agreements: [],
	treatment_agreements: [],
	smoking_rules: [],
	work: [],
	school_internship: [],
	travel: [],
	leave: []
});

const buildEmptyCard = (clientId: string): AppointmentCardDocument => ({
	id: null,
	client_id: clientId,
	...emptySections(),
	created_at: null,
	updated_at: null
});

export const load: PageLoad = ({ params }) => {
	const appointmentCardData: Promise<AppointmentCardLoadResult> = getClientAppointmentCard(
		params.id
	)
		.then((response) => {
			if (!response.data) {
				return { appointmentCard: buildEmptyCard(params.id), loadError: null };
			}

			return {
				appointmentCard: response.data,
				loadError: null
			};
		})
		.catch((error) => ({
			appointmentCard: buildEmptyCard(params.id),
			loadError: error instanceof Error ? error.message : 'Failed to load appointment card.'
		}));

	return {
		appointmentCardData
	};
};
