import type { PageLoad } from './$types';
import { listInvoices } from '$lib/api/invoices';
import type {
	ListInvoicesResponse,
	InvoicesFilters,
	InvoiceStatus,
	InvoiceSource,
	InvoiceType
} from '$lib/types/api/invoices';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';

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

const parsePage = (value: string | null, fallback: number) => {
	const parsed = Number(value);
	return value && Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const invoiceStatuses: InvoiceStatus[] = [
	'outstanding',
	'partially_paid',
	'paid',
	'expired',
	'overpaid',
	'imported',
	'concept',
	'canceled'
];
const invoiceSources: InvoiceSource[] = ['auto', 'manual', 'imported'];
const invoiceTypes: InvoiceType[] = ['standard', 'credit_note'];

const parseOption = <T extends string>(
	value: string | null,
	options: readonly T[]
): T | undefined => options.find((option) => option === value);

const parseDate = (value: string | null): string | undefined => {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
	const date = new Date(value);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
		? value
		: undefined;
};

export const load: PageLoad = ({ url, fetch, depends }) => {
	if (!getAuthState().hasAllPermissions([PERMISSIONS.CLIENT.VIEW, PERMISSIONS.INVOICE.VIEW])) {
		error(403, m.invoices_access_denied());
	}

	depends('app:invoices:list');

	const page = parsePage(url.searchParams.get('page'), 1);
	const pageSize = Math.min(parsePage(url.searchParams.get('page_size'), 20), 100);

	const filters: InvoicesFilters = {
		status: parseOption(url.searchParams.get('status'), invoiceStatuses),
		q: url.searchParams.get('q')?.trim().slice(0, 120) || undefined,
		source: parseOption(url.searchParams.get('source'), invoiceSources),
		invoice_type: parseOption(url.searchParams.get('invoice_type'), invoiceTypes),
		locked: url.searchParams.get('locked') === 'true' ? true : undefined,
		start_date: parseDate(url.searchParams.get('start_date')),
		end_date: parseDate(url.searchParams.get('end_date')),
		page,
		page_size: pageSize
	};

	const invoicesData: Promise<InvoicesLoadResult> = listInvoices(filters, { fetchFn: fetch })
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
			const message = error instanceof Error ? error.message : m.failed_load_invoices();
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
