import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateIntakeRequest,
	IntakeFormResponse,
	GenerateGoalsResponse
} from '$lib/types/api';

export const intakes = {
	create: (data: CreateIntakeRequest) => {
		return api.post<ApiEnvelope<IntakeFormResponse>>('/intake_forms', data);
	},

	generateGoals: (assessmentId: string) => {
		return api.post<ApiEnvelope<GenerateGoalsResponse>>(
			`/intake_maturity/${assessmentId}/generate_goals`,
			{}
		);
	}
};
