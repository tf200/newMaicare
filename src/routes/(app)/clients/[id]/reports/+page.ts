import { listClientProgressReports } from '$lib/api/clients';
import type { PageLoad } from './$types';
import type { ListProgressReportsResponse, ProgressReportType } from '$lib/types/api/clients';

const REPORT_TYPES = new Set<ProgressReportType>([
	'morning_report',
	'evening_report',
	'night_report',
	'shift_report',
	'one_to_one_report',
	'process_report',
	'contact_journal',
	'other'
]);

const toPositiveInt = (value: string | null, fallback: number) => {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed < 1) return fallback;
	return parsed;
};

const parseReportType = (value: string | null): ProgressReportType | undefined => {
	if (!value) return undefined;
	if (REPORT_TYPES.has(value as ProgressReportType)) {
		return value as ProgressReportType;
	}
	return undefined;
};

export const load: PageLoad = async ({ params, url }) => {
	const page = toPositiveInt(url.searchParams.get('page'), 1);
	const requestedPageSize = toPositiveInt(url.searchParams.get('page_size'), 10);
	const pageSize = Math.min(100, Math.max(5, requestedPageSize));
	const type = parseReportType(url.searchParams.get('type'));

	let reports: ListProgressReportsResponse[] = [];

	try {
		const response = await listClientProgressReports(params.id, {
			page,
			page_size: pageSize,
			type
		});
		reports = response.data.results;
	} catch (error) {
		console.error('Failed to load progress reports:', error);
	}

	return {
		reports,
		clientId: params.id
	};
};
