<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { beforeNavigate, goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		FileText,
		CheckCircle2,
		XCircle,
		Clock,
		Banknote,
		User,
		Building2,
		Download,
		ChevronRight,
		Info,
		Wallet,
		Receipt,
		Euro,
		ArrowRightLeft,
		FileWarning,
		BadgeEuro,
		SquarePen,
		Pencil,
		Plus,
		Trash2,
		Lock
	} from 'lucide-svelte';
	import type { InvoiceDetailLoadResult, InvoiceDetailView } from './+page';
	import type { InvoicePaymentView, InvoicePaymentsLoadResult } from './+layout';
	import { creditInvoice, generateInvoicePdf, updateInvoice } from '$lib/api/invoices';
	import { listClientContracts } from '$lib/api/clients';
	import AddInvoicePaymentSheet from '$lib/components/forms/AddInvoicePaymentSheet.svelte';
	import EditInvoicePaymentSheet from '$lib/components/forms/EditInvoicePaymentSheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import type { InvoiceLine, InvoiceSource } from '$lib/types/api/invoices';
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ListClientContractsResponse } from '$lib/types/api/contracts';
	import type { UpdateInvoiceRequest, UpdateInvoiceLineRequest } from '$lib/types/api/invoices';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { UpdateInvoiceSchema, type UpdateInvoiceInput } from '$lib/schemas/invoice';
	import { formatFormError } from '$lib/utils/form-errors';
	import { getFormErrorNavigationOptions } from '$lib/utils/form-navigation';

	let { data } = $props<{
		data: {
			initial: { id: string };
			invoiceData: Promise<InvoiceDetailLoadResult>;
			paymentsData: Promise<InvoicePaymentsLoadResult>;
		};
	}>();

	const invoiceDataPromise = $derived(data.invoiceData);
	let isGeneratingPdf = $state(false);
	let downloadPdfError = $state<string | null>(null);
	let isCreditingInvoice = $state(false);
	let creditInvoiceError = $state<string | null>(null);
	let isAddPaymentSheetOpen = $state(false);
	let isEditPaymentSheetOpen = $state(false);
	let paymentSheetInvoice = $state.raw<{
		id: string;
		currency: string;
		defaultAmount: number;
	} | null>(null);
	let selectedPayment = $state<InvoicePaymentView | null>(null);
	let editSheetKey = $state(0);
	let isEditMode = $state(false);
	let editingInvoice = $state.raw<InvoiceDetailView | null>(null);
	let isSavingInvoice = $state(false);
	let saveInvoiceError = $state<string | null>(null);
	const initialEditData: UpdateInvoiceInput = {
		issue_date: '',
		due_date: '',
		status: 'concept',
		warning_count: 0,
		lines: []
	};
	const { form, errors, enhance, submitting, reset } = superForm(
		defaults(initialEditData, valibotClient(UpdateInvoiceSchema)),
		{
			validators: valibotClient(UpdateInvoiceSchema),
			SPA: true,
			dataType: 'json',
			resetForm: false,
			...getFormErrorNavigationOptions(),
			onUpdate: async ({ form: result }) => {
				if (!result.valid) {
					saveInvoiceError = m.fix_line_fields_before_saving();
					return;
				}
				if (editingInvoice) await handleSaveInvoice(editingInvoice, result.data);
			}
		}
	);
	const draftLines = $derived($form.lines);
	let contractOptions = $state.raw<Array<{ value: string; label: string }>>([]);
	let contractsLoadError = $state<string | null>(null);
	let isLoadingContracts = $state(false);
	let originalLineOrder = $state.raw<string[]>([]);
	let initialDraftSnapshot = $state('');
	let contractRequestId = 0;
	const draftSnapshot = $derived(JSON.stringify($form));
	const hasUnsavedChanges = $derived(isEditMode && draftSnapshot !== initialDraftSnapshot);
	beforeNavigate(({ cancel, to }) => {
		if (isSavingInvoice || $submitting) {
			cancel();
			return;
		}
		if (hasUnsavedChanges && !confirm(m.discard_invoice_changes_confirmation())) {
			cancel();
			return;
		}
		if (to?.params?.id !== invoiceId) {
			contractRequestId += 1;
			isEditMode = false;
			editingInvoice = null;
			reset({ data: initialEditData });
			isAddPaymentSheetOpen = false;
			isEditPaymentSheetOpen = false;
			paymentSheetInvoice = null;
			selectedPayment = null;
		}
	});
	const refreshInvoice = () => invalidate('invoice:detail:' + invoiceId);
	const refreshPayments = () => invalidate('invoice:payments:' + invoiceId);
	const refreshInvoiceSummary = async () => {
		await Promise.all([
			refreshInvoice(),
			invalidate('app:invoices:list'),
			invalidate('app:invoices:stats')
		]);
	};
	const refreshInvoiceResources = async () => {
		await Promise.all([refreshInvoiceSummary(), refreshPayments()]);
	};
	const invoiceId = $derived(data.initial.id);

	type DraftLine = UpdateInvoiceInput['lines'][number];

	const invoiceStatuses = $derived([
		{ value: 'concept', label: m.concept() },
		{ value: 'outstanding', label: m.outstanding_status() },
		{ value: 'partially_paid', label: m.partially_paid() },
		{ value: 'paid', label: m.paid() },
		{ value: 'expired', label: m.expired() },
		{ value: 'overpaid', label: m.overpaid() },
		{ value: 'imported', label: m.imported_status() },
		{ value: 'canceled', label: m.canceled() }
	]);

	const lineTypeOptions = $derived([
		{ value: 'contract', label: m.contract_type_label() },
		{ value: 'manual', label: m.manual() },
		{ value: 'adjustment', label: m.adjustment() }
	]);

	const unitOptions = $derived([
		{ value: 'item', label: m.item() },
		{ value: 'hour', label: m.hour() },
		{ value: 'day', label: m.day() },
		{ value: 'minute', label: m.minute() }
	]);

	const serviceTypeOptions = $derived([
		{ value: 'ambulante', label: m.ambulante() },
		{ value: 'accommodation', label: m.accommodation() }
	]);

	const statusMeta = $derived({
		paid: {
			label: m.paid(),
			className: 'border-success/30 bg-success/10 text-success-strong',
			icon: CheckCircle2
		},
		outstanding: {
			label: m.outstanding_status(),
			className: 'border-warning/30 bg-warning/10 text-warning-strong',
			icon: Clock
		},
		partially_paid: {
			label: m.partially_paid(),
			className: 'border-info/30 bg-info/10 text-info-strong',
			icon: Wallet
		},
		expired: {
			label: m.expired(),
			className: 'border-error/30 bg-error/10 text-error-strong',
			icon: FileWarning
		},
		overpaid: {
			label: m.overpaid(),
			className: 'border-secondary/30 bg-secondary/10 text-secondary-strong',
			icon: BadgeEuro
		},
		canceled: {
			label: m.canceled(),
			className: 'border-border bg-bg text-text-muted',
			icon: XCircle
		},
		concept: {
			label: m.concept(),
			className: 'border-border bg-bg text-text-muted',
			icon: FileText
		},
		imported: {
			label: m.imported_status(),
			className: 'border-brand/30 bg-brand/10 text-brand-strong',
			icon: ArrowRightLeft
		}
	});

	const paymentStatusMeta = $derived({
		completed: {
			label: m.completed(),
			className: 'border-success/30 bg-success/10 text-success-strong'
		},
		pending: {
			label: m.pending(),
			className: 'border-warning/30 bg-warning/10 text-warning-strong'
		},
		failed: {
			label: m.failed(),
			className: 'border-error/30 bg-error/10 text-error-strong'
		},
		reversed: {
			label: m.reversed(),
			className: 'border-border bg-bg text-text-muted'
		},
		refunded: {
			label: m.refunded(),
			className: 'border-brand/30 bg-brand/10 text-brand-strong'
		}
	});

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');
	const paymentMethodLabels = $derived<Record<string, string>>({
		bank_transfer: m.bank_transfer(),
		sepa_direct_debit: m.sepa_direct_debit(),
		ideal: m.ideal(),
		credit_card: m.credit_card(),
		check: m.check(),
		cash: m.cash(),
		card: m.card(),
		other: m.other()
	});
	function invoiceSourceLabel(source: InvoiceSource): string {
		switch (source) {
			case 'auto':
				return m.auto();
			case 'manual':
				return m.manual();
			case 'imported':
				return m.imported_status();
		}
	}

	const formatDate = (date: string | null | undefined) => {
		if (!date) return m.not_available_short();
		const parsed = new Date(date);
		if (Number.isNaN(parsed.getTime())) return m.not_available_short();
		return new Intl.DateTimeFormat(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(parsed);
	};

	const formatDateTime = (date: string | null | undefined) => {
		if (!date) return m.not_available_short();
		const parsed = new Date(date);
		if (Number.isNaN(parsed.getTime())) return m.not_available_short();
		return new Intl.DateTimeFormat(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(parsed);
	};

	const formatCurrency = (amount: number | null | undefined, currencyCode: string = 'EUR') => {
		if (amount === null || amount === undefined) return m.not_available_short();
		return new Intl.NumberFormat(resolveLocale(), {
			style: 'currency',
			currency: currencyCode
		}).format(amount);
	};

	const calculateBalance = (gross: number, prc: number) => {
		return Math.max(0, gross - gross * (prc / 100));
	};

	const toDateInputValue = (value: string | null | undefined) => {
		if (!value) return '';
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
	};

	const toRFC3339 = (value: string) => {
		if (!value) return '';
		return `${value}T00:00:00Z`;
	};

	const lineNet = (line: DraftLine) => Number(line.quantity) * Number(line.unit_price);
	const lineVat = (line: DraftLine) => lineNet(line) * (Number(line.vat_rate) / 100);
	const lineGross = (line: DraftLine) => lineNet(line) + lineVat(line);

	const draftTotals = $derived.by(() => {
		let net = 0;
		let vat = 0;
		let gross = 0;

		for (const line of draftLines) {
			net += lineNet(line);
			vat += lineVat(line);
			gross += lineGross(line);
		}

		return { net, vat, gross };
	});

	function toDraftLine(line: InvoiceLine): DraftLine {
		const periodStart = toDateInputValue(line.period_start);
		const periodEnd = toDateInputValue(line.period_end) || periodStart;

		return {
			id: line.id,
			line_type: line.line_type,
			contract_id: line.contract_id ?? '',
			service_type: line.service_type,
			description: line.description,
			period_start: periodStart,
			period_end: periodEnd,
			quantity: Number(line.quantity),
			unit: line.unit,
			unit_price: Number(line.unit_price),
			vat_rate: Number(line.vat_rate)
		};
	}

	function createEmptyDraftLine(): DraftLine {
		return {
			id: crypto.randomUUID(),
			line_type: 'manual',
			contract_id: '',
			service_type: 'ambulante',
			description: '',
			period_start: $form.issue_date,
			period_end: $form.due_date,
			quantity: 1,
			unit: 'hour',
			unit_price: 0,
			vat_rate: 21
		};
	}

	function addDraftLine() {
		$form.lines = [...draftLines, createEmptyDraftLine()];
	}

	function removeDraftLine(id: string) {
		$form.lines = draftLines.filter((line) => line.id !== id);
	}

	async function loadContractOptions(clientId: string) {
		const requestId = ++contractRequestId;
		contractsLoadError = null;
		isLoadingContracts = true;
		try {
			const res = await listClientContracts(clientId, 1, 100);
			if (requestId !== contractRequestId) return;
			contractOptions = (res.data.results ?? []).map((contract: ListClientContractsResponse) => ({
				value: contract.id,
				label: contract.care_name
			}));
		} catch (error) {
			if (requestId !== contractRequestId) return;
			contractOptions = [];
			contractsLoadError = error instanceof Error ? error.message : m.failed_load_contracts();
		} finally {
			if (requestId === contractRequestId) isLoadingContracts = false;
		}
	}

	function retryContractOptions() {
		if (editingInvoice) void loadContractOptions(editingInvoice.clientId);
	}

	function enterEditMode(invoice: NonNullable<InvoiceDetailLoadResult['invoice']>) {
		saveInvoiceError = null;
		const draft: UpdateInvoiceInput = {
			issue_date: toDateInputValue(invoice.issueDate),
			due_date: toDateInputValue(invoice.dueDate),
			status: invoice.status,
			warning_count: invoice.warningCount,
			lines: invoice.canEditLines ? invoice.lines.map(toDraftLine) : []
		};
		reset({ data: draft });
		originalLineOrder = invoice.lines.map((line) => line.id);
		editingInvoice = structuredClone(invoice);
		initialDraftSnapshot = JSON.stringify($form);
		isEditMode = true;
		void loadContractOptions(invoice.clientId);
	}

	function cancelEditMode() {
		if (isSavingInvoice || $submitting) return;
		if (hasUnsavedChanges && !confirm(m.discard_invoice_changes_confirmation())) return;
		contractRequestId += 1;
		reset({ data: initialEditData });
		contractOptions = [];
		isEditMode = false;
		editingInvoice = null;
		saveInvoiceError = null;
	}

	function requestCloseEditor() {
		cancelEditMode();
		return false;
	}

	function toUpdateLinePayload(
		line: DraftLine,
		issueDate: string,
		dueDate: string
	): UpdateInvoiceLineRequest {
		const normalizedPeriodStart = line.period_start || issueDate;
		const normalizedPeriodEnd = line.period_end || normalizedPeriodStart || dueDate;

		return {
			line_type: line.line_type,
			contract_id: line.line_type === 'contract' ? line.contract_id || null : null,
			service_type: line.service_type,
			description: line.description,
			period_start: toRFC3339(normalizedPeriodStart),
			period_end: toRFC3339(normalizedPeriodEnd),
			quantity: Number(line.quantity),
			unit: line.unit,
			unit_price: Number(line.unit_price),
			vat_rate: Number(line.vat_rate)
		};
	}

	function buildUpdatePayload(values: UpdateInvoiceInput) {
		const payload: UpdateInvoiceRequest = {
			issue_date: toRFC3339(values.issue_date),
			due_date: toRFC3339(values.due_date),
			status: values.status,
			warning_count: values.warning_count,
			lines: values.lines.map((line) =>
				toUpdateLinePayload(line, values.issue_date, values.due_date)
			)
		};

		return payload;
	}

	async function handleSaveInvoice(
		invoice: NonNullable<InvoiceDetailLoadResult['invoice']>,
		values: UpdateInvoiceInput
	) {
		if (isSavingInvoice) return;
		saveInvoiceError = null;
		if (invoice.canEditLines && invoice.lineUpdateMode === 'appointment_linked') {
			if (values.lines.length !== invoice.lines.length) {
				saveInvoiceError = m.appointment_linked_requires_same_line_count();
				return;
			}

			const currentOrder = values.lines.map((line) => line.id);
			if (JSON.stringify(currentOrder) !== JSON.stringify(originalLineOrder)) {
				saveInvoiceError = m.appointment_linked_requires_original_line_order();
				return;
			}

			for (let i = 0; i < values.lines.length; i += 1) {
				const currentLine = values.lines[i];
				const originalLine = invoice.lines[i];
				if (
					currentLine.line_type !== originalLine.line_type ||
					(currentLine.contract_id || null) !== (originalLine.contract_id ?? null) ||
					currentLine.service_type !== originalLine.service_type
				) {
					saveInvoiceError = m.appointment_linked_no_line_changes();
					return;
				}
			}
		}

		const payload: UpdateInvoiceRequest = buildUpdatePayload(values);

		if (!invoice.canEditLines) {
			delete payload.lines;
		}
		if (payload.lines && payload.lines.length === 0) {
			saveInvoiceError = m.at_least_one_line_required();
			return;
		}

		isSavingInvoice = true;
		try {
			await updateInvoice(invoice.id, payload);
			reset({ data: initialEditData });
			contractRequestId += 1;
			contractOptions = [];
			saveInvoiceError = null;
			isEditMode = false;
			editingInvoice = null;
			await refreshInvoiceSummary();
		} catch (error) {
			saveInvoiceError = error instanceof Error ? error.message : m.failed_update_invoice();
		} finally {
			isSavingInvoice = false;
		}
	}

	let expandedPaymentIds = new SvelteSet<string>();

	function togglePaymentDetails(id: string) {
		if (expandedPaymentIds.has(id)) {
			expandedPaymentIds.delete(id);
		} else {
			expandedPaymentIds.add(id);
		}
	}

	function openAddPaymentSheet(invoice: InvoiceDetailView) {
		paymentSheetInvoice = {
			id: invoice.id,
			currency: invoice.currency,
			defaultAmount: calculateBalance(invoice.grossTotalAmount, invoice.paymentCompletionPrc)
		};
		isAddPaymentSheetOpen = true;
	}

	async function openEditPaymentSheet(payment: InvoicePaymentView, invoice: InvoiceDetailView) {
		paymentSheetInvoice = {
			id: invoice.id,
			currency: invoice.currency,
			defaultAmount: calculateBalance(invoice.grossTotalAmount, invoice.paymentCompletionPrc)
		};
		selectedPayment = payment;
		isEditPaymentSheetOpen = false;
		editSheetKey += 1;
		await tick();
		isEditPaymentSheetOpen = true;
	}

	const handleDownloadPdf = async (invoiceId: string) => {
		if (isGeneratingPdf) return;

		downloadPdfError = null;
		isGeneratingPdf = true;

		try {
			const response = await generateInvoicePdf(invoiceId);
			const fileUrl = response.data.file_url;

			if (!fileUrl) {
				throw new Error(m.failed_generate_invoice_pdf());
			}

			window.open(fileUrl, '_blank', 'noopener,noreferrer');
			await refreshInvoice();
		} catch (error) {
			downloadPdfError = error instanceof Error ? error.message : m.failed_generate_invoice_pdf();
		} finally {
			isGeneratingPdf = false;
		}
	};

	const handleCreditInvoice = async (invoiceId: string) => {
		if (isCreditingInvoice) return;

		creditInvoiceError = null;
		isCreditingInvoice = true;

		try {
			const response = await creditInvoice(invoiceId);
			const creditNoteId = response.data.id;

			if (!creditNoteId) {
				throw new Error(m.credit_note_missing_id());
			}

			await Promise.all([invalidate('app:invoices:list'), invalidate('app:invoices:stats')]);
			await goto(resolve('/(app)/finances/invoices/[id]', { id: creditNoteId }));
		} catch (error) {
			creditInvoiceError = error instanceof Error ? error.message : m.failed_create_credit_note();
		} finally {
			isCreditingInvoice = false;
		}
	};
</script>

<svelte:head>
	<title>{m.invoice_details()} | MaiCare</title>
</svelte:head>

<div class="space-y-6">
	{#await invoiceDataPromise}
		<!-- Loading State -->
		<div class="flex items-center justify-between">
			<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
			<div class="flex gap-2">
				<div class="h-9 w-32 animate-pulse rounded-xl bg-border/70"></div>
			</div>
		</div>
		<header
			class="h-32 w-full animate-pulse rounded-3xl border border-border bg-surface/50"
		></header>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each [1, 2, 3, 4] as i (i)}
				<div class="h-32 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
			{/each}
		</div>
		<div class="grid gap-6 lg:grid-cols-[2.5fr_1fr]">
			<div class="space-y-6">
				<div class="h-96 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
				<div class="h-64 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
			</div>
			<div class="space-y-6">
				<div class="h-48 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
			</div>
		</div>
	{:then { invoice, loadError }}
		{#if loadError}
			<InlineErrorBanner message={loadError} onRetry={refreshInvoice} />
		{/if}

		{#if invoice}
			<!-- Actions -->
			<div class="flex items-center justify-end">
				<div class="flex flex-wrap items-center gap-2">
					{#if !isEditMode}
						<PermissionGuard permission={PERMISSIONS.INVOICE.UPDATE}>
							<Button
								variant="ghost"
								class="h-9 gap-2 px-4 ring-1 ring-border"
								onclick={() => enterEditMode(invoice)}
								disabled={!invoice.canEditMeta && !invoice.canEditLines}
							>
								<Pencil class="h-4 w-4" />
								{m.edit_invoice_details()}
							</Button>
						</PermissionGuard>
					{/if}
					{#if invoice.invoiceType !== 'credit_note'}
						<PermissionGuard permission={PERMISSIONS.INVOICE.CREATE}>
							<Button
								variant="destructive"
								class="h-9 gap-2 px-4"
								onclick={() => handleCreditInvoice(invoice.id)}
								disabled={isCreditingInvoice || isEditMode}
							>
								<XCircle class="h-4 w-4" />
								{isCreditingInvoice ? m.creating_credit() : m.create_credit_note()}
							</Button>
						</PermissionGuard>
					{/if}
					<Button
						class="h-9 gap-2 px-4 shadow-md shadow-brand/20"
						onclick={() => handleDownloadPdf(invoice.id)}
						disabled={isGeneratingPdf || isEditMode}
					>
						<Download class="h-4 w-4" />
						{isGeneratingPdf ? m.generating_pdf() : m.download_pdf()}
					</Button>
				</div>
			</div>
			{#if downloadPdfError}
				<InlineErrorBanner
					message={downloadPdfError}
					onRetry={() => handleDownloadPdf(invoice.id)}
				/>
			{/if}
			{#if creditInvoiceError}
				<InlineErrorBanner
					message={creditInvoiceError}
					onRetry={() => handleCreditInvoice(invoice.id)}
				/>
			{/if}
			{#if !isEditMode && invoice.lineEditBlockReason}
				<div
					class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-strong"
				>
					{invoice.lineEditBlockReason}
				</div>
			{/if}

			{@const meta = statusMeta[invoice.status as keyof typeof statusMeta] || statusMeta.concept}

			<!-- Minimal Header -->
			<header
				class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm"
			>
				<div class="flex flex-wrap items-center justify-between gap-4">
					<div class="flex items-center gap-4">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg text-brand ring-1 ring-border"
						>
							<Receipt class="h-6 w-6 text-brand/70" />
						</div>
						<div>
							<div class="flex flex-wrap items-center gap-3">
								<h1 class="text-2xl font-bold tracking-tight text-text">{m.invoice_details()}</h1>
								<span
									class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide uppercase {meta.className}"
								>
									<meta.icon class="h-3.5 w-3.5" />
									{meta.label}
								</span>
							</div>
							<p
								class="mt-1 flex items-center gap-2 text-sm font-medium text-text-muted capitalize"
							>
								{invoice.invoiceType === 'credit_note' ? m.credit_note() : m.standard()}
								{m.invoice_label()}
								<span class="h-1 w-1 rounded-full bg-border"></span>
								{m.invoice_number_label()}:
								<span class="font-mono text-xs">{invoice.invoiceNumber}</span>
							</p>
						</div>
					</div>

					<div class="flex gap-6 text-sm">
						<div>
							<p class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">
								{m.source()}
							</p>
							<p class="mt-0.5 flex items-center gap-1.5 font-semibold text-text capitalize">
								{#if invoice.source === 'auto'}
									<span
										class="flex h-4 w-4 items-center justify-center rounded-full bg-brand/10 text-brand"
										><CheckCircle2 class="h-2.5 w-2.5" /></span
									>
								{:else if invoice.source === 'manual'}
									<span
										class="flex h-4 w-4 items-center justify-center rounded-full bg-warning/10 text-warning-strong"
										><User class="h-2.5 w-2.5" /></span
									>
								{:else}
									<span
										class="flex h-4 w-4 items-center justify-center rounded-full bg-secondary/10 text-secondary-strong"
										><ArrowRightLeft class="h-2.5 w-2.5" /></span
									>
								{/if}
								{invoiceSourceLabel(invoice.source)}
							</p>
						</div>
						<div class="border-l border-border pl-6">
							<p class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">
								{m.issued_date()}
							</p>
							<p class="mt-0.5 font-semibold text-text">{formatDate(invoice.issueDate)}</p>
						</div>
						<div class="border-l border-border pl-6">
							<p class="text-[10px] font-bold tracking-wider text-error-strong uppercase">
								{m.due_date_label()}
							</p>
							<p class="mt-0.5 font-semibold text-error-strong">{formatDate(invoice.dueDate)}</p>
						</div>
					</div>
				</div>
			</header>

			<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label={m.net_total()}
					value={formatCurrency(invoice.netTotalAmount, invoice.currency)}
					description={m.pre_vat_subtotal()}
					icon={Banknote}
				/>
				<StatCard
					label={m.vat_amount()}
					value={formatCurrency(invoice.vatTotalAmount, invoice.currency)}
					description={m.total_tax()}
					icon={Euro}
					color="blue"
				/>
				<StatCard
					label={m.gross_total()}
					value={formatCurrency(invoice.grossTotalAmount, invoice.currency)}
					description={m.including_vat()}
					icon={Wallet}
					color="brand"
				/>
				<StatCard
					label={m.balance_due()}
					value={formatCurrency(
						calculateBalance(invoice.grossTotalAmount, invoice.paymentCompletionPrc),
						invoice.currency
					)}
					description={m.percent_paid({ percent: invoice.paymentCompletionPrc.toFixed(1) })}
					icon={FileWarning}
					color="amber"
				/>
			</section>

			<div class="grid gap-6 lg:grid-cols-[2.5fr_1fr]">
				<!-- Main Column (The Invoice Document) -->
				<div class="space-y-6">
					<!-- Detailed Invoice View -->
					<section class="rounded-3xl border border-border bg-surface p-8 shadow-sm">
						<!-- From / To Headers -->
						<div class="mb-10 grid gap-8 border-b border-border/50 pb-8 sm:grid-cols-2">
							<!-- Billed To (Sender) -->
							<div>
								<div
									class="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-widest text-text-subtle uppercase"
								>
									<Building2 class="h-3.5 w-3.5" />
									{m.billed_to()}
								</div>
								<div class="space-y-1">
									<p class="text-lg font-bold text-text">
										{invoice.senderName || m.unknown_sender()}
									</p>
									{#if invoice.senderKvkNumber}
										<p class="text-sm text-text-muted">
											{m.kvk_label()}: <span class="text-text">{invoice.senderKvkNumber}</span>
										</p>
									{/if}
									{#if invoice.senderBtwNumber}
										<p class="text-sm text-text-muted">
											{m.btw_label()}: <span class="text-text">{invoice.senderBtwNumber}</span>
										</p>
									{/if}
								</div>
							</div>

							<!-- For Client -->
							<div>
								<div
									class="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-widest text-text-subtle uppercase"
								>
									<User class="h-3.5 w-3.5" />
									{m.for_client()}
								</div>
								<div class="space-y-1">
									<p class="text-lg font-bold text-text">
										{invoice.clientFirstName}
										{invoice.clientLastName}
									</p>
									<p class="text-sm text-text-muted">
										{m.client_number()}:
										<span class="font-mono text-xs text-text">{invoice.clientId.slice(0, 8)}</span>
									</p>
									<a
										href={resolve('/(app)/clients/[id]', { id: invoice.clientId })}
										class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
									>
										{m.view_profile()}
										<ChevronRight class="h-3 w-3" />
									</a>
								</div>
							</div>
						</div>

						<!-- Invoice Lines -->
						<div class="mb-6 flex items-center gap-2">
							<h2 class="text-lg font-bold text-text">{m.service_breakdown()}</h2>
							{#if invoice.periodStart}
								<span class="rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-muted">
									{m.period_range({
										start: formatDate(invoice.periodStart),
										end: invoice.periodEnd ? formatDate(invoice.periodEnd) : m.ongoing_label()
									})}
								</span>
							{/if}
						</div>

						<div class="overflow-x-auto rounded-xl border border-border ring-1 ring-border">
							<table class="w-full text-left text-sm">
								<thead class="bg-bg text-xs font-bold text-text-subtle uppercase">
									<tr class="border-b border-border">
										<th class="px-4 py-3 font-semibold">{m.description()}</th>
										<th class="px-4 py-3 font-semibold">{m.qty_col()}</th>
										<th class="px-4 py-3 font-semibold">{m.unit_price()}</th>
										<th class="px-4 py-3 font-semibold">{m.net_amt_col()}</th>
										<th class="px-4 py-3 font-semibold">{m.vat_percent()}</th>
										<th class="px-4 py-3 text-right font-semibold">{m.gross_amt_col()}</th>
										<th class="w-10 px-4 py-3 text-center"
											><span class="sr-only">{m.contract_type_label()}</span></th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-border/50 bg-surface">
									{#each invoice.lines as line (line.id)}
										<tr class="group/row transition-colors hover:bg-bg">
											<td class="px-4 py-3">
												<p class="font-medium text-text">{line.description}</p>
												<div class="mt-1 flex items-center gap-2 text-[11px] text-text-muted">
													<span class="capitalize">{line.service_type}</span>
													{#if line.period_start}
														<span class="inline-block h-1 w-1 rounded-full bg-border"></span>
														<span
															>{formatDate(line.period_start)} - {formatDate(line.period_end) ||
																m.not_available_short()}</span
														>
													{/if}
												</div>
											</td>
											<td class="px-4 py-3 text-text"
												>{line.quantity}
												<span class="text-xs text-text-muted">{line.unit}</span></td
											>
											<td class="px-4 py-3 text-text"
												>{formatCurrency(line.unit_price, invoice.currency)}</td
											>
											<td class="px-4 py-3 text-text"
												>{formatCurrency(line.net_amount, invoice.currency)}</td
											>
											<td class="px-4 py-3 text-text">{line.vat_rate}%</td>
											<td class="px-4 py-3 text-right font-semibold text-text"
												>{formatCurrency(line.gross_amount, invoice.currency)}</td
											>
											<td class="px-4 py-3">
												{#if line.contract_id}
													<a
														href={resolve('/(app)/contracts/[id]', { id: line.contract_id })}
														class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand transition-all hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-brand"
														title={m.view_contract()}
														aria-label={m.view_contract()}
													>
														<FileText class="h-4 w-4" />
													</a>
												{/if}
											</td>
										</tr>
									{:else}
										<tr>
											<td colspan="7" class="px-4 py-8 text-center text-text-muted"
												>{m.no_invoice_lines()}</td
											>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Totals Summary -->
						<div class="mt-6 flex flex-col items-end">
							<div class="w-full max-w-sm space-y-3 rounded-2xl bg-bg p-6">
								<div class="flex justify-between text-sm">
									<span class="text-text-muted">{m.subtotal_pre_vat()}</span>
									<span class="font-medium text-text"
										>{formatCurrency(
											isEditMode && editingInvoice?.canEditLines
												? draftTotals.net
												: invoice.netTotalAmount,
											invoice.currency
										)}</span
									>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-4 text-sm">
									<span class="text-text-muted">{m.vat_total()}</span>
									<span class="font-medium text-text"
										>{formatCurrency(
											isEditMode && editingInvoice?.canEditLines
												? draftTotals.vat
												: invoice.vatTotalAmount,
											invoice.currency
										)}</span
									>
								</div>
								<div class="flex justify-between pt-1 text-base font-bold">
									<span class="text-text">{m.total_gross()}</span>
									<span class="text-brand"
										>{formatCurrency(
											isEditMode && editingInvoice?.canEditLines
												? draftTotals.gross
												: invoice.grossTotalAmount,
											invoice.currency
										)}</span
									>
								</div>
								<div class="mt-1 flex justify-between border-t border-border/50 pt-3 text-sm">
									<span class="text-text-muted">{m.amount_paid()}</span>
									<span class="font-medium text-success-strong">
										{formatCurrency(
											invoice.grossTotalAmount -
												calculateBalance(invoice.grossTotalAmount, invoice.paymentCompletionPrc),
											invoice.currency
										)}
									</span>
								</div>
								<div class="flex justify-between pt-2 text-base font-bold text-warning-strong">
									<span>{m.balance_due()}</span>
									<span
										>{formatCurrency(
											calculateBalance(invoice.grossTotalAmount, invoice.paymentCompletionPrc),
											invoice.currency
										)}</span
									>
								</div>
							</div>
						</div>
					</section>
				</div>

				<!-- Sidebar Column -->
				<aside class="space-y-6">
					<!-- Payments List -->
					{#if invoice.invoiceType !== 'credit_note'}
						<PermissionGuard permission={PERMISSIONS.INVOICE.PAYMENT_VIEW}>
							<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
								<div
									class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
								>
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
										>
											<Banknote class="h-5 w-5" />
										</div>
										<div>
											<h2 class="text-lg font-bold text-text">{m.payments()}</h2>
											<p class="text-xs text-text-subtle">{m.transactions_for_invoice()}</p>
										</div>
									</div>
									<PermissionGuard permission={PERMISSIONS.INVOICE.PAYMENT_CREATE}>
										<Button
											class="h-9 w-full shrink-0 gap-2 px-4 text-xs shadow-md shadow-brand/20 sm:w-auto"
											onclick={() => openAddPaymentSheet(invoice)}
											disabled={isEditMode}
										>
											{m.add_payment()}
										</Button>
									</PermissionGuard>
								</div>

								{#await data.paymentsData}
									<div class="h-24 animate-pulse rounded-2xl bg-border/50"></div>
								{:then { payments, loadError: paymentsLoadError }}
									{#if paymentsLoadError}
										<InlineErrorBanner message={paymentsLoadError} onRetry={refreshPayments} />
									{:else if payments.length > 0}
										<div class="divide-y divide-border/40">
											{#each payments as payment (payment.id)}
												{@const isExpanded = expandedPaymentIds.has(payment.id)}
												{@const pMeta =
													paymentStatusMeta[payment.status as keyof typeof paymentStatusMeta] ||
													paymentStatusMeta.pending}
												<div class="py-3 last:pb-0">
													<div class="flex items-center justify-between gap-2">
														<div class="flex items-center gap-3">
															<button
																class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg transition-colors hover:bg-brand/10 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
																onclick={() => togglePaymentDetails(payment.id)}
																aria-label={isExpanded ? m.hide_details() : m.show_details()}
															>
																<ChevronRight
																	class="h-3.5 w-3.5 transition-transform {isExpanded
																		? 'rotate-90'
																		: ''}"
																/>
															</button>
															<div>
																<p class="text-sm font-bold text-text">
																	{formatCurrency(payment.amount, invoice.currency)}
																</p>
																<span
																	class="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase {pMeta.className}"
																>
																	{pMeta.label}
																</span>
															</div>
														</div>
														<div class="flex items-center gap-1.5">
															<PermissionGuard permission={PERMISSIONS.INVOICE.PAYMENT_UPDATE}>
																<Button
																	variant="ghost"
																	class="h-8 w-8 rounded-lg border border-border bg-surface !p-0 text-brand shadow-sm transition-all hover:border-brand hover:bg-brand hover:text-white"
																	onclick={() => openEditPaymentSheet(payment, invoice)}
																	disabled={isEditMode}
																	aria-label={m.edit_payment()}
																>
																	<SquarePen class="h-4 w-4" />
																</Button>
															</PermissionGuard>
														</div>
													</div>

													{#if isExpanded}
														<div
															class="mt-3 ml-11 space-y-2 rounded-xl bg-bg p-3 text-[11px] text-text-muted ring-1 ring-border"
														>
															<div class="flex items-center justify-between">
																<span class="text-text-subtle">{m.processed_on()}</span>
																<span class="font-medium text-text"
																	>{formatDateTime(payment.date)}</span
																>
															</div>
															<div class="flex items-center justify-between">
																<span class="text-text-subtle">{m.payment_method()}</span>
																<span class="font-medium text-text"
																	>{paymentMethodLabels[payment.method] ?? payment.method}</span
																>
															</div>
															{#if payment.reference}
																<div class="flex items-center justify-between gap-4">
																	<span class="shrink-0 text-text-subtle">{m.ref_label()}</span>
																	<span class="truncate font-mono font-medium text-text"
																		>{payment.reference}</span
																	>
																</div>
															{/if}
														</div>
													{/if}
												</div>
											{/each}
										</div>
									{:else}
										<div
											class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg px-6 py-12 text-center"
										>
											<Banknote class="mb-3 h-8 w-8 text-brand/30" />
											<h3 class="text-sm font-bold text-text">{m.no_payments_recorded()}</h3>
											<p class="mt-1 text-xs text-text-muted">
												{m.no_transactions_linked()}
											</p>
										</div>
									{/if}
								{/await}
							</section>
						</PermissionGuard>
					{/if}

					<!-- Timeline/Meta Info -->
					<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
						<h3
							class="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-text-subtle uppercase"
						>
							<Clock class="h-4 w-4" />
							{m.timeline_status()}
						</h3>

						<div class="space-y-6">
							<!-- Timeline dots -->
							<div
								class="relative space-y-4 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-border/50"
							>
								<div class="relative flex items-start gap-4">
									<div
										class="mt-1.5 h-4 w-4 shrink-0 rounded-full border-[3px] border-surface bg-brand ring-1 ring-border"
									></div>
									<div>
										<p class="text-xs font-medium text-text-muted">{m.created()}</p>
										<p class="text-sm font-semibold text-text">
											{formatDateTime(invoice.createdAt)}
										</p>
									</div>
								</div>
								<div class="relative flex items-start gap-4">
									<div
										class="mt-1.5 h-4 w-4 shrink-0 rounded-full border-[3px] border-surface bg-brand/50 ring-1 ring-border"
									></div>
									<div>
										<p class="text-xs font-medium text-text-muted">{m.last_update()}</p>
										<p class="text-sm font-semibold text-text">
											{formatDateTime(invoice.updatedAt)}
										</p>
									</div>
								</div>
							</div>
						</div>
					</section>
				</aside>
			</div>
		{:else}
			<div
				class="rounded-3xl border border-border bg-surface p-12 text-center text-sm text-text-muted shadow-sm"
			>
				<Info class="mx-auto h-8 w-8 text-text-subtle opacity-50" />
				<p class="mt-4">{m.invoice_not_available()}</p>
				<Button variant="ghost" class="mt-6 ring-1 ring-border" onclick={refreshInvoice}
					>{m.retry()}</Button
				>
			</div>
		{/if}
	{/await}
	{#if paymentSheetInvoice}
		<PermissionGuard permission={PERMISSIONS.INVOICE.PAYMENT_CREATE}>
			<AddInvoicePaymentSheet
				bind:open={isAddPaymentSheetOpen}
				invoiceId={paymentSheetInvoice.id}
				currency={paymentSheetInvoice.currency}
				defaultAmount={paymentSheetInvoice.defaultAmount}
				onCreated={refreshInvoiceResources}
			/>
		</PermissionGuard>
		{#if selectedPayment}
			<PermissionGuard permission={PERMISSIONS.INVOICE.PAYMENT_UPDATE}>
				{#key `${selectedPayment.id}-${editSheetKey}`}
					<EditInvoicePaymentSheet
						bind:open={isEditPaymentSheetOpen}
						invoiceId={paymentSheetInvoice.id}
						payment={selectedPayment}
						currency={paymentSheetInvoice.currency}
						onUpdated={async () => {
							await refreshInvoiceResources();
							selectedPayment = null;
						}}
					/>
				{/key}
			</PermissionGuard>
		{/if}
	{/if}
	{#if editingInvoice}
		<Sheet
			bind:open={isEditMode}
			title={m.edit_invoice_details()}
			size="full"
			class="invoice-editor"
			onRequestClose={requestCloseEditor}
		>
			{#if saveInvoiceError}
				<InlineErrorBanner message={saveInvoiceError} />
			{/if}
			<form id="invoice-edit-form" use:enhance novalidate>
				<section class="mb-6 space-y-5 rounded-2xl border border-border bg-bg p-5">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-bold text-text">{m.edit_invoice_details()}</h2>
						{#if editingInvoice.lineUpdateMode === 'appointment_linked'}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs font-semibold text-warning-strong"
							>
								<Lock class="h-3 w-3" />
								{m.appointment_linked_line_rules()}
							</span>
						{/if}
					</div>
					{#if !editingInvoice.canEditLines && editingInvoice.lineEditBlockReason}
						<p
							class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-strong"
						>
							{editingInvoice.lineEditBlockReason}
						</p>
					{/if}

					<div class="grid gap-4 sm:grid-cols-2">
						<fieldset
							disabled={!editingInvoice.canEditMeta}
							class:opacity-60={!editingInvoice.canEditMeta}
						>
							<DatePicker
								label={m.issue_date()}
								bind:value={$form.issue_date}
								error={formatFormError($errors.issue_date)}
							/>
						</fieldset>
						<fieldset
							disabled={!editingInvoice.canEditMeta}
							class:opacity-60={!editingInvoice.canEditMeta}
						>
							<DatePicker
								label={m.due_date_label()}
								bind:value={$form.due_date}
								error={formatFormError($errors.due_date)}
							/>
						</fieldset>
						<Select
							label={m.status()}
							options={invoiceStatuses}
							bind:value={$form.status}
							error={formatFormError($errors.status)}
							disabled={!editingInvoice.canEditMeta}
						/>
						<Input
							label={m.warning_count()}
							type="number"
							min="0"
							step="1"
							bind:value={$form.warning_count}
							error={formatFormError($errors.warning_count)}
							disabled={!editingInvoice.canEditMeta}
						/>
					</div>
					{#if contractsLoadError}
						<InlineErrorBanner message={contractsLoadError} onRetry={retryContractOptions} />
					{/if}

					<div class="flex items-center justify-between">
						<h3 class="text-sm font-bold text-text">{m.invoice_lines()}</h3>
						<Button
							variant="ghost"
							class="h-8 gap-2 text-xs ring-1 ring-border"
							onclick={addDraftLine}
							disabled={!editingInvoice.canEditLines ||
								editingInvoice.lineUpdateMode === 'appointment_linked' ||
								isLoadingContracts}
						>
							<Plus class="h-3.5 w-3.5" />
							{m.add_line()}
						</Button>
					</div>

					<div class="space-y-4">
						{#each draftLines as line, index (line.id)}
							<div class="rounded-2xl border border-border bg-surface p-4">
								<div class="mb-4 flex items-center justify-between">
									<p class="text-xs font-bold tracking-wide text-text-subtle uppercase">
										{m.line_number({ number: index + 1 })}
									</p>
									<Button
										variant="ghost"
										class="h-7 w-7 !p-0 text-error-strong"
										onclick={() => removeDraftLine(line.id)}
										aria-label={`${m.remove()} ${m.line_number({ number: index + 1 })}`}
										disabled={!editingInvoice.canEditLines ||
											editingInvoice.lineUpdateMode === 'appointment_linked'}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>

								<div class="grid gap-4 sm:grid-cols-12">
									<div class="sm:col-span-3">
										<Select
											label={m.line_type_label()}
											options={lineTypeOptions}
											bind:value={$form.lines[index].line_type}
											disabled={!editingInvoice.canEditLines ||
												editingInvoice.lineUpdateMode === 'appointment_linked'}
										/>
									</div>
									{#if line.line_type === 'contract'}
										<div class="sm:col-span-5">
											<Select
												label={m.contract_type_label()}
												options={contractOptions}
												bind:value={$form.lines[index].contract_id}
												error={formatFormError($errors.lines?.[index]?.contract_id)}
												disabled={!editingInvoice.canEditLines ||
													editingInvoice.lineUpdateMode === 'appointment_linked' ||
													contractOptions.length === 0}
											/>
										</div>
										<div class="sm:col-span-4">
											<Input
												label={m.description()}
												bind:value={$form.lines[index].description}
												disabled={!editingInvoice.canEditLines}
											/>
										</div>
									{:else}
										<div class="sm:col-span-3">
											<Select
												label={m.service_type_label()}
												options={serviceTypeOptions}
												bind:value={$form.lines[index].service_type}
												disabled={!editingInvoice.canEditLines ||
													editingInvoice.lineUpdateMode === 'appointment_linked'}
											/>
										</div>
										<div class="sm:col-span-6">
											<Input
												label={m.description()}
												bind:value={$form.lines[index].description}
												disabled={!editingInvoice.canEditLines}
											/>
										</div>
									{/if}

									<div class="sm:col-span-3">
										<Input
											label={m.quantity_label()}
											type="number"
											min="0.01"
											step="0.01"
											bind:value={$form.lines[index].quantity}
											error={formatFormError($errors.lines?.[index]?.quantity)}
											disabled={!editingInvoice.canEditLines}
										/>
									</div>
									<div class="sm:col-span-3">
										<Select
											label={m.unit()}
											options={unitOptions}
											bind:value={$form.lines[index].unit}
											disabled={!editingInvoice.canEditLines}
										/>
									</div>
									<div class="sm:col-span-3">
										<Input
											label={m.unit_price()}
											type="number"
											min="0"
											step="0.01"
											bind:value={$form.lines[index].unit_price}
											error={formatFormError($errors.lines?.[index]?.unit_price)}
											disabled={!editingInvoice.canEditLines}
										/>
									</div>
									<div class="sm:col-span-3">
										<Input
											label={m.vat_percent()}
											type="number"
											min="0"
											max="100"
											step="0.1"
											bind:value={$form.lines[index].vat_rate}
											error={formatFormError($errors.lines?.[index]?.vat_rate)}
											disabled={!editingInvoice.canEditLines}
										/>
									</div>
									<div class="sm:col-span-6">
										<fieldset
											disabled={!editingInvoice.canEditLines}
											class:opacity-60={!editingInvoice.canEditLines}
										>
											<DatePicker
												label={m.period_start_label()}
												bind:value={$form.lines[index].period_start}
												error={formatFormError($errors.lines?.[index]?.period_start)}
											/>
										</fieldset>
									</div>
									<div class="sm:col-span-6">
										<fieldset
											disabled={!editingInvoice.canEditLines}
											class:opacity-60={!editingInvoice.canEditLines}
										>
											<DatePicker
												label={m.period_end_label()}
												bind:value={$form.lines[index].period_end}
												error={formatFormError($errors.lines?.[index]?.period_end)}
											/>
										</fieldset>
									</div>
								</div>
								<div class="mt-4 flex justify-end text-sm font-semibold text-text">
									{m.line_gross_label()}
									{formatCurrency(lineGross(line), editingInvoice.currency)}
								</div>
							</div>
						{/each}
					</div>
				</section>
			</form>

			{#snippet footer()}
				<div class="flex justify-end gap-2">
					<Button variant="ghost" onclick={cancelEditMode} disabled={isSavingInvoice || $submitting}
						>{m.cancel_edit()}</Button
					>
					<Button type="submit" form="invoice-edit-form" isLoading={isSavingInvoice || $submitting}
						>{m.save_changes()}</Button
					>
				</div>
			{/snippet}
		</Sheet>
	{/if}
</div>
