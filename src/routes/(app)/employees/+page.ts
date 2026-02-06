import type { PageLoad } from './$types';
import {
	listEmployees,
	type EmployeeContractType,
	type EmployeeListItem
} from '$lib/api/employees';
import type { PaginationState } from '$lib/types/ui';

export interface EmployeeFilters {
	search: string;
	contractType: '' | EmployeeContractType;
	isArchived?: boolean;
	outOfService?: boolean;
}

export interface EmployeeRow {
	id: string;
	name: string;
	bsn: string;
	department: string;
	location: string;
	contractType: 'Loondienst' | 'ZZP' | 'None';
	contractEndDate: string;
}

const parseBoolean = (value: string | null) => {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return undefined;
};

const parseContractType = (value: string | null): EmployeeFilters['contractType'] => {
	if (value === 'loondienst' || value === 'ZZP' || value === 'none') return value;
	return '';
};

const normalizeContractType = (value: string): EmployeeRow['contractType'] => {
	if (value === 'ZZP') return 'ZZP';
	if (value.toLowerCase() === 'loondienst') return 'Loondienst';
	return 'None';
};

const mapEmployee = (employee: EmployeeListItem): EmployeeRow => {
	const firstName = employee.first_name?.trim() ?? '';
	const lastName = employee.last_name?.trim() ?? '';
	const name = `${firstName} ${lastName}`.trim() || 'Unknown employee';
	const bsn = String(employee.bsn ?? '');
	const contractEndDate = employee.contract_end_date ? new Date(employee.contract_end_date) : null;

	return {
		id: employee.id,
		name,
		bsn,
		department: employee.department?.trim() || '—',
		location: employee.location_address?.trim() || '—',
		contractType: normalizeContractType(employee.contract_type),
		contractEndDate: contractEndDate
			? contractEndDate.toLocaleDateString('nl-NL', {
					day: '2-digit',
					month: 'short',
					year: 'numeric'
				})
			: '—'
	};
};

export const load: PageLoad = async ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '10') || 10;
	const search = url.searchParams.get('search') ?? '';

	const filters: EmployeeFilters = {
		search,
		contractType: parseContractType(url.searchParams.get('contract_type')),
		isArchived: parseBoolean(url.searchParams.get('is_archived')),
		outOfService: parseBoolean(url.searchParams.get('out_of_service'))
	};

	try {
		const response = await listEmployees({
			page,
			pageSize,
			search: filters.search.trim() || undefined,
			contractType: filters.contractType || undefined,
			isArchived: filters.isArchived,
			outOfService: filters.outOfService
		});

		const { count, page_size, results, next, previous } = response.data;

		return {
			employees: results.map(mapEmployee),
			pagination: {
				count,
				page,
				pageSize: page_size || pageSize,
				next,
				previous,
				filters
			} satisfies PaginationState<EmployeeFilters>,
			loadError: null
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load employees.';

		return {
			employees: [],
			pagination: {
				count: 0,
				page,
				pageSize,
				next: null,
				previous: null,
				filters
			} satisfies PaginationState<EmployeeFilters>,
			loadError: message
		};
	}
};
