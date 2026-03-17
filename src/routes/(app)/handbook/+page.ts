import { ApiClientError } from '$lib/api/client';
import { getMyActiveHandbook } from '$lib/api/handbooks';
import type { GetMyActiveHandbookResponse } from '$lib/types/api';
import type { Handbook } from '$lib/types/handbook';
import type { PageLoad } from './$types';

const mapHandbook = (payload: GetMyActiveHandbookResponse): Handbook => ({
	handbook_id: payload.handbook_id,
	status: payload.status,
	assigned_at: payload.assigned_at,
	started_at: payload.started_at,
	completed_at: payload.completed_at,
	due_at: payload.due_at,
	template_id: payload.template_id,
	template_title: payload.template_title,
	template_description: payload.template_description,
	template_version: String(payload.template_version),
	department_id: payload.department_id,
	department_name: payload.department_name,
	steps: [...payload.steps]
		.sort((a, b) => a.sort_order - b.sort_order)
		.map((step) => ({
			step_id: step.step_id,
			sort_order: step.sort_order,
			kind: step.kind,
			title: step.title,
			body: step.body,
			content: step.content,
			is_required: step.is_required,
			status: step.status,
			started_at: step.started_at,
			completed_at: step.completed_at,
			response: step.response
		}))
});

export const load: PageLoad = async ({ fetch }) => {
	try {
		const response = await getMyActiveHandbook({ fetchFn: fetch });

		return {
			handbook: mapHandbook(response.data),
			loadError: null
		};
	} catch (error) {
		if (error instanceof ApiClientError && error.status === 404) {
			return {
				handbook: null,
				loadError: null
			};
		}

		return {
			handbook: null,
			loadError:
				error instanceof Error ? error.message : 'Failed to load your active handbook assignment.'
		};
	}
};
