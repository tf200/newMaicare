import { getInvoice } from '$lib/api/invoices';
import type {
	InvoiceStatus,
	InvoiceSource,
	InvoiceType,
	InvoiceLine
} from '$lib/types/api/invoices';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getAuthState } from '$lib/state/auth.svelte';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';

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
	extraContent?: Record<string, unknown>;
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
	canEditMeta: boolean;
	canEditLines: boolean;
	lineUpdateMode: 'appointment_linked' | 'non_linked';
	lineEditBlockReason: string | null;
}

export interface InvoiceDetailLoadResult {
	invoice: InvoiceDetailView | null;
	loadError: string | null;
}

const isLikelyAppointmentLinkedInvoice = (lines: InvoiceLine[]) => {
	if (lines.length === 0) return false;

	return lines.every(
		(line) =>
			line.line_type === 'contract' &&
			line.service_type === 'ambulante' &&
			(line.unit === 'hour' || line.unit === 'minute')
	);
};

function getLineEditBlockReason(
	source: InvoiceSource,
	type: InvoiceType,
	status: InvoiceStatus,
	isLocked: boolean,
	hasCompletedPayments: boolean
): string | null {
	if (source === 'imported') return m.imported_invoice_line_edit_blocked();
	if (type === 'credit_note') return m.credit_note_line_edit_blocked();
	if (status === 'canceled') return m.canceled_invoice_line_edit_blocked();
	if (isLocked) return m.locked_invoice_line_edit_blocked();
	if (hasCompletedPayments) return m.paid_invoice_line_edit_blocked();
	return null;
}

export const load: PageLoad = ({ params, depends, fetch }) => {
	if (!getAuthState().hasPermission(PERMISSIONS.INVOICE.VIEW)) {
		error(403, m.invoices_access_denied());
	}

	depends(`invoice:detail:${params.id}`);

	const invoiceData: Promise<InvoiceDetailLoadResult> = getInvoice(params.id, { fetchFn: fetch })
		.then((invoiceResponse): InvoiceDetailLoadResult => {
			const raw = invoiceResponse.data;
			const lines = raw.lines;
			const hasCompletedPayments = raw.payment_completion_prc > 0;
			const isLocked = Boolean(raw.locked_at);
			const lineEditBlockReason = getLineEditBlockReason(
				raw.source,
				raw.invoice_type,
				raw.status,
				isLocked,
				hasCompletedPayments
			);
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
					canEditMeta,
					canEditLines,
					lineUpdateMode,
					lineEditBlockReason
				},
				loadError: null
			};
		})
		.catch((error): InvoiceDetailLoadResult => {
			const message = error instanceof Error ? error.message : m.failed_load_invoice_details();
			return {
				invoice: null,
				loadError: message
			};
		});

	return {
		initial: { id: params.id },
		invoiceData
	};
};
