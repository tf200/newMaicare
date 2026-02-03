import { getRegistrationForm } from '$lib/api/registration';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const response = await getRegistrationForm(params.id);
	return {
		registration: response.data
	};
};
