import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { listInvoicePayments } from '$lib/api/invoices';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { getAuthState } from '$lib/state/auth.svelte';
import type { PaginatedResponse } from '$lib/types/api';
import type { InvoicePayment } from '$lib/types/api/invoices';

export interface InvoicePaymentView {
	id: string;
	date: string;
	amount: number;
	method: string;
	status: 'completed' | 'pending' | 'failed' | 'reversed' | 'refunded';
	reference: string;
	notes: string | null;
}

export interface InvoicePaymentsLoadResult {
	payments: InvoicePaymentView[];
	loadError: string | null;
}

function normalizePaymentStatus(status: string | null | undefined): InvoicePaymentView['status'] {
	const normalized = status?.toLowerCase();
	if (normalized === 'completed' || normalized === 'paid' || normalized === 'success') {
		return 'completed';
	}
	if (normalized === 'failed' || normalized === 'error' || normalized === 'declined') {
		return 'failed';
	}
	if (normalized === 'reversed') return 'reversed';
	if (normalized === 'refunded') return 'refunded';
	return 'pending';
}

function mapInvoicePayment(payment: InvoicePayment): InvoicePaymentView {
	return {
		id: payment.payment_id ?? payment.id,
		date: payment.payment_date ?? payment.date ?? payment.created_at ?? new Date().toISOString(),
		amount: payment.amount,
		method: payment.payment_method ?? payment.method ?? 'other',
		status: normalizePaymentStatus(payment.payment_status ?? payment.status),
		reference:
			payment.payment_reference ?? payment.reference ?? payment.transaction_reference ?? '—',
		notes: payment.notes ?? null
	};
}

function extractPayments(
	data: InvoicePayment[] | PaginatedResponse<InvoicePayment> | null | undefined
): InvoicePayment[] {
	if (!data) return [];
	if (Array.isArray(data)) return data;
	return Array.isArray(data.results) ? data.results : [];
}

export const load: LayoutLoad = ({ params, depends, fetch }) => {
	const auth = getAuthState();
	if (!auth.hasPermission(PERMISSIONS.INVOICE.VIEW)) {
		error(403, m.invoices_access_denied());
	}

	depends(`invoice:payments:${params.id}`);
	const paymentsData: Promise<InvoicePaymentsLoadResult> = auth.hasPermission(
		PERMISSIONS.INVOICE.PAYMENT_VIEW
	)
		? listInvoicePayments(
				params.id,
				{ page: 1, page_size: 100, sort_by: 'payment_date', sort_dir: 'desc' },
				{ fetchFn: fetch }
			)
				.then((response) => ({
					payments: extractPayments(response.data).map(mapInvoicePayment),
					loadError: null
				}))
				.catch((cause: unknown) => ({
					payments: [],
					loadError: cause instanceof Error ? cause.message : m.failed_load_invoice_payments()
				}))
		: Promise.resolve({ payments: [], loadError: null });

	return { paymentsData };
};
