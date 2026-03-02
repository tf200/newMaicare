import { listInCareClients } from '$lib/api/clients';
import { listEmployees } from '$lib/api/employees';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const clientsPromise = listInCareClients({ page: 1, pageSize: 100 }).then(
		(res) => res.data.results
	);
	const employeesPromise = listEmployees({ page: 1, pageSize: 100 }).then(
		(res) => res.data.results
	);

	return {
		clientsPromise,
		employeesPromise
	};
};
