import type { PageLoad } from './$types';
import {
	listEmployees,
	type EmployeeContractType,
	type EmployeeListItem
} from '$lib/api/employees';
import type { PaginationState } from '$lib/types/ui';
import { m } from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { maskBsn } from '$lib/utils/privacy';

export interface EmployeeFilters {
	search: string;
	contractType: '' | EmployeeContractType;
	isArchived?: boolean;
	outOfService?: boolean;
}

export interface EmployeeRow {
	id: string;
	name: string;
	maskedBsn: string;
	department: string;
	location: string;
	contractType: 'Loondienst' | 'ZZP' | 'None';
	contractEndDate: string;
}

export interface EmployeesLoadResult {
	employees: EmployeeRow[];
	pagination: PaginationState<EmployeeFilters>;
	loadError: string | null;
}

const parseBoolean = (value: string | null) => {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return undefined;
};

const parsePositiveInteger = (value: string | null, fallback: number, maximum: number) => {
	if (!value || !/^\d+$/.test(value)) return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
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
	const name = `${firstName} ${lastName}`.trim() || m.unknown_employee();
	const contractEndDate = employee.contract_end_date ? new Date(employee.contract_end_date) : null;
	const locale = getLocale() === 'nl' ? 'nl-NL' : 'en-GB';

	return {
		id: employee.id,
		name,
		maskedBsn: maskBsn(employee.bsn),
		department: employee.department_name?.trim() || employee.department?.trim() || '—',
		location: employee.location_address?.trim() || '—',
		contractType: normalizeContractType(employee.contract_type),
		contractEndDate:
			contractEndDate && !Number.isNaN(contractEndDate.getTime())
				? contractEndDate.toLocaleDateString(locale, {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
					})
				: '—'
	};
};

export const load: PageLoad = ({ url, fetch, depends }) => {
	depends('app:employees:list');

	const page = parsePositiveInteger(url.searchParams.get('page'), 1, 100_000);
	const pageSize = parsePositiveInteger(url.searchParams.get('page_size'), 10, 100);
	const search = url.searchParams.get('search') ?? '';

	const filters: EmployeeFilters = {
		search,
		contractType: parseContractType(url.searchParams.get('contract_type')),
		isArchived: parseBoolean(url.searchParams.get('is_archived')),
		outOfService: parseBoolean(url.searchParams.get('out_of_service'))
	};

	const employeesData: Promise<EmployeesLoadResult> = listEmployees(
		{
			page,
			pageSize,
			search: filters.search.trim() || undefined,
			contractType: filters.contractType || undefined,
			isArchived: filters.isArchived,
			outOfService: filters.outOfService
		},
		{ fetchFn: fetch }
	)
		.then((response) => {
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
			} satisfies EmployeesLoadResult;
		})
		.catch((): EmployeesLoadResult => {
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
				loadError: m.failed_load_employees()
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters
		},
		employeesData
	};
};
