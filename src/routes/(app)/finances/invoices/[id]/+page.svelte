<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { goto, invalidateAll } from '$app/navigation';
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
		Save,
		Pencil,
		Plus,
		Trash2,
		Lock
	} from 'lucide-svelte';
	import type { InvoiceDetailLoadResult, InvoicePaymentView } from './+page';
	import { creditInvoice, generateInvoicePdf, updateInvoice } from '$lib/api/invoices';
	import { listClientContracts } from '$lib/api/clients';
	import AddInvoicePaymentSheet from '$lib/components/forms/AddInvoicePaymentSheet.svelte';
	import EditInvoicePaymentSheet from '$lib/components/forms/EditInvoicePaymentSheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ListClientContractsResponse } from '$lib/types/api/contracts';
	import type { UpdateInvoiceRequest, UpdateInvoiceLineRequest } from '$lib/types/api/invoices';

	let { data } = $props<{
		data: {
			invoiceData: Promise<InvoiceDetailLoadResult>;
		};
	}>();

	const invoiceDataPromise = $derived(data.invoiceData);
	let isGeneratingPdf = $state(false);
	let downloadPdfError = $state<string | null>(null);
	let isCreditingInvoice = $state(false);
	let creditInvoiceError = $state<string | null>(null);
	let isAddPaymentSheetOpen = $state(false);
	let isEditPaymentSheetOpen = $state(false);
	let selectedPayment = $state<InvoicePaymentView | null>(null);
	let editSheetKey = $state(0);
	let isEditMode = $state(false);
	let isSavingInvoice = $state(false);
	let saveInvoiceError = $state<string | null>(null);
	let showLineValidationErrors = $state(false);
	let draftIssueDate = $state('');
	let draftDueDate = $state('');
	let draftStatus = $state('concept');
	let draftWarningCount = $state(0);
	let draftLines = $state<DraftLine[]>([]);
	let contractOptions = $state<Array<{ value: string; label: string }>>([]);
	let contractsLoadError = $state<string | null>(null);
	let isLoadingContracts = $state(false);
	let originalLineOrder = $state<string[]>([]);

	interface DraftLine {
		id: string;
		line_type: 'contract' | 'manual' | 'adjustment';
		contract_id: string;
		service_type: string;
		description: string;
		period_start: string;
		period_end: string;
		quantity: number;
		unit: string;
		unit_price: number;
		vat_rate: number;
	}

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
			className: 'bg-emerald-600 text-white border-emerald-700/50 shadow-sm shadow-emerald-700/20',
			icon: CheckCircle2
		},
		outstanding: {
			label: m.outstanding_status(),
			className: 'bg-amber-500 text-white border-amber-600/50 shadow-sm shadow-amber-600/20',
			icon: Clock
		},
		partially_paid: {
			label: m.partially_paid(),
			className: 'bg-blue-600 text-white border-blue-700/50 shadow-sm shadow-blue-700/20',
			icon: Wallet
		},
		expired: {
			label: m.expired(),
			className: 'bg-rose-600 text-white border-rose-700/50 shadow-sm shadow-rose-700/20',
			icon: FileWarning
		},
		overpaid: {
			label: m.overpaid(),
			className: 'bg-purple-600 text-white border-purple-700/50 shadow-sm shadow-purple-700/20',
			icon: BadgeEuro
		},
		canceled: {
			label: m.canceled(),
			className: 'bg-zinc-500 text-white border-zinc-600/50 shadow-sm shadow-zinc-600/20',
			icon: XCircle
		},
		concept: {
			label: m.concept(),
			className: 'bg-slate-400 text-white border-slate-500/50 shadow-sm shadow-slate-500/20',
			icon: FileText
		},
		imported: {
			label: m.imported_status(),
			className: 'bg-indigo-500 text-white border-indigo-600/50 shadow-sm shadow-indigo-600/20',
			icon: ArrowRightLeft
		}
	});

	const paymentStatusMeta = $derived({
		completed: {
			label: m.completed(),
			className:
				'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
		},
		pending: {
			label: m.pending(),
			className:
				'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
		},
		failed: {
			label: m.failed(),
			className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400'
		},
		reversed: {
			label: m.reversed(),
			className: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800/70 dark:text-zinc-300'
		},
		refunded: {
			label: m.refunded(),
			className:
				'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300'
		}
	});

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const formatDate = (date: string | null | undefined) => {
		if (!date) return m.not_available_short();
		return new Intl.DateTimeFormat(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(date));
	};

	const formatDateTime = (date: string | null | undefined) => {
		if (!date) return m.not_available_short();
		return new Intl.DateTimeFormat(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
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
		return new Date(value).toISOString().split('T')[0];
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

	const lineValidationErrors = $derived.by(() => {
		const errors: Record<string, string> = {};
		for (const line of draftLines) {
			if (line.line_type === 'contract' && !line.contract_id) {
				errors[line.id] = m.select_contract_for_line();
			}
		}
		return errors;
	});

	function toDraftLine(line: any): DraftLine {
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
			period_start: draftIssueDate,
			period_end: draftDueDate,
			quantity: 1,
			unit: 'hour',
			unit_price: 0,
			vat_rate: 21
		};
	}

	function addDraftLine() {
		draftLines = [...draftLines, createEmptyDraftLine()];
	}

	function removeDraftLine(id: string) {
		draftLines = draftLines.filter((line) => line.id !== id);
	}

	async function loadContractOptions(clientId: string) {
		contractsLoadError = null;
		isLoadingContracts = true;
		try {
			const res = await listClientContracts(clientId, 1, 100);
			contractOptions = (res.data.results ?? []).map((contract: ListClientContractsResponse) => ({
				value: contract.id,
				label: contract.care_name
			}));
		} catch (error) {
			contractOptions = [];
			contractsLoadError = error instanceof Error ? error.message : m.failed_load_contracts();
		} finally {
			isLoadingContracts = false;
		}
	}

	function enterEditMode(invoice: NonNullable<InvoiceDetailLoadResult['invoice']>) {
		saveInvoiceError = null;
		showLineValidationErrors = false;
		draftIssueDate = toDateInputValue(invoice.issueDate);
		draftDueDate = toDateInputValue(invoice.dueDate);
		draftStatus = invoice.status;
		draftWarningCount = invoice.warningCount;
		draftLines = invoice.lines.map(toDraftLine);
		originalLineOrder = invoice.lines.map((line) => line.id);
		isEditMode = true;
		void loadContractOptions(invoice.clientId);
	}

	function cancelEditMode(invoice: NonNullable<InvoiceDetailLoadResult['invoice']>) {
		enterEditMode(invoice);
		isEditMode = false;
		saveInvoiceError = null;
	}

	function toUpdateLinePayload(line: DraftLine): UpdateInvoiceLineRequest {
		const normalizedPeriodStart = line.period_start || draftIssueDate;
		const normalizedPeriodEnd = line.period_end || normalizedPeriodStart || draftDueDate;

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

	function buildUpdatePayload() {
		const payload: UpdateInvoiceRequest = {
			issue_date: toRFC3339(draftIssueDate),
			due_date: toRFC3339(draftDueDate),
			status: draftStatus as UpdateInvoiceRequest['status'],
			warning_count: Number(draftWarningCount),
			extra_content: {},
			lines: draftLines.map(toUpdateLinePayload)
		};

		return payload;
	}

	async function handleSaveInvoice(invoice: NonNullable<InvoiceDetailLoadResult['invoice']>) {
		if (isSavingInvoice) return;
		saveInvoiceError = null;
		showLineValidationErrors = true;

		if (Object.keys(lineValidationErrors).length > 0) {
			saveInvoiceError = m.fix_line_fields_before_saving();
			return;
		}

		if (invoice.lineUpdateMode === 'appointment_linked') {
			if (draftLines.length !== invoice.lines.length) {
				saveInvoiceError = m.appointment_linked_requires_same_line_count();
				return;
			}

			const currentOrder = draftLines.map((line) => line.id);
			if (JSON.stringify(currentOrder) !== JSON.stringify(originalLineOrder)) {
				saveInvoiceError = m.appointment_linked_requires_original_line_order();
				return;
			}

			for (let i = 0; i < draftLines.length; i += 1) {
				const currentLine = draftLines[i];
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

		const payload: UpdateInvoiceRequest = buildUpdatePayload();

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
			isEditMode = false;
			await invalidateAll();
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

	async function openEditPaymentSheet(payment: InvoicePaymentView) {
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
			{#each [1, 2, 3, 4] as _, i (i)}
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
	{:then { invoice, loadError, paymentsLoadError }}
		{#if loadError}
			<InlineErrorBanner message={loadError} onRetry={() => invalidateAll()} />
		{/if}

		{#if invoice}
			<!-- Actions -->
			<div class="flex items-center justify-end">
				<div class="flex flex-wrap items-center gap-2">
					{#if isEditMode}
						<Button
							variant="ghost"
							class="h-9 gap-2 px-4 ring-1 ring-border"
							onclick={() => cancelEditMode(invoice)}
							disabled={isSavingInvoice}
						>
							{m.cancel_edit()}
						</Button>
						<Button
							class="h-9 gap-2 px-4 shadow-md shadow-brand/20"
							onclick={() => handleSaveInvoice(invoice)}
							isLoading={isSavingInvoice}
						>
							<Save class="h-4 w-4" />
							{m.save_changes()}
						</Button>
					{:else}
						<Button
							variant="ghost"
							class="h-9 gap-2 px-4 ring-1 ring-border"
							onclick={() => enterEditMode(invoice)}
							disabled={!invoice.canEditMeta && !invoice.canEditLines}
						>
							<Pencil class="h-4 w-4" />
							{m.edit_invoice_details()}
						</Button>
					{/if}
					{#if invoice.invoiceType !== 'credit_note'}
						<Button
							variant="destructive"
							class="h-9 gap-2 px-4 shadow-md shadow-rose-900/10"
							onclick={() => handleCreditInvoice(invoice.id)}
							disabled={isCreditingInvoice}
						>
							<XCircle class="h-4 w-4" />
							{isCreditingInvoice ? m.creating_credit() : m.create_credit_note()}
						</Button>
					{/if}
					<Button
						class="h-9 gap-2 px-4 shadow-md shadow-brand/20"
						onclick={() => handleDownloadPdf(invoice.id)}
						disabled={isGeneratingPdf}
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
			{#if isEditMode && saveInvoiceError}
				<InlineErrorBanner message={saveInvoiceError} />
			{/if}
			{#if !isEditMode && invoice.lineEditBlockReason}
				<div
					class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700"
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
							class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 text-xl font-bold text-zinc-700 shadow-inner ring-1 ring-black/5 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-300 dark:ring-white/10"
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
								{invoice.invoiceType.replace('_', ' ')}
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
										class="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/10 text-amber-600"
										><User class="h-2.5 w-2.5" /></span
									>
								{:else}
									<span
										class="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500/10 text-purple-600"
										><ArrowRightLeft class="h-2.5 w-2.5" /></span
									>
								{/if}
								{invoice.source}
							</p>
						</div>
						<div class="border-l border-border pl-6">
							<p class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">
								{m.issued_date()}
							</p>
							<p class="mt-0.5 font-semibold text-text">{formatDate(invoice.issueDate)}</p>
						</div>
						<div class="border-l border-border pl-6">
							<p class="text-[10px] font-bold tracking-wider text-rose-500 uppercase">
								{m.due_date_label()}
							</p>
							<p class="mt-0.5 font-semibold text-rose-600">{formatDate(invoice.dueDate)}</p>
						</div>
					</div>
				</div>
			</header>

			<!-- KPI Cards (Listing style with background icons) -->
			<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div
					class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
				>
					<div
						class="absolute -right-4 -bottom-4 text-zinc-900 opacity-[0.03] transition-opacity group-hover:opacity-10 dark:text-white dark:opacity-5"
					>
						<Banknote class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
							{m.net_total()}
						</div>
						<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
							{formatCurrency(invoice.netTotalAmount, invoice.currency)}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">{m.pre_vat_subtotal()}</p>
					</div>
				</div>

				<div
					class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-blue-500/30"
				>
					<div
						class="absolute -right-4 -bottom-4 text-blue-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
					>
						<Euro class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
							{m.vat_amount()}
						</div>
						<div
							class="mt-2 text-2xl font-bold tracking-tight text-blue-600 sm:text-3xl dark:text-blue-400"
						>
							{formatCurrency(invoice.vatTotalAmount, invoice.currency)}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">{m.total_tax()}</p>
					</div>
				</div>

				<div
					class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm ring-1 ring-brand/10 transition-colors hover:border-brand/30"
				>
					<div
						class="absolute -right-4 -bottom-4 text-brand opacity-[0.03] transition-opacity group-hover:opacity-10"
					>
						<Wallet class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-brand uppercase">
							{m.gross_total()}
						</div>
						<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
							{formatCurrency(invoice.grossTotalAmount, invoice.currency)}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">{m.including_vat()}</p>
					</div>
				</div>

				<div
					class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-amber-500/30"
				>
					<div
						class="absolute -right-4 -bottom-4 text-amber-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
					>
						<FileWarning class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
							{m.balance_due()}
						</div>
						<div class="mt-2 flex items-baseline gap-2">
							<span
								class="text-2xl font-bold tracking-tight text-amber-600 sm:text-3xl dark:text-amber-500"
							>
								{formatCurrency(
									calculateBalance(invoice.grossTotalAmount, invoice.paymentCompletionPrc),
									invoice.currency
								)}
							</span>
						</div>
						<div class="mt-3 w-full overflow-hidden rounded-full bg-border/50">
							<div
								class="h-1.5 rounded-full bg-emerald-500 transition-all"
								style="width: {Math.min(invoice.paymentCompletionPrc, 100)}%"
							></div>
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">
							{m.percent_paid({ percent: invoice.paymentCompletionPrc.toFixed(1) })}
						</p>
					</div>
				</div>
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

						{#if isEditMode}
							<section class="mb-6 space-y-5 rounded-2xl border border-border bg-zinc-50/40 p-5">
								<div class="flex items-center justify-between">
									<h2 class="text-base font-bold text-text">{m.edit_invoice_details()}</h2>
									{#if invoice.lineUpdateMode === 'appointment_linked'}
										<span
											class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700"
										>
											<Lock class="h-3 w-3" />
											{m.appointment_linked_line_rules()}
										</span>
									{/if}
								</div>

								<div class="grid gap-4 sm:grid-cols-2">
									<div class={!invoice.canEditMeta ? 'pointer-events-none opacity-60' : ''}>
										<DatePicker label={m.issue_date()} bind:value={draftIssueDate} />
									</div>
									<div class={!invoice.canEditMeta ? 'pointer-events-none opacity-60' : ''}>
										<DatePicker label={m.due_date_label()} bind:value={draftDueDate} />
									</div>
									<Select
										label={m.status()}
										options={invoiceStatuses}
										bind:value={draftStatus}
										className={!invoice.canEditMeta ? 'pointer-events-none opacity-60' : ''}
									/>
									<Input
										label={m.warning_count()}
										type="number"
										bind:value={draftWarningCount}
										disabled={!invoice.canEditMeta}
									/>
								</div>
								{#if contractsLoadError}
									<p class="text-xs font-medium text-rose-600">{contractsLoadError}</p>
								{/if}

								<div class="flex items-center justify-between">
									<h3 class="text-sm font-bold text-text">{m.invoice_lines()}</h3>
									<Button
										variant="ghost"
										class="h-8 gap-2 text-xs ring-1 ring-border"
										onclick={addDraftLine}
										disabled={!invoice.canEditLines ||
											invoice.lineUpdateMode === 'appointment_linked' ||
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
													class="h-7 w-7 !p-0 text-rose-600"
													onclick={() => removeDraftLine(line.id)}
													disabled={!invoice.canEditLines ||
														invoice.lineUpdateMode === 'appointment_linked'}
												>
													<Trash2 class="h-4 w-4" />
												</Button>
											</div>

											<div class="grid gap-4 sm:grid-cols-12">
												<div class="sm:col-span-3">
													<Select
														label={m.line_type_label()}
														options={lineTypeOptions}
														bind:value={line.line_type}
														className={!invoice.canEditLines ||
														invoice.lineUpdateMode === 'appointment_linked'
															? 'pointer-events-none opacity-60'
															: ''}
													/>
												</div>
												{#if line.line_type === 'contract'}
													<div class="sm:col-span-5">
														<Select
															label={m.contract_type_label()}
															options={contractOptions}
															bind:value={line.contract_id}
															className={!invoice.canEditLines ||
															invoice.lineUpdateMode === 'appointment_linked' ||
															contractOptions.length === 0
																? 'pointer-events-none opacity-60'
																: ''}
														/>
														{#if showLineValidationErrors && lineValidationErrors[line.id]}
															<p class="mt-1 text-xs font-medium text-rose-600">
																{lineValidationErrors[line.id]}
															</p>
														{/if}
													</div>
													<div class="sm:col-span-4">
														<Input
															label={m.description()}
															bind:value={line.description}
															disabled={!invoice.canEditLines}
														/>
													</div>
												{:else}
													<div class="sm:col-span-3">
														<Select
															label={m.service_type_label()}
															options={serviceTypeOptions}
															bind:value={line.service_type}
															className={!invoice.canEditLines ||
															invoice.lineUpdateMode === 'appointment_linked'
																? 'pointer-events-none opacity-60'
																: ''}
														/>
													</div>
													<div class="sm:col-span-6">
														<Input
															label={m.description()}
															bind:value={line.description}
															disabled={!invoice.canEditLines}
														/>
													</div>
												{/if}

												<div class="sm:col-span-3">
													<Input
														label={m.quantity_label()}
														type="number"
														bind:value={line.quantity}
														disabled={!invoice.canEditLines}
													/>
												</div>
												<div class="sm:col-span-3">
													<Select
														label={m.unit()}
														options={unitOptions}
														bind:value={line.unit}
														className={!invoice.canEditLines
															? 'opacity-60 pointer-events-none'
															: ''}
													/>
												</div>
												<div class="sm:col-span-3">
													<Input
														label={m.unit_price()}
														type="number"
														bind:value={line.unit_price}
														disabled={!invoice.canEditLines}
													/>
												</div>
												<div class="sm:col-span-3">
													<Input
														label={m.vat_percent()}
														type="number"
														bind:value={line.vat_rate}
														disabled={!invoice.canEditLines}
													/>
												</div>
												<div class="sm:col-span-6">
													<div
														class={!invoice.canEditLines ? 'pointer-events-none opacity-60' : ''}
													>
														<DatePicker
															label={m.period_start_label()}
															bind:value={line.period_start}
														/>
													</div>
												</div>
												<div class="sm:col-span-6">
													<div
														class={!invoice.canEditLines ? 'pointer-events-none opacity-60' : ''}
													>
														<DatePicker label={m.period_end_label()} bind:value={line.period_end} />
													</div>
												</div>
											</div>
											<div class="mt-4 flex justify-end text-sm font-semibold text-text">
												{m.line_gross_label()}
												{formatCurrency(lineGross(line), invoice.currency)}
											</div>
										</div>
									{/each}
								</div>
							</section>
						{:else}
							<!-- Invoice Lines -->
							<div class="mb-6 flex items-center gap-2">
								<h2 class="text-lg font-bold text-text">{m.service_breakdown()}</h2>
								{#if invoice.periodStart}
									<span
										class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-text-muted dark:bg-zinc-800"
									>
										{m.period_range({
											start: formatDate(invoice.periodStart),
											end: invoice.periodEnd ? formatDate(invoice.periodEnd) : m.ongoing_label()
										})}
									</span>
								{/if}
							</div>

							<div
								class="overflow-x-auto rounded-xl border border-border ring-1 ring-black/5 dark:ring-white/5"
							>
								<table class="w-full text-left text-sm">
									<thead
										class="bg-zinc-50/50 text-xs font-bold text-text-subtle uppercase dark:bg-zinc-900/50"
									>
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
									<tbody class="divide-y divide-border/50 bg-white dark:bg-zinc-900">
										{#each invoice.lines as line (line.id)}
											<tr
												class="group/row transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
											>
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
															class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand transition-all hover:bg-brand hover:text-white"
															title={m.view_contract()}
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
						{/if}

						<!-- Totals Summary -->
						<div class="mt-6 flex flex-col items-end">
							<div class="w-full max-w-sm space-y-3 rounded-2xl bg-zinc-50 p-6 dark:bg-zinc-900/40">
								<div class="flex justify-between text-sm">
									<span class="text-text-muted">{m.subtotal_pre_vat()}</span>
									<span class="font-medium text-text"
										>{formatCurrency(
											isEditMode ? draftTotals.net : invoice.netTotalAmount,
											invoice.currency
										)}</span
									>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-4 text-sm">
									<span class="text-text-muted">{m.vat_total()}</span>
									<span class="font-medium text-text"
										>{formatCurrency(
											isEditMode ? draftTotals.vat : invoice.vatTotalAmount,
											invoice.currency
										)}</span
									>
								</div>
								<div class="flex justify-between pt-1 text-base font-bold">
									<span class="text-text">{m.total_gross()}</span>
									<span class="text-brand"
										>{formatCurrency(
											isEditMode ? draftTotals.gross : invoice.grossTotalAmount,
											invoice.currency
										)}</span
									>
								</div>
								<div class="mt-1 flex justify-between border-t border-border/50 pt-3 text-sm">
									<span class="text-text-muted">{m.amount_paid()}</span>
									<span class="font-medium text-emerald-600 dark:text-emerald-500">
										{formatCurrency(
											invoice.grossTotalAmount -
												calculateBalance(invoice.grossTotalAmount, invoice.paymentCompletionPrc),
											invoice.currency
										)}
									</span>
								</div>
								<div
									class="flex justify-between pt-2 text-base font-bold text-amber-600 dark:text-amber-500"
								>
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
						<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
							<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
								<Button
									class="h-9 w-full shrink-0 gap-2 px-4 text-xs shadow-md shadow-brand/20 sm:w-auto"
									onclick={() => (isAddPaymentSheetOpen = true)}
								>
									{m.add_payment()}
								</Button>
							</div>

							{#if paymentsLoadError}
								<InlineErrorBanner message={paymentsLoadError} onRetry={() => invalidateAll()} />
							{/if}

							{#if invoice.payments && invoice.payments.length > 0}
								<div class="divide-y divide-border/40">
									{#each invoice.payments as payment (payment.id)}
										{@const isExpanded = expandedPaymentIds.has(payment.id)}
										{@const pMeta =
											paymentStatusMeta[payment.status as keyof typeof paymentStatusMeta] ||
											paymentStatusMeta.pending}
										<div class="py-3 last:pb-0">
											<div class="flex items-center justify-between gap-2">
												<div class="flex items-center gap-3">
													<button
														class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 transition-colors hover:bg-brand/10 hover:text-brand dark:bg-zinc-800"
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
													<Button
														variant="ghost"
														class="h-8 w-8 rounded-lg border border-border bg-surface !p-0 text-brand shadow-sm transition-all hover:border-brand hover:bg-brand hover:text-white"
														onclick={() => openEditPaymentSheet(payment)}
														aria-label={m.edit_payment()}
													>
														<SquarePen class="h-4 w-4" />
													</Button>
												</div>
											</div>

											{#if isExpanded}
												<div
													class="mt-3 ml-11 space-y-2 rounded-xl bg-zinc-50/50 p-3 text-[11px] text-text-muted ring-1 ring-black/5 dark:bg-zinc-900/40 dark:ring-white/5"
												>
													<div class="flex items-center justify-between">
														<span class="text-text-subtle">{m.processed_on()}</span>
														<span class="font-medium text-text">{formatDateTime(payment.date)}</span
														>
													</div>
													<div class="flex items-center justify-between">
														<span class="text-text-subtle">{m.payment_method()}</span>
														<span class="font-medium text-text capitalize">{payment.method}</span>
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
									class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-zinc-50/30 px-6 py-12 text-center dark:bg-zinc-900/20"
								>
									<Banknote class="mb-3 h-8 w-8 text-brand/30" />
									<h3 class="text-sm font-bold text-text">{m.no_payments_recorded()}</h3>
									<p class="mt-1 text-xs text-text-muted">
										{m.no_transactions_linked()}
									</p>
								</div>
							{/if}
						</section>
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

			{#if invoice.invoiceType !== 'credit_note'}
				<AddInvoicePaymentSheet
					bind:open={isAddPaymentSheetOpen}
					invoiceId={invoice.id}
					currency={invoice.currency}
					defaultAmount={calculateBalance(invoice.grossTotalAmount, invoice.paymentCompletionPrc)}
					onCreated={() => invalidateAll()}
				/>
				{#if selectedPayment}
					{#key `${selectedPayment.id}-${editSheetKey}`}
						<EditInvoicePaymentSheet
							bind:open={isEditPaymentSheetOpen}
							invoiceId={invoice.id}
							payment={selectedPayment}
							currency={invoice.currency}
							onUpdated={async () => {
								await invalidateAll();
								selectedPayment = null;
							}}
						/>
					{/key}
				{/if}
			{/if}
		{:else}
			<div
				class="rounded-3xl border border-border bg-surface p-12 text-center text-sm text-text-muted shadow-sm"
			>
				<Info class="mx-auto h-8 w-8 text-text-subtle opacity-50" />
				<p class="mt-4">{m.invoice_not_available()}</p>
				<Button variant="ghost" class="mt-6 ring-1 ring-border" onclick={() => invalidateAll()}
					>{m.retry()}</Button
				>
			</div>
		{/if}
	{/await}
</div>
