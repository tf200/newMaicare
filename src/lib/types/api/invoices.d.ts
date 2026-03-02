export type InvoiceStatus =
	| 'outstanding'
	| 'partially_paid'
	| 'paid'
	| 'expired'
	| 'overpaid'
	| 'imported'
	| 'concept'
	| 'canceled';

export type InvoiceSource = 'auto' | 'manual' | 'imported';
export type InvoiceType = 'standard' | 'credit_note';

export interface ListInvoicesResponse {
	id: string;
	invoice_number: string;
	sender_name: string;
	is_overdue: boolean;

	client_id: string;
	client_first_name: string;
	client_last_name: string;
	client_filenumber: string;

	sender_id: string;
	currency: string;
	gross_total_amount: number;
	balance_due_amount: number;
	paid_total_amount: number;

	status: InvoiceStatus;

	issue_date: string;
	due_date: string;
}

export interface InvoicesFilters {
	client_id?: string;
	sender_id?: string;
	status?: InvoiceStatus;
	statuses?: InvoiceStatus[];
	source?: InvoiceSource;
	invoice_type?: InvoiceType;
	run_id?: string;
	start_date?: string;
	end_date?: string;
	period_start?: string;
	period_end?: string;
	locked?: boolean;
	min_warning_count?: number;
	q?: string;
	sort_by?:
		| 'updated_at'
		| 'issue_date'
		| 'due_date'
		| 'invoice_number'
		| 'gross_total_amount'
		| 'balance_due_amount';
	sort_dir?: 'asc' | 'desc';
	page?: number;
	page_size?: number;
}

export interface InvoiceLine {
	id: string;
	line_no: number;
	line_type: 'contract' | 'manual' | 'adjustment';
	contract_id: string | null;
	service_type: 'ambulante' | 'accommodation';
	description: string;
	period_start: string;
	period_end: string | null;
	quantity: number;
	unit: string;
	unit_price: number;
	net_amount: number;
	vat_rate: number;
	vat_amount: number;
	gross_amount: number;
}

export interface GetInvoiceByIDResponse {
	id: string;
	invoice_number: string;
	issue_date: string;
	due_date: string;
	status: InvoiceStatus;
	source: InvoiceSource;
	invoice_type: InvoiceType;
	original_invoice_id: string | null;
	replaces_invoice_id: string | null;
	period_start: string | null;
	period_end: string | null;
	billing_timezone: string;
	currency: string;
	net_total_amount: number;
	vat_total_amount: number;
	gross_total_amount: number;
	pdf_attachment_id: string | null;
	extra_content?: Record<string, any>;
	client_id: string;
	sender_id: string;
	lines: InvoiceLine[];
	updated_at: string;
	created_at: string;
	sender_name: string | null;
	sender_kvknumber: string | null;
	sender_btwnumber: string | null;
	client_first_name: string;
	client_last_name: string;
	payment_completion_prc: number;
}

export type InvoicePaymentMethod =
	| 'bank_transfer'
	| 'credit_card'
	| 'check'
	| 'cash'
	| 'other'
	| string;

export type InvoicePaymentStatus =
	| 'completed'
	| 'pending'
	| 'failed'
	| 'reversed'
	| 'refunded'
	| string;

export interface InvoicePayment {
	id: string;
	payment_id?: string;
	invoice_id?: string;
	amount: number;
	status?: InvoicePaymentStatus | null;
	payment_status?: InvoicePaymentStatus | null;
	payment_date?: string;
	date?: string;
	payment_method?: InvoicePaymentMethod | null;
	method?: InvoicePaymentMethod | null;
	reference?: string | null;
	payment_reference?: string | null;
	transaction_reference?: string | null;
	notes?: string | null;
	recorded_by?: string | null;
	invoice_status_changed?: boolean;
	current_invoice_status?: InvoiceStatus;
	previous_invoice_status?: InvoiceStatus;
	created_at?: string;
	updated_at?: string;
}

export interface CreateInvoicePaymentRequest {
	invoice_id: string;
	amount: number;
	payment_date: string;
	payment_method: string;
	status?: InvoicePaymentStatus;
	reference?: string | null;
	notes?: string | null;
}

export type CreateInvoicePaymentResponse = InvoicePayment;

export interface UpdateInvoicePaymentRequest {
	payment_method?: InvoicePaymentMethod | null;
	payment_status?: InvoicePaymentStatus | null;
	amount?: number | null;
	payment_date?: string | null;
	payment_reference?: string | null;
	notes?: string | null;
}

export interface UpdateInvoicePaymentResponse {
	payment_id: string;
	invoice_id: string;
	payment_method: InvoicePaymentMethod;
	payment_status: InvoicePaymentStatus;
	amount: number;
	payment_date: string;
	payment_reference: string | null;
	notes: string | null;
	recorded_by: string | null;
	invoice_status_changed: boolean;
	current_invoice_status: InvoiceStatus;
	previous_invoice_status: InvoiceStatus;
}

export interface InvoicePaymentsFilters {
	invoice_id?: string;
	status?: string;
	page?: number;
	page_size?: number;
	sort_by?: 'created_at' | 'updated_at' | 'payment_date' | 'amount';
	sort_dir?: 'asc' | 'desc';
}

export interface GenerateInvoicePDFResponse {
	file_url: string;
}

export interface CreditInvoiceResponse {
	id: string;
}
