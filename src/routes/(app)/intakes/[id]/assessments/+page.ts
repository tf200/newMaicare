import { intakes } from '$lib/api/intakes';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	const intakeId = params.id;

	try {
		// Initialize assessments (ensure topics exist)
		await intakes.initializeAssessments(intakeId);

		// Fetch intake details and assessments in parallel
		const [intakeReq, assessmentsReq] = await Promise.all([
			intakes.get(intakeId),
			intakes.getAssessments(intakeId)
		]);

		return {
			intake: intakeReq.data,
			assessments: assessmentsReq.data?.data || []
		};
	} catch (e) {
		console.error('Failed to load assessment workspace:', e);
		throw error(500, 'Failed to load assessment workspace');
	}
};
