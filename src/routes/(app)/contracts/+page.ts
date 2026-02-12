import type { PageLoad } from './$types';
import { listContracts } from '$lib/api/contracts';
import type {
	ContractCareType,
	ContractFinancingAct,
	ContractFinancingOption,
	ContractStatus
} from '$lib/types/api';
import type { PaginationState } from '$lib/types/ui';

export interface ContractsFilters {
	search: string;
	clientName: string;
	senderName: string;
	status: ContractStatus[];
	careType: ContractCareType[];
	financingAct: ContractFinancingAct[];
	financingOption: ContractFinancingOption[];
	endDateFrom: string;
	endDateTo: string;
}

export interface ContractsRow {
	id: string;
	clientId: string;
	clientFirstName: string;
	clientLastName: string;
	clientFileNumber: string;
	senderId: string;
	senderName: string;
	careName: string;
	careType: ContractCareType;
	price: number;
	priceTimeUnit: 'minute' | 'hourly' | 'daily' | 'weekly';
	hours: number | null;
	hoursType: 'weekly' | 'all_period' | null;
	financingAct: ContractFinancingAct;
	financingOption: ContractFinancingOption;
	startDate: string;
	endDate: string;
	daysLeft: number;
	status: ContractStatus;
	approvedAt: string | null;
	updatedAt: string;
}

export interface ContractsLoadResult {
	rows: ContractsRow[];
	stats: {
		total: number;
		approved: number;
		draft: number;
		expiringSoon: number;
	};
	pagination: PaginationState<ContractsFilters>;
	loadError: string | null;
}

const allowedStatuses = new Set<ContractStatus>([
	'approved',
	'draft',
	'terminated',
	'stopped',
	'expired'
]);

const allowedCareTypes = new Set<ContractCareType>(['ambulante', 'accommodation']);

const allowedFinancingActs = new Set<ContractFinancingAct>(['WMO', 'ZVW', 'WLZ', 'JW', 'WPG']);

const allowedFinancingOptions = new Set<ContractFinancingOption>(['ZIN', 'PGB']);

const normalizeList = <T extends string>(values: string[], allowed: Set<T>): T[] =>
	values.filter((value): value is T => allowed.has(value as T));

const normalizeDate = (value: string | null) => {
	if (!value) return '';
	return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
};

const toRows = (results: Array<any>): ContractsRow[] =>
	results.map((item) => ({
		id: item.id,
		clientId: item.client_id,
		clientFirstName: item.client_first_name,
		clientLastName: item.client_last_name,
		clientFileNumber: item.client_filenumber,
		senderId: item.sender_id,
		senderName: item.sender_name,
		careName: item.care_name,
		careType: item.care_type,
		price: item.price,
		priceTimeUnit: item.price_time_unit,
		hours: item.hours,
		hoursType: item.hours_type,
		financingAct: item.financing_act,
		financingOption: item.financing_option,
		startDate: item.start_date,
		endDate: item.end_date,
		daysLeft: item.days_left,
		status: item.status,
		approvedAt: item.approved_at,
		updatedAt: item.updated_at
	}));

export const load: PageLoad = ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const requestedPageSize = Number(url.searchParams.get('page_size') ?? '10') || 10;
	const pageSize = Math.min(100, Math.max(5, requestedPageSize));

	const search = (url.searchParams.get('search') ?? '').trim();
	const clientName = (url.searchParams.get('client_name') ?? '').trim();
	const senderName = (url.searchParams.get('sender_name') ?? '').trim();

	const status = normalizeList(url.searchParams.getAll('status'), allowedStatuses);
	const careType = normalizeList(url.searchParams.getAll('care_type'), allowedCareTypes);
	const financingAct = normalizeList(
		url.searchParams.getAll('financing_act'),
		allowedFinancingActs
	);
	const financingOption = normalizeList(
		url.searchParams.getAll('financing_option'),
		allowedFinancingOptions
	);

	const endDateFrom = normalizeDate(url.searchParams.get('end_date_from'));
	const endDateTo = normalizeDate(url.searchParams.get('end_date_to'));

	const contractsData: Promise<ContractsLoadResult> = listContracts({
		page,
		pageSize,
		search: search || undefined,
		client_name: clientName || undefined,
		sender_name: senderName || undefined,
		status: status.length > 0 ? status : undefined,
		care_type: careType.length > 0 ? careType : undefined,
		financing_act: financingAct.length > 0 ? financingAct : undefined,
		financing_option: financingOption.length > 0 ? financingOption : undefined,
		end_date_from: endDateFrom || undefined,
		end_date_to: endDateTo || undefined
	})
		.then((response) => {
			const { count, next, previous, page_size, results } = response.data;
			const rows = toRows(results);

			return {
				rows,
				stats: {
					total: count,
					approved: rows.filter((row) => row.status === 'approved').length,
					draft: rows.filter((row) => row.status === 'draft').length,
					expiringSoon: rows.filter((row) => row.daysLeft >= 0 && row.daysLeft <= 30).length
				},
				pagination: {
					count,
					page,
					pageSize: page_size || pageSize,
					next,
					previous,
					filters: {
						search,
						clientName,
						senderName,
						status,
						careType,
						financingAct,
						financingOption,
						endDateFrom,
						endDateTo
					}
				} satisfies PaginationState<ContractsFilters>,
				loadError: null
			} satisfies ContractsLoadResult;
		})
		.catch((error): ContractsLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load contracts.';
			return {
				rows: [],
				stats: {
					total: 0,
					approved: 0,
					draft: 0,
					expiringSoon: 0
				},
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters: {
						search,
						clientName,
						senderName,
						status,
						careType,
						financingAct,
						financingOption,
						endDateFrom,
						endDateTo
					}
				} satisfies PaginationState<ContractsFilters>,
				loadError: message
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters: {
				search,
				clientName,
				senderName,
				status,
				careType,
				financingAct,
				financingOption,
				endDateFrom,
				endDateTo
			}
		},
		contractsData
	};
};
