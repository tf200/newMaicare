<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import {
		BadgeEuro,
		FileText,
		Search,
		Eye,
		Download,
		AlertCircle,
		CheckCircle2,
		Clock,
		Wallet,
		CreditCard
	} from 'lucide-svelte';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type { DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Filters from '$lib/components/ui/FilterDropdown.svelte';
	import type {
		ListInvoicesResponse,
		InvoicesFilters,
		InvoiceStatus
	} from '$lib/types/api/invoices';
	import type { InvoicesLoadResult } from './+page';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: InvoicesFilters;
			};
			invoicesData: Promise<InvoicesLoadResult>;
		};
	}>();

	const invoicesDataPromise = $derived.by(() => data.invoicesData);
	const initial = $derived.by(() => data.initial);
	const currentPage = $derived.by(() => initial.page);
	const pageSize = $derived.by(() => initial.pageSize);

	const appliedSearch = $derived.by(() => (initial.filters.q ?? '').trim());
	let searchTerm = $state('');

	$effect(() => {
		if (searchTerm !== appliedSearch) {
			searchTerm = appliedSearch;
		}
	});

	type UIFilters = InvoicesFilters & {
		source_auto?: boolean;
		source_manual?: boolean;
		source_imported?: boolean;
		type_standard?: boolean;
		type_credit?: boolean;
		[key: string]: any;
	};

	const defaultFilters: UIFilters = {
		status: undefined,
		q: '',
		locked: undefined,
		start_date: undefined,
		end_date: undefined,
		source_auto: undefined,
		source_manual: undefined,
		source_imported: undefined,
		type_standard: undefined,
		type_credit: undefined
	};

	let filters = $derived.by(() => {
		const f: UIFilters = {
			...defaultFilters,
			...initial.filters
		};
		if (initial.filters.source === 'auto') f.source_auto = true;
		if (initial.filters.source === 'manual') f.source_manual = true;
		if (initial.filters.source === 'imported') f.source_imported = true;

		if (initial.filters.invoice_type === 'standard') f.type_standard = true;
		if (initial.filters.invoice_type === 'credit_note') f.type_credit = true;
		return f;
	});

	const filterGroups = $derived([
		{
			label: m.properties(),
			items: [{ key: 'locked', label: m.locked() }]
		},
		{
			label: m.source(),
			items: [
				{ key: 'source_auto', label: m.auto() },
				{ key: 'source_manual', label: m.manual() },
				{ key: 'source_imported', label: m.imported() }
			]
		},
		{
			label: m.type(),
			items: [
				{ key: 'type_standard', label: m.standard() },
				{ key: 'type_credit', label: m.credit_note() }
			]
		},
		{
			label: m.issue_date(),
			items: [
				{ key: 'start_date', label: m.from(), type: 'date' },
				{ key: 'end_date', label: m.to(), type: 'date' }
			]
		}
	] as any[]);

	const statusMeta: Record<InvoiceStatus, { label: string; className: string }> = $derived({
		outstanding: {
			label: m.outstanding_status(),
			className: 'bg-amber-500 text-white border border-amber-600/60 shadow-sm shadow-amber-600/30'
		},
		partially_paid: {
			label: m.partially_paid(),
			className: 'bg-blue-600 text-white border border-blue-700/60 shadow-sm shadow-blue-700/30'
		},
		paid: {
			label: m.paid(),
			className:
				'bg-emerald-600 text-white border border-emerald-700/60 shadow-sm shadow-emerald-700/30'
		},
		expired: {
			label: m.expired(),
			className: 'bg-rose-600 text-white border border-rose-700/60 shadow-sm shadow-rose-700/30'
		},
		overpaid: {
			label: m.overpaid(),
			className:
				'bg-purple-600 text-white border border-purple-700/60 shadow-sm shadow-purple-700/30'
		},
		imported: {
			label: m.imported(),
			className: 'bg-zinc-600 text-white border border-zinc-700/60 shadow-sm shadow-zinc-700/30'
		},
		concept: {
			label: m.concept(),
			className: 'bg-zinc-100 text-zinc-600 border border-zinc-300 shadow-sm shadow-zinc-200/30'
		},
		canceled: {
			label: m.canceled(),
			className: 'bg-zinc-800 text-zinc-300 border border-zinc-900 shadow-sm shadow-zinc-900/30'
		}
	});

	const columns: DataTableColumn[] = $derived([
		{ key: 'invoice', label: m.invoice_col(), headerClass: 'pl-14' },
		{ key: 'client', label: m.client() },
		{ key: 'amount', label: m.amount(), align: 'right' },
		{ key: 'status', label: m.status(), width: '130px' },
		{ key: 'dates', label: m.dates_col() },
		{ key: 'actions', label: '', align: 'right', width: '80px' }
	]);

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const formatCurrency = (amount: number, currency: string = 'EUR') => {
		return new Intl.NumberFormat(resolveLocale(), { style: 'currency', currency }).format(amount);
	};

	const formatDate = (value: string) =>
		new Date(value).toLocaleDateString(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});

	const buildQuery = (pageValue: number, nextFilters: UIFilters) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));

		if (nextFilters.status) params.set('status', nextFilters.status);
		if (nextFilters.q) params.set('q', nextFilters.q);

		if (nextFilters.locked !== undefined) params.set('locked', String(nextFilters.locked));
		if (nextFilters.start_date) params.set('start_date', nextFilters.start_date);
		if (nextFilters.end_date) params.set('end_date', nextFilters.end_date);

		if (nextFilters.source_auto) params.set('source', 'auto');
		else if (nextFilters.source_manual) params.set('source', 'manual');
		else if (nextFilters.source_imported) params.set('source', 'imported');

		if (nextFilters.type_standard) params.set('invoice_type', 'standard');
		else if (nextFilters.type_credit) params.set('invoice_type', 'credit_note');

		return params.toString();
	};

	const setFilters = (nextFilters: UIFilters) => {
		updateQuery(1, nextFilters);
	};

	const updateQuery = (pageValue: number, nextFilters: UIFilters) => {
		const nextQuery = buildQuery(pageValue, nextFilters);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const handleFilterUpdate = (nextFilters: any) => {
		if (nextFilters.source_auto && !filters.source_auto) {
			nextFilters.source_manual = undefined;
			nextFilters.source_imported = undefined;
		} else if (nextFilters.source_manual && !filters.source_manual) {
			nextFilters.source_auto = undefined;
			nextFilters.source_imported = undefined;
		} else if (nextFilters.source_imported && !filters.source_imported) {
			nextFilters.source_auto = undefined;
			nextFilters.source_manual = undefined;
		}

		if (nextFilters.type_standard && !filters.type_standard) {
			nextFilters.type_credit = undefined;
		} else if (nextFilters.type_credit && !filters.type_credit) {
			nextFilters.type_standard = undefined;
		}

		setFilters(nextFilters as UIFilters);
	};

	const applySearch = () => {
		const nextSearch = searchTerm.trim();
		setFilters({ ...filters, q: nextSearch });
	};

	const clearFilters = () => {
		searchTerm = '';
		updateQuery(1, { ...defaultFilters });
	};
</script>

{#snippet tableFilters()}
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder={m.search_invoices_placeholder()}
				bind:value={searchTerm}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				onkeydown={(event) => {
					if (event.key === 'Enter') applySearch();
				}}
				onblur={applySearch}
			/>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				onclick={() => setFilters({ ...filters, status: undefined })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {!filters.status
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.all()}
			</button>
			<button
				onclick={() => setFilters({ ...filters, status: 'outstanding' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.status ===
				'outstanding'
					? 'bg-amber-500 text-white shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.outstanding_status()}
			</button>
			<button
				onclick={() => setFilters({ ...filters, status: 'paid' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.status === 'paid'
					? 'bg-emerald-600 text-white shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.paid()}
			</button>
			<button
				onclick={() => setFilters({ ...filters, status: 'expired' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.status ===
				'expired'
					? 'bg-rose-600 text-white shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.overdue_status()}
			</button>
		</div>

		<div class="hidden h-6 w-px bg-border sm:block"></div>

		<Filters
			{filters}
			groups={filterGroups}
			title={m.filter_invoices()}
			onUpdate={handleFilterUpdate}
			onClear={clearFilters}
		/>
	</div>
{/snippet}

<svelte:head>
	<title>{m.invoices()} | MaiCare</title>
</svelte:head>

{#snippet invoiceCell(row: ListInvoicesResponse)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<FileText class="h-5 w-5" />
		</div>
		<div>
			<div class="flex items-center gap-2">
				<p class="text-sm font-semibold text-text">{row.invoice_number}</p>
				{#if row.is_overdue}
					<div
						class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm"
						title={m.overdue_status()}
					>
						<AlertCircle class="h-2.5 w-2.5" />
					</div>
				{/if}
			</div>
			<p class="text-xs text-text-subtle">{row.sender_name}</p>
		</div>
	</div>
{/snippet}

{#snippet clientCell(row: ListInvoicesResponse)}
	<div class="space-y-1">
		<span class="text-sm font-medium text-text">{row.client_first_name} {row.client_last_name}</span
		>
		<span class="block text-xs text-text-subtle">{m.fn_prefix()} {row.client_filenumber}</span>
	</div>
{/snippet}

{#snippet amountCell(row: ListInvoicesResponse)}
	<div class="space-y-1 text-right">
		<span class="block text-sm font-bold text-text">
			{formatCurrency(row.gross_total_amount, row.currency)}
		</span>
		{#if row.balance_due_amount > 0}
			<span class="block text-[11px] font-medium text-amber-600 dark:text-amber-500">
				{m.due_label()}
				{formatCurrency(row.balance_due_amount, row.currency)}
			</span>
		{:else if row.paid_total_amount > 0}
			<span class="block text-[11px] font-medium text-emerald-600 dark:text-emerald-500">
				{m.paid()}: {formatCurrency(row.paid_total_amount, row.currency)}
			</span>
		{/if}
	</div>
{/snippet}

{#snippet statusCell(row: ListInvoicesResponse)}
	{@const meta = statusMeta[row.status] || statusMeta['concept']}
	<span
		class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold {meta.className}"
	>
		{meta.label}
	</span>
{/snippet}

{#snippet datesCell(row: ListInvoicesResponse)}
	<div class="space-y-1">
		<div class="flex items-center gap-1.5 text-xs text-text-muted">
			<span class="font-medium">{m.issued_label()}</span>
			<span>{formatDate(row.issue_date)}</span>
		</div>
		<div
			class="flex items-center gap-1.5 text-xs {row.is_overdue
				? 'font-bold text-rose-600'
				: 'text-text-subtle'}"
		>
			<span class="font-medium">{m.due_label()}</span>
			<span>{formatDate(row.due_date)}</span>
		</div>
	</div>
{/snippet}

{#snippet actionsCell(row: ListInvoicesResponse)}
	<div class="flex justify-end gap-1">
		<a
			href={resolve('/(app)/finances/invoices/[id]', { id: row.id })}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.view_invoice()}
		>
			<Eye class="h-4 w-4" />
		</a>
	</div>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-teal-100/70 to-emerald-100/20 blur-2xl dark:from-teal-900/40 dark:to-emerald-900/20"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<BadgeEuro class="h-5 w-5" />
					</span>
					<span>{m.finances()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.invoices()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.invoices_description()}
				</p>
			</div>
		</div>
	</header>

	{#await invoicesDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each [1, 2, 3, 4] as _}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		</div>

		<DataTable
			{columns}
			rows={[]}
			loading
			{currentPage}
			{pageSize}
			totalCount={0}
			onPageChange={(nextPage) => updateQuery(nextPage, { ...filters })}
			onRowClick={(row) => goto(resolve('/(app)/finances/invoices/[id]', { id: row.id }))}
			rowKey="id"
			title={m.all_invoices_title()}
			description={m.all_invoices_description()}
			filters={tableFilters}
			cells={{
				invoice: invoiceCell,
				client: clientCell,
				amount: amountCell,
				status: statusCell,
				dates: datesCell,
				actions: actionsCell
			}}
		/>
	{:then invoicesData}
		{@const invoices = invoicesData.invoices}
		{@const outstandingTotal = invoices
			.filter(
				(row: ListInvoicesResponse) =>
					row.status === 'outstanding' || row.status === 'partially_paid'
			)
			.reduce((sum: number, row: ListInvoicesResponse) => sum + row.balance_due_amount, 0)}
		{@const overdueTotal = invoices
			.filter((row: ListInvoicesResponse) => row.is_overdue)
			.reduce((sum: number, row: ListInvoicesResponse) => sum + row.balance_due_amount, 0)}
		{@const paidTotal = invoices
			.filter(
				(row: ListInvoicesResponse) => row.status === 'paid' || row.status === 'partially_paid'
			)
			.reduce((sum: number, row: ListInvoicesResponse) => sum + row.paid_total_amount, 0)}

		{#if invoicesData.loadError}
			<InlineErrorBanner message={invoicesData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div
				class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm"
			>
				<div class="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-5">
					<FileText class="h-32 w-32" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.total_invoices()}
					</div>
					<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
						{invoicesData.pagination.count}
					</div>
					<p class="mt-2 text-xs font-medium text-text-muted">{m.all_time()}</p>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-amber-500/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-amber-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<Clock class="h-32 w-32" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.outstanding_balance()}
					</div>
					<div class="mt-2 text-2xl font-bold tracking-tight text-amber-500 sm:text-3xl">
						{formatCurrency(outstandingTotal)}
					</div>
					<p class="mt-2 text-xs font-medium text-text-muted">{m.awaiting_payment()}</p>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-emerald-500/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-emerald-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<Wallet class="h-32 w-32" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.received_payments()}
					</div>
					<div class="mt-2 text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
						{formatCurrency(paidTotal)}
					</div>
					<p class="mt-2 text-xs font-medium text-text-muted">{m.processed_successfully()}</p>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-rose-500/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-rose-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<AlertCircle class="h-32 w-32" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.overdue_amount()}
					</div>
					<div class="mt-2 text-2xl font-bold tracking-tight text-rose-600 sm:text-3xl">
						{formatCurrency(overdueTotal)}
					</div>
					<p class="mt-2 text-xs font-medium text-text-muted">{m.needs_immediate_attention()}</p>
				</div>
			</div>
		</div>

		<DataTable
			{columns}
			rows={invoices}
			currentPage={invoicesData.pagination.page}
			pageSize={invoicesData.pagination.pageSize}
			totalCount={invoicesData.pagination.count}
			onPageChange={(nextPage) => updateQuery(nextPage, { ...filters })}
			onRowClick={(row) => goto(resolve('/(app)/finances/invoices/[id]', { id: row.id }))}
			rowKey="id"
			title={m.all_invoices_title()}
			description={m.all_invoices_description()}
			filters={tableFilters}
			cells={{
				invoice: invoiceCell,
				client: clientCell,
				amount: amountCell,
				status: statusCell,
				dates: datesCell,
				actions: actionsCell
			}}
		/>
	{/await}
</section>
