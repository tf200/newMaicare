import { api } from './client';
import type { ApiEnvelope, PaginatedResponse } from '$lib/types/api';
import type {
	ListInvoicesResponse,
	InvoicesFilters,
	GetInvoiceByIDResponse,
	CreateInvoiceRequest,
	CreateInvoiceResponse,
	UpdateInvoiceRequest,
	UpdateInvoiceResponse,
	GenerateInvoicePDFResponse,
	CreditInvoiceResponse,
	InvoicePayment,
	InvoicePaymentsFilters,
	CreateInvoicePaymentRequest,
	CreateInvoicePaymentResponse,
	UpdateInvoicePaymentRequest,
	UpdateInvoicePaymentResponse
} from '$lib/types/api/invoices';

export function getInvoice(id: string) {
	return api.get<ApiEnvelope<GetInvoiceByIDResponse>>(`/invoices/${id}`);
}

export function generateInvoicePdf(id: string) {
	return api.get<ApiEnvelope<GenerateInvoicePDFResponse>>(`/invoices/${id}/generate_pdf`);
}

export function creditInvoice(id: string) {
	return api.post<ApiEnvelope<CreditInvoiceResponse>>(`/invoices/${id}/credit`, {});
}

export function createInvoice(payload: CreateInvoiceRequest) {
	return api.post<ApiEnvelope<CreateInvoiceResponse>>('/invoices', payload);
}

export function updateInvoice(id: string, payload: UpdateInvoiceRequest) {
	return api.put<ApiEnvelope<UpdateInvoiceResponse>>(`/invoices/${id}`, payload);
}

export function listInvoicePayments(
	invoiceId: string,
	params: Omit<InvoicePaymentsFilters, 'invoice_id'> = {}
) {
	const searchParams = new URLSearchParams();

	if (params.status) searchParams.set('status', params.status);
	if (params.page) searchParams.set('page', String(params.page));
	if (params.page_size) searchParams.set('page_size', String(params.page_size));
	if (params.sort_by) searchParams.set('sort_by', params.sort_by);
	if (params.sort_dir) searchParams.set('sort_dir', params.sort_dir);

	const query = searchParams.toString();
	const endpoint = query
		? `/invoices/${invoiceId}/payments?${query}`
		: `/invoices/${invoiceId}/payments`;

	return api.get<ApiEnvelope<InvoicePayment[] | PaginatedResponse<InvoicePayment>>>(endpoint);
}

export function createInvoicePayment(payload: CreateInvoicePaymentRequest) {
	return api.post<ApiEnvelope<CreateInvoicePaymentResponse>>('/invoices/payments', payload);
}

export function updateInvoicePayment(
	invoiceId: string,
	paymentId: string,
	payload: UpdateInvoicePaymentRequest
) {
	return api.put<ApiEnvelope<UpdateInvoicePaymentResponse>>(
		`/invoices/${invoiceId}/payments/${paymentId}`,
		payload
	);
}

export function listInvoices(params: InvoicesFilters = {}) {
	const searchParams = new URLSearchParams();

	if (params.page) searchParams.set('page', String(params.page));
	if (params.page_size) searchParams.set('page_size', String(params.page_size));
	if (params.client_id) searchParams.set('client_id', params.client_id);
	if (params.sender_id) searchParams.set('sender_id', params.sender_id);
	if (params.status) searchParams.set('status', params.status);
	if (params.statuses && params.statuses.length > 0) {
		params.statuses.forEach((s) => searchParams.append('statuses', s));
	}
	if (params.source) searchParams.set('source', params.source);
	if (params.invoice_type) searchParams.set('invoice_type', params.invoice_type);
	if (params.run_id) searchParams.set('run_id', params.run_id);
	if (params.start_date) searchParams.set('start_date', params.start_date);
	if (params.end_date) searchParams.set('end_date', params.end_date);
	if (params.period_start) searchParams.set('period_start', params.period_start);
	if (params.period_end) searchParams.set('period_end', params.period_end);
	if (params.locked !== undefined) searchParams.set('locked', String(params.locked));
	if (params.min_warning_count !== undefined)
		searchParams.set('min_warning_count', String(params.min_warning_count));
	if (params.q) searchParams.set('q', params.q);
	if (params.sort_by) searchParams.set('sort_by', params.sort_by);
	if (params.sort_dir) searchParams.set('sort_dir', params.sort_dir);

	const query = searchParams.toString();
	const endpoint = query ? `/invoices?${query}` : '/invoices';

	return api.get<ApiEnvelope<PaginatedResponse<ListInvoicesResponse>>>(endpoint);
}
