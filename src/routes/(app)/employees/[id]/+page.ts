import type { PageLoad } from './$types';
import { getEmployee, type EmployeeDetail } from '$lib/api/employees';

export interface EmployeeDetailLoadResult {
	employee: EmployeeDetail | null;
	loadError: string | null;
}

export const load: PageLoad = ({ params }) => {
	const employeeData: Promise<EmployeeDetailLoadResult> = getEmployee(params.id)
		.then((response) => ({
			employee: response.data,
			loadError: null
		}))
		.catch((error): EmployeeDetailLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load employee.';

			return {
				employee: null,
				loadError: message
			};
		});

	return {
		employeeData
	};
};
