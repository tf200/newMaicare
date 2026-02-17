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
		.then((response) => ({
			appointmentCard: {
				id: response.data.id,
				client_id: response.data.client_id,
				general_information: response.data.general_information,
				important_contacts: response.data.important_contacts,
				household_info: response.data.household_info,
				organization_agreements: response.data.organization_agreements,
				youth_officer_agreements: response.data.youth_officer_agreements,
				treatment_agreements: response.data.treatment_agreements,
				smoking_rules: response.data.smoking_rules,
				work: response.data.work,
				school_internship: response.data.school_internship,
				travel: response.data.travel,
				leave: response.data.leave,
				created_at: response.data.created_at,
				updated_at: response.data.updated_at
			},
			loadError: null
		}))
		.catch((error) => ({
			appointmentCard: buildEmptyCard(params.id),
			loadError: error instanceof Error ? error.message : 'Failed to load appointment card.'
		}));

	return {
		appointmentCardData
	};
};
