import { intakes } from '$lib/api/intakes';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	try {
		const res = await intakes.getById(params.id);
		return {
			intake: res.data
		};
	} catch (e) {
		console.error('Failed to load intake:', e);
		throw error(404, 'Intake not found');
	}
};
