import type { PageLoad } from './$types';
import { listInvoices } from '$lib/api/invoices';
import type {
	ListInvoicesResponse,
	InvoicesFilters,
	InvoiceStatus,
	InvoiceSource,
	InvoiceType
} from '$lib/types/api/invoices';

export interface InvoicesLoadResult {
	invoices: ListInvoicesResponse[];
	pagination: {
		page: number;
		pageSize: number;
		count: number;
		totalPages: number;
	};
	loadError: string | null;
}

export const load: PageLoad = async ({ url, depends }) => {
	depends('invoices:list');

	const page = Number(url.searchParams.get('page')) || 1;
	const pageSize = Number(url.searchParams.get('page_size')) || 20;

	const filters: InvoicesFilters = {
		status: (url.searchParams.get('status') as InvoiceStatus) || undefined,
		q: url.searchParams.get('q') || undefined,
		source: (url.searchParams.get('source') as InvoiceSource) || undefined,
		invoice_type: (url.searchParams.get('invoice_type') as InvoiceType) || undefined,
		locked: url.searchParams.has('locked') ? url.searchParams.get('locked') === 'true' : undefined,
		start_date: url.searchParams.get('start_date') || undefined,
		end_date: url.searchParams.get('end_date') || undefined,
		page,
		page_size: pageSize
	};

	const invoicesData = listInvoices(filters)
		.then((response) => {
			const { count, page_size, results } = response.data;
			return {
				invoices: results,
				pagination: {
					page,
					pageSize: page_size || pageSize,
					count,
					totalPages: Math.ceil(count / (page_size || pageSize))
				},
				loadError: null
			} satisfies InvoicesLoadResult;
		})
		.catch((error): InvoicesLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load invoices.';
			return {
				invoices: [],
				pagination: {
					page,
					pageSize,
					count: 0,
					totalPages: 0
				},
				loadError: message
			};
		});

	return {
		initial: {
			page,
			pageSize,
			filters
		},
		invoicesData
	};
};
