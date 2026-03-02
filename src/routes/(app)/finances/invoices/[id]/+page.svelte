<script lang="ts">
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
		SquarePen
	} from 'lucide-svelte';
	import type { InvoiceDetailLoadResult, InvoicePaymentView } from './+page';
	import { creditInvoice, generateInvoicePdf } from '$lib/api/invoices';
	import AddInvoicePaymentSheet from '$lib/components/forms/AddInvoicePaymentSheet.svelte';
	import EditInvoicePaymentSheet from '$lib/components/forms/EditInvoicePaymentSheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

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

	const statusMeta = {
		paid: {
			label: 'Paid',
			className: 'bg-emerald-600 text-white border-emerald-700/50 shadow-sm shadow-emerald-700/20',
			icon: CheckCircle2
		},
		outstanding: {
			label: 'Outstanding',
			className: 'bg-amber-500 text-white border-amber-600/50 shadow-sm shadow-amber-600/20',
			icon: Clock
		},
		partially_paid: {
			label: 'Partially Paid',
			className: 'bg-blue-600 text-white border-blue-700/50 shadow-sm shadow-blue-700/20',
			icon: Wallet
		},
		expired: {
			label: 'Expired',
			className: 'bg-rose-600 text-white border-rose-700/50 shadow-sm shadow-rose-700/20',
			icon: FileWarning
		},
		overpaid: {
			label: 'Overpaid',
			className: 'bg-purple-600 text-white border-purple-700/50 shadow-sm shadow-purple-700/20',
			icon: BadgeEuro
		},
		canceled: {
			label: 'Canceled',
			className: 'bg-zinc-500 text-white border-zinc-600/50 shadow-sm shadow-zinc-600/20',
			icon: XCircle
		},
		concept: {
			label: 'Concept',
			className: 'bg-slate-400 text-white border-slate-500/50 shadow-sm shadow-slate-500/20',
			icon: FileText
		},
		imported: {
			label: 'Imported',
			className: 'bg-indigo-500 text-white border-indigo-600/50 shadow-sm shadow-indigo-600/20',
			icon: ArrowRightLeft
		}
	} as const;

	const paymentStatusMeta = {
		completed: {
			label: 'Completed',
			className:
				'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
		},
		pending: {
			label: 'Pending',
			className:
				'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
		},
		failed: {
			label: 'Failed',
			className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400'
		},
		reversed: {
			label: 'Reversed',
			className: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800/70 dark:text-zinc-300'
		},
		refunded: {
			label: 'Refunded',
			className:
				'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300'
		}
	} as const;

	const formatDate = (date: string | null | undefined) => {
		if (!date) return '—';
		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(date));
	};

	const formatDateTime = (date: string | null | undefined) => {
		if (!date) return '—';
		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	};

	const formatCurrency = (amount: number | null | undefined, currencyCode: string = 'EUR') => {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('nl-NL', {
			style: 'currency',
			currency: currencyCode
		}).format(amount);
	};

	const calculateBalance = (gross: number, prc: number) => {
		return Math.max(0, gross - gross * (prc / 100));
	};

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
				throw new Error('Failed to generate invoice PDF.');
			}

			window.open(fileUrl, '_blank', 'noopener,noreferrer');
		} catch (error) {
			downloadPdfError = error instanceof Error ? error.message : 'Failed to generate invoice PDF.';
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
				throw new Error('Credit note created but no invoice ID was returned.');
			}

			await goto(resolve(`/finances/invoices/${creditNoteId}`));
		} catch (error) {
			creditInvoiceError = error instanceof Error ? error.message : 'Failed to create credit note.';
		} finally {
			isCreditingInvoice = false;
		}
	};
</script>

