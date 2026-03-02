import { listWorkApprovalQueue } from '$lib/api/events';
import type { WorkApprovalQueueItemResponse } from '$lib/types/api';
import type { PageLoad } from './$types';

export interface AppointmentQueueFilters {
	startAt: string;
	endAt: string;
	employeeIds: string[];
	onlyEnded: boolean;
}

export interface AppointmentsLoadResult {
	items: WorkApprovalQueueItemResponse[];
	total: number;
	loadError: string | null;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 500;

const parsePositiveInt = (value: string | null, fallback: number) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.floor(parsed);
};

const parseEmployeeIds = (value: string | null) => {
	if (!value) return [];
	return value
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);
};

const parseBooleanWithDefault = (value: string | null, fallback: boolean) => {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return fallback;
};

const isValidIsoDate = (value: string | null) => {
	if (!value) return false;
	return !Number.isNaN(new Date(value).getTime());
};

const toIsoDate = (value: Date) => value.toISOString();

const getDefaultRange = () => {
	const end = new Date();
	const start = new Date(end);
	start.setDate(start.getDate() - 30);
	return {
		startAt: toIsoDate(start),
		endAt: toIsoDate(end)
	};
};

export const load: PageLoad = ({ url }) => {
	const page = Math.max(1, parsePositiveInt(url.searchParams.get('page'), 1));
	const requestedPageSize = parsePositiveInt(url.searchParams.get('page_size'), DEFAULT_PAGE_SIZE);
	const pageSize =
		requestedPageSize > 0 && requestedPageSize <= MAX_PAGE_SIZE
			? requestedPageSize
			: DEFAULT_PAGE_SIZE;

	const defaultRange = getDefaultRange();
	const startAt = isValidIsoDate(url.searchParams.get('start_at'))
		? String(url.searchParams.get('start_at'))
		: defaultRange.startAt;
	const endAt = isValidIsoDate(url.searchParams.get('end_at'))
		? String(url.searchParams.get('end_at'))
		: defaultRange.endAt;
	const onlyEnded = parseBooleanWithDefault(url.searchParams.get('only_ended'), true);
	const employeeIds = parseEmployeeIds(url.searchParams.get('employee_ids'));

	const offset = (page - 1) * pageSize;

	const approvalQueueData: Promise<AppointmentsLoadResult> = listWorkApprovalQueue({
		start_at: startAt,
		end_at: endAt,
		employee_ids: employeeIds.length > 0 ? employeeIds : undefined,
		only_ended: onlyEnded,
		limit: pageSize,
		offset
	})
		.then((response) => ({
			items: response.data.items,
			total: response.data.total,
			loadError: null
		}))
		.catch((error): AppointmentsLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load work approvals.';
			return {
				items: [],
				total: 0,
				loadError: message
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters: {
				startAt,
				endAt,
				employeeIds,
				onlyEnded
			} satisfies AppointmentQueueFilters
		},
		approvalQueueData
	};
};
