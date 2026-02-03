import { getRegistrationForm } from '$lib/api/registration';
import { listSenders } from '$lib/api/senders';
import { listOrganizations } from '$lib/api/organizations';
import type { PageLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ url }) => {
	const registrationId = url.searchParams.get('registration_id');

	if (!registrationId) {
		throw redirect(302, '/registrations');
	}

	try {
		const [registrationReq, sendersReq, organizationsReq] = await Promise.all([
			getRegistrationForm(registrationId),
			listSenders({ page: 1, pageSize: 100 }),
			listOrganizations({ page: 1, pageSize: 100 })
		]);

		return {
			registration: registrationReq.data,
			senders: sendersReq.data?.results || [],
			organizations: organizationsReq.data?.results || []
		};
	} catch (err) {
		console.error('Failed to load intake dependencies:', err);
		throw error(500, 'Failed to load intake dependencies');
	}
};
