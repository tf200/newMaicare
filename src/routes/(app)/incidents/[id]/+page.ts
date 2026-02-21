import { getIncident } from '$lib/api/incidents';
import type { IncidentDetailResponse } from '$lib/types/api';
import type { IncidentDetail } from '$lib/types/incidents';
import type { PageLoad } from './$types';

export interface IncidentDetailLoadResult {
	incident: IncidentDetail | null;
	loadError: string | null;
}

const mapIncidentDetail = (payload: IncidentDetailResponse): IncidentDetail => ({
	id: payload.id,
	clientId: payload.client_id,
	incidentType: payload.incident_type,
	severity: payload.severity_of_incident,
	isConfirmed: payload.is_confirmed,
	occurredAt: payload.occurred_at,
	employeeId: payload.employee_id,
	employeeFirstName: payload.employee_first_name,
	employeeLastName: payload.employee_last_name,
	locationId: payload.location_id,
	locationName: payload.location_name,
	clientFirstName: payload.client_first_name ?? 'Unknown',
	clientLastName: payload.client_last_name ?? 'Client',
	clientBsnNumber: payload.client_bsn ?? undefined,
	reporterInvolvement: payload.reporter_involvement,
	informedParties: payload.informed_parties,
	incidentExplanation: payload.incident_explanation,
	recurrenceRisk: payload.recurrence_risk,
	incidentPreventSteps: payload.incident_prevent_steps,
	incidentTakenMeasures: payload.incident_taken_measures,
	causeCategories: payload.cause_categories,
	causeExplanation: payload.cause_explanation,
	physicalInjury: payload.physical_injury,
	physicalInjuryDesc: payload.physical_injury_desc,
	psychologicalDamage: payload.psychological_damage,
	psychologicalDamageDesc: payload.psychological_damage_desc,
	neededConsultation: payload.needed_consultation,
	followUpActions: payload.follow_up_actions,
	followUpNotes: payload.follow_up_notes,
	isEmployeeAbsent: payload.is_employee_absent,
	additionalDetails: payload.additional_details,
	updatedAt: payload.updated_at,
	createdAt: payload.created_at,
	emails: payload.emails
});

export const load: PageLoad = ({ params }) => {
	const incidentId = params.id;

	const incidentData: Promise<IncidentDetailLoadResult> = getIncident(incidentId)
		.then((response) => ({
			incident: mapIncidentDetail(response.data),
			loadError: null
		}))
		.catch(
			(error): IncidentDetailLoadResult => ({
				incident: null,
				loadError: error instanceof Error ? error.message : 'Failed to load incident details.'
			})
		);

	return {
		incidentData
	};
};
