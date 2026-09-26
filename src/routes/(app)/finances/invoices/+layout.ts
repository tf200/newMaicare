import type { LayoutLoad } from './$types';
import { getInvoiceStats } from '$lib/api/invoices';
import type { InvoiceStatsResponse } from '$lib/types/api/invoices';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';

export interface InvoiceStatsLoadResult {
	stats: InvoiceStatsResponse;
	loadError: string | null;
}

const emptyStats: InvoiceStatsResponse = {
	total_invoices: 0,
	currency: 'EUR',
	outstanding_balance: 0,
	received_payments: 0,
	overdue_amount: 0
};

export const load: LayoutLoad = ({ route, fetch, depends }) => {
	if (route.id !== '/(app)/finances/invoices') {
		return { invoiceStats: null };
	}

	if (!getAuthState().hasAllPermissions([PERMISSIONS.CLIENT.VIEW, PERMISSIONS.INVOICE.VIEW])) {
		error(403, m.invoices_access_denied());
	}

	depends('app:invoices:stats');

	const invoiceStats: Promise<InvoiceStatsLoadResult> = getInvoiceStats({ fetchFn: fetch })
		.then((response): InvoiceStatsLoadResult => ({ stats: response.data, loadError: null }))
		.catch((loadError): InvoiceStatsLoadResult => ({
			stats: emptyStats,
			loadError: loadError instanceof Error ? loadError.message : m.failed_load_invoice_stats()
		}));

	return { invoiceStats };
};