<svelte:head>
	<title>Invoice Details | MaiCare</title>
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
					<Button variant="ghost" class="h-9 gap-2 px-4 ring-1 ring-border">
						<FileText class="h-4 w-4" />
						Edit Invoice Details
					</Button>
					{#if invoice.invoiceType !== 'credit_note'}
						<Button
							variant="destructive"
							class="h-9 gap-2 px-4 shadow-md shadow-rose-900/10"
							onclick={() => handleCreditInvoice(invoice.id)}
							disabled={isCreditingInvoice}
						>
							<XCircle class="h-4 w-4" />
							{isCreditingInvoice ? 'Creating Credit...' : 'Create Credit Note'}
						</Button>
					{/if}
					<Button
						class="h-9 gap-2 px-4 shadow-md shadow-brand/20"
						onclick={() => handleDownloadPdf(invoice.id)}
						disabled={isGeneratingPdf}
					>
						<Download class="h-4 w-4" />
						{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
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
								<h1 class="text-2xl font-bold tracking-tight text-text">Invoice Details</h1>
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
								{invoice.invoiceType.replace('_', ' ')} Invoice
								<span class="h-1 w-1 rounded-full bg-border"></span>
								Invoice Number: <span class="font-mono text-xs">{invoice.invoiceNumber}</span>
							</p>
						</div>
					</div>

					<div class="flex gap-6 text-sm">
						<div>
							<p class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">Source</p>
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
								Issued Date
							</p>
							<p class="mt-0.5 font-semibold text-text">{formatDate(invoice.issueDate)}</p>
						</div>
						<div class="border-l border-border pl-6">
							<p class="text-[10px] font-bold tracking-wider text-rose-500 uppercase">Due Date</p>
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
							Net Total
						</div>
						<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
							{formatCurrency(invoice.netTotalAmount, invoice.currency)}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">Pre-VAT Subtotal</p>
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
							VAT Amount
						</div>
						<div
							class="mt-2 text-2xl font-bold tracking-tight text-blue-600 sm:text-3xl dark:text-blue-400"
						>
							{formatCurrency(invoice.vatTotalAmount, invoice.currency)}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">Total Tax</p>
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
							Gross Total
						</div>
						<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
							{formatCurrency(invoice.grossTotalAmount, invoice.currency)}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">Including VAT</p>
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
							Balance Due
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
							{invoice.paymentCompletionPrc.toFixed(1)}% paid
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
									Billed To
								</div>
								<div class="space-y-1">
									<p class="text-lg font-bold text-text">
										{invoice.senderName || 'Unknown Sender'}
									</p>
									{#if invoice.senderKvkNumber}
										<p class="text-sm text-text-muted">
											KVK: <span class="text-text">{invoice.senderKvkNumber}</span>
										</p>
									{/if}
									{#if invoice.senderBtwNumber}
										<p class="text-sm text-text-muted">
											BTW: <span class="text-text">{invoice.senderBtwNumber}</span>
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
									For Client
								</div>
								<div class="space-y-1">
									<p class="text-lg font-bold text-text">
										{invoice.clientFirstName}
										{invoice.clientLastName}
									</p>
									<p class="text-sm text-text-muted">
										Client Number: <span class="font-mono text-xs text-text"
											>{invoice.clientId.slice(0, 8)}</span
										>
									</p>
									<a
										href={resolve(`/clients/${invoice.clientId}`)}
										class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
									>
										View Profile <ChevronRight class="h-3 w-3" />
									</a>
								</div>
							</div>
						</div>

						<!-- Invoice Lines -->
						<div class="mb-6 flex items-center gap-2">
							<h2 class="text-lg font-bold text-text">Service Breakdown</h2>
							{#if invoice.periodStart}
								<span
									class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-text-muted dark:bg-zinc-800"
								>
									Period: {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd) ||
										'Ongoing'}
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
										<th class="px-4 py-3 font-semibold">Description</th>
										<th class="px-4 py-3 font-semibold">Qty</th>
										<th class="px-4 py-3 font-semibold">Unit Price</th>
										<th class="px-4 py-3 font-semibold">Net Amt</th>
										<th class="px-4 py-3 font-semibold">VAT %</th>
										<th class="px-4 py-3 text-right font-semibold">Gross Amt</th>
										<th class="w-10 px-4 py-3 text-center"><span class="sr-only">Contract</span></th
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
																'...'}</span
														>
													{/if}
												</div>
											</td>
											<td class="px-4 py-3 text-text">
												{line.quantity} <span class="text-xs text-text-muted">{line.unit}</span>
											</td>
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
														href={resolve(`/contracts/${line.contract_id}`)}
														class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand transition-all hover:bg-brand hover:text-white"
														title="View Contract"
													>
														<FileText class="h-4 w-4" />
													</a>
												{/if}
											</td>
										</tr>
									{:else}
										<tr>
											<td colspan="7" class="px-4 py-8 text-center text-text-muted">
												No invoice lines found.
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Totals Summary -->
						<div class="mt-6 flex flex-col items-end">
							<div class="w-full max-w-sm space-y-3 rounded-2xl bg-zinc-50 p-6 dark:bg-zinc-900/40">
								<div class="flex justify-between text-sm">
									<span class="text-text-muted">Subtotal (Pre-VAT)</span>
									<span class="font-medium text-text"
										>{formatCurrency(invoice.netTotalAmount, invoice.currency)}</span
									>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-4 text-sm">
									<span class="text-text-muted">VAT Total</span>
									<span class="font-medium text-text"
										>{formatCurrency(invoice.vatTotalAmount, invoice.currency)}</span
									>
								</div>
								<div class="flex justify-between pt-1 text-base font-bold">
									<span class="text-text">Total (Gross)</span>
									<span class="text-brand"
										>{formatCurrency(invoice.grossTotalAmount, invoice.currency)}</span
									>
								</div>
								<div class="mt-1 flex justify-between border-t border-border/50 pt-3 text-sm">
									<span class="text-text-muted">Amount Paid</span>
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
									<span>Balance Due</span>
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
										<h2 class="text-lg font-bold text-text">Payments</h2>
										<p class="text-xs text-text-subtle">Transactions for this invoice</p>
									</div>
								</div>
								<Button
									class="h-9 w-full shrink-0 gap-2 px-4 text-xs shadow-md shadow-brand/20 sm:w-auto"
									onclick={() => (isAddPaymentSheetOpen = true)}
								>
									+ Payment
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
														aria-label={isExpanded ? 'Hide details' : 'Show details'}
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
														aria-label="Edit payment"
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
														<span class="text-text-subtle">Processed on</span>
														<span class="font-medium text-text">{formatDateTime(payment.date)}</span
														>
													</div>
													<div class="flex items-center justify-between">
														<span class="text-text-subtle">Payment Method</span>
														<span class="font-medium text-text capitalize">{payment.method}</span>
													</div>
													{#if payment.reference}
														<div class="flex items-center justify-between gap-4">
															<span class="shrink-0 text-text-subtle">Ref</span>
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
									<h3 class="text-sm font-bold text-text">No payments recorded yet</h3>
									<p class="mt-1 text-xs text-text-muted">
										There are currently no transactions linked to this invoice.
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
							Timeline & Status
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
										<p class="text-xs font-medium text-text-muted">Created</p>
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
										<p class="text-xs font-medium text-text-muted">Last Updated</p>
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
				<p class="mt-4">Invoice details not available.</p>
				<Button variant="ghost" class="mt-6 ring-1 ring-border" onclick={() => invalidateAll()}
					>Retry</Button
				>
			</div>
		{/if}
	{/await}
</div>
