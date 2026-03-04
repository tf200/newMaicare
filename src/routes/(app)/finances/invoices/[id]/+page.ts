import { getInvoice, listInvoicePayments } from '$lib/api/invoices';
import type {
	InvoiceStatus,
	InvoiceSource,
	InvoiceType,
	InvoiceLine,
	InvoicePayment
} from '$lib/types/api/invoices';
import type { PaginatedResponse } from '$lib/types/api';
import type { PageLoad } from './$types';

export interface InvoicePaymentView {
	id: string;
	date: string;
	amount: number;
	method: string;
	status: 'completed' | 'pending' | 'failed' | 'reversed' | 'refunded';
	reference: string;
	notes: string | null;
}

export interface InvoiceDetailView {
	id: string;
	invoiceNumber: string;
	issueDate: string;
	dueDate: string;
	status: InvoiceStatus;
	source: InvoiceSource;
	invoiceType: InvoiceType;
	periodStart: string | null;
	periodEnd: string | null;
	currency: string;
	netTotalAmount: number;
	vatTotalAmount: number;
	grossTotalAmount: number;
	pdfAttachmentId: string | null;
	extraContent?: Record<string, any>;
	clientId: string;
	clientFirstName: string;
	clientLastName: string;
	senderId: string;
	senderName: string | null;
	senderKvkNumber: string | null;
	senderBtwNumber: string | null;
	paymentCompletionPrc: number;
	lockedAt: string | null;
	warningCount: number;
	lines: InvoiceLine[];
	updatedAt: string;
	createdAt: string;
	payments: InvoicePaymentView[];
	hasCompletedPayments: boolean;
	canEditMeta: boolean;
	canEditLines: boolean;
	lineUpdateMode: 'appointment_linked' | 'non_linked';
	lineEditBlockReason: string | null;
}

export interface InvoiceDetailLoadResult {
	invoice: InvoiceDetailView | null;
	loadError: string | null;
	paymentsLoadError: string | null;
}

const normalizePaymentStatus = (
	status: string | null | undefined
): InvoicePaymentView['status'] => {
	const normalized = status?.toLowerCase();

	if (normalized === 'completed' || normalized === 'paid' || normalized === 'success') {
		return 'completed';
	}

	if (normalized === 'failed' || normalized === 'error' || normalized === 'declined') {
		return 'failed';
	}

	if (normalized === 'reversed') {
		return 'reversed';
	}

	if (normalized === 'refunded') {
		return 'refunded';
	}

	return 'pending';
};

const mapInvoicePayment = (payment: InvoicePayment): InvoicePaymentView => {
	const id = payment.payment_id ?? payment.id;
	const date =
		payment.payment_date ?? payment.date ?? payment.created_at ?? new Date().toISOString();
	const method = payment.payment_method ?? payment.method ?? 'Unknown method';
	const reference =
		payment.payment_reference ?? payment.reference ?? payment.transaction_reference ?? '—';
	const status = payment.payment_status ?? payment.status;

	return {
		id,
		date,
		amount: payment.amount,
		method,
		status: normalizePaymentStatus(status),
		reference,
		notes: payment.notes ?? null
	};
};

const extractPayments = (
	data: InvoicePayment[] | PaginatedResponse<InvoicePayment> | null | undefined
): InvoicePayment[] => {
	if (!data) return [];
	if (Array.isArray(data)) return data;
	return Array.isArray(data.results) ? data.results : [];
};

const isLikelyAppointmentLinkedInvoice = (lines: InvoiceLine[]) => {
	if (lines.length === 0) return false;

	return lines.every(
		(line) =>
			line.line_type === 'contract' &&
			line.service_type === 'ambulante' &&
			(line.unit === 'hour' || line.unit === 'minute')
	);
};

export const load: PageLoad = async ({ params, depends }) => {
	depends(`invoice:detail:${params.id}`);
	depends(`invoice:payments:${params.id}`);

	const paymentsResultPromise = listInvoicePayments(params.id, {
		page: 1,
		page_size: 100,
		sort_by: 'payment_date',
		sort_dir: 'desc'
	})
		.then((response) => ({ response, error: null }))
		.catch((error: unknown) => {
			const message = error instanceof Error ? error.message : 'Failed to load invoice payments.';
			return { response: null, error: message };
		});

	const invoiceData = Promise.all([getInvoice(params.id), paymentsResultPromise])
		.then(([invoiceResponse, paymentsResult]): InvoiceDetailLoadResult => {
			const raw = invoiceResponse.data;
			const payments = extractPayments(paymentsResult.response?.data).map(mapInvoicePayment);
			const lines = raw.lines as InvoiceLine[];
			const hasCompletedPayments = payments.some((payment) => payment.status === 'completed');
			const isLocked = Boolean(raw.locked_at);
			const lineEditBlockReason =
				raw.source === 'imported'
					? 'Imported invoices do not allow line edits.'
					: raw.invoice_type === 'credit_note'
						? 'Credit notes do not allow line edits.'
						: raw.status === 'canceled'
							? 'Canceled invoices do not allow line edits.'
							: isLocked
								? 'This invoice is locked and cannot update lines.'
								: hasCompletedPayments
									? 'Invoices with completed payments do not allow line edits.'
									: null;
			const canEditLines = lineEditBlockReason === null;
			const canEditMeta = raw.status !== 'canceled';
			const lineUpdateMode = isLikelyAppointmentLinkedInvoice(lines)
				? 'appointment_linked'
				: 'non_linked';

			return {
				invoice: {
					id: raw.id,
					invoiceNumber: raw.invoice_number,
					issueDate: raw.issue_date,
					dueDate: raw.due_date,
					status: raw.status as InvoiceStatus,
					source: raw.source as InvoiceSource,
					invoiceType: raw.invoice_type as InvoiceType,
					periodStart: raw.period_start,
					periodEnd: raw.period_end,
					currency: raw.currency,
					netTotalAmount: raw.net_total_amount,
					vatTotalAmount: raw.vat_total_amount,
					grossTotalAmount: raw.gross_total_amount,
					pdfAttachmentId: raw.pdf_attachment_id ?? null,
					extraContent: raw.extra_content ?? {},
					clientId: raw.client_id,
					clientFirstName: raw.client_first_name,
					clientLastName: raw.client_last_name,
					senderId: raw.sender_id,
					senderName: raw.sender_name,
					senderKvkNumber: raw.sender_kvknumber,
					senderBtwNumber: raw.sender_btwnumber,
					paymentCompletionPrc: raw.payment_completion_prc,
					lockedAt: raw.locked_at ?? null,
					warningCount: raw.warning_count ?? 0,
					lines,
					updatedAt: raw.updated_at,
					createdAt: raw.created_at,
					payments,
					hasCompletedPayments,
					canEditMeta,
					canEditLines,
					lineUpdateMode,
					lineEditBlockReason
				},
				loadError: null,
				paymentsLoadError: paymentsResult.error
			};
		})
		.catch((error): InvoiceDetailLoadResult => {
			const message = error instanceof Error ? error.message : 'Failed to load invoice details.';
			return {
				invoice: null,
				loadError: message,
				paymentsLoadError: null
			};
		});

	return {
		invoiceData
	};
};
