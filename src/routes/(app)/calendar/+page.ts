import { error } from '@sveltejs/kit';
import { PERMISSIONS } from '$lib/config/permissions';
import { getAuthState } from '$lib/state/auth.svelte';
import { getEmployee } from '$lib/api/employees';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.APPOINTMENT.VIEW)) {
		error(403, 'You do not have permission to view this resource.');
	}

	const employeeId = url.searchParams.get('employee')?.trim() ?? '';
	const employeeLabel = employeeId
		? getEmployee(employeeId)
				.then(({ data }) => `${data.first_name} ${data.last_name}`.trim())
				.catch(() => '')
		: Promise.resolve('');

	return {
		initial: {
			employeeId
		},
		employeeLabel
	};
};
