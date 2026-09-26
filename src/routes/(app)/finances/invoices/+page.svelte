<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import {
		BadgeEuro,
		FileText,
		Search,
		Eye,
		Plus,
		AlertCircle,
		Clock,
		Wallet
	} from 'lucide-svelte';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import FilterPills, { type FilterPill } from '$lib/components/ui/FilterPills.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import type { DataTableColumn, DataTableEmptyState } from '$lib/components/ui/DataTable.svelte';
	import Filters, {
		type FilterGroup,
		type FiltersState
	} from '$lib/components/ui/FilterDropdown.svelte';
	import type { ListInvoicesResponse, InvoiceStatus } from '$lib/types/api/invoices';
	import type { PageProps } from './$types';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getLocale } from '$lib/paraglide/runtime';
	import { untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';

	let { data }: PageProps = $props();

	const invoicesDataPromise = $derived.by(() => data.invoicesData);
	const invoiceStatsPromise = $derived.by(() => data.invoiceStats);
	const initial = $derived.by(() => data.initial);
	const currentPage = $derived.by(() => initial.page);
	const pageSize = $derived.by(() => initial.pageSize);
	const auth = getAuthState();
	const canCreateInvoice = $derived(auth.hasPermission(PERMISSIONS.INVOICE.CREATE));
	const createInvoiceHref = resolve('/(app)/finances/invoices/new');
	const retryInvoices = () => invalidate('app:invoices:list');

	const appliedSearch = $derived.by(() => (initial.filters.q ?? '').trim());
	let searchTerm = $state('');

	$effect(() => {
		const nextSearch = appliedSearch;
		untrack(() => {
			searchTerm = nextSearch;
		});
	});

	interface UIFilters extends FiltersState {
		status?: InvoiceStatus;
		q?: string;
		locked?: boolean;
		start_date?: string;
		end_date?: string;
		source_auto?: boolean;
		source_manual?: boolean;
		source_imported?: boolean;
		type_standard?: boolean;
		type_credit?: boolean;
	}

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
			status: initial.filters.status,
			q: initial.filters.q,
			locked: initial.filters.locked,
			start_date: initial.filters.start_date,
			end_date: initial.filters.end_date
		};
		if (initial.filters.source === 'auto') f.source_auto = true;
		if (initial.filters.source === 'manual') f.source_manual = true;
		if (initial.filters.source === 'imported') f.source_imported = true;

		if (initial.filters.invoice_type === 'standard') f.type_standard = true;
		if (initial.filters.invoice_type === 'credit_note') f.type_credit = true;
		return f;
	});

	const filterGroups: FilterGroup[] = $derived([
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
	]);

	const statusMeta: Record<InvoiceStatus, { label: string; className: string }> = $derived({
		outstanding: {
			label: m.outstanding_status(),
			className: 'bg-warning/15 text-warning-strong'
		},
		partially_paid: {
			label: m.partially_paid(),
			className: 'bg-info/15 text-info-strong'
		},
		paid: {
			label: m.paid(),
			className: 'bg-success/15 text-success-strong'
		},
		expired: {
			label: m.expired(),
			className: 'bg-error/15 text-error-strong'
		},
		overpaid: {
			label: m.overpaid(),
			className: 'bg-secondary/15 text-secondary-strong'
		},
		imported: {
			label: m.imported(),
			className: 'bg-border text-text-muted'
		},
		concept: {
			label: m.concept(),
			className: 'bg-border text-text-muted'
		},
		canceled: {
			label: m.canceled(),
			className: 'bg-border text-text-muted'
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
		const params = new SvelteURLSearchParams();
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
		goto(resolve(`/(app)/finances/invoices?${nextQuery}`), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	const handleFilterUpdate = (nextFilters: UIFilters) => {
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

		setFilters(nextFilters);
	};

	const applySearch = () => {
		const nextSearch = searchTerm.trim();
		setFilters({ ...filters, q: nextSearch });
	};

	const clearFilters = () => {
		searchTerm = '';
		updateQuery(1, { ...defaultFilters });
	};

	const invoiceFilterPills: FilterPill[] = [
		{ id: '', label: m.all() },
		{ id: 'outstanding', label: m.outstanding_status(), color: 'amber' },
		{ id: 'paid', label: m.paid(), color: 'emerald' },
		{ id: 'expired', label: m.overdue_status(), color: 'rose' }
	];

	const hasActiveFilters = $derived(
		Boolean(
			initial.filters.status ||
			initial.filters.q ||
			initial.filters.source ||
			initial.filters.invoice_type ||
			initial.filters.locked ||
			initial.filters.start_date ||
			initial.filters.end_date
		)
	);
	const emptyState: DataTableEmptyState = $derived(
		hasActiveFilters
			? { title: m.no_matching_invoices(), action: { label: m.clear_all(), onClick: clearFilters } }
			: {
					title: m.no_invoices_title(),
					description: m.no_invoices_description(),
					action: canCreateInvoice
						? { label: m.create_invoice(), onClick: () => goto(createInvoiceHref) }
						: undefined
				}
	);
</script>

{#snippet tableToolbar()}
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<form
			class="flex w-full items-center gap-2 sm:w-auto"
			onsubmit={(event) => {
				event.preventDefault();
				applySearch();
			}}
		>
			<div class="relative min-w-0 flex-1 sm:flex-none">
				<label class="sr-only" for="invoice-search">{m.search_invoices_label()}</label>
				<Search
					class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
				/>
				<input
					id="invoice-search"
					type="text"
					placeholder={m.search_invoices_placeholder()}
					bind:value={searchTerm}
					class="min-h-11 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:outline-none sm:w-64"
				/>
			</div>
			<button
				type="submit"
				class="min-h-11 rounded-xl border border-border px-3 text-sm font-semibold text-text hover:bg-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
				>{m.search()}</button
			>
		</form>

		<FilterPills
			pills={invoiceFilterPills}
			activeId={filters.status ?? ''}
			onSelect={(id) =>
				setFilters({ ...filters, status: id === '' ? undefined : (id as InvoiceStatus) })}
		/>

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
				<a
					href={resolve('/(app)/finances/invoices/[id]', { id: row.id })}
					class="rounded-lg text-sm font-semibold text-text hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
					>{row.invoice_number}</a
				>
				{#if row.is_overdue}
					<div
						class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-error text-surface shadow-sm"
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
			<span class="block text-xs font-medium text-warning-strong">
				{m.due_label()}
				{formatCurrency(row.balance_due_amount, row.currency)}
			</span>
		{:else if row.paid_total_amount > 0}
			<span class="block text-xs font-medium text-success-strong">
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
				? 'font-bold text-error-strong'
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
			class="flex h-11 w-11 items-center justify-center rounded-xl text-text-muted transition hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
			aria-label={m.view_invoice()}
			title={m.view_invoice()}
		>
			<Eye class="h-4 w-4" />
		</a>
	</div>
{/snippet}

<section class="space-y-6">
	<header class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
		<div class="flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<BadgeEuro class="h-5 w-5" />
					</span>
					<span>{m.finances()}</span>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-text">{m.invoices()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.invoices_description()}
				</p>
			</div>
			<PermissionGuard permission={PERMISSIONS.INVOICE.CREATE}>
				<a
					href={createInvoiceHref}
					class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-btn-primary-bg px-4 text-sm font-semibold text-btn-primary-text shadow-sm transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
				>
					<Plus class="h-4 w-4" />{m.create_invoice()}
				</a>
			</PermissionGuard>
		</div>
	</header>

	{#if invoiceStatsPromise}
		{#await invoiceStatsPromise}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{#each [1, 2, 3, 4] as skeletonIndex (skeletonIndex)}
					<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
						<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
						<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
					</div>
				{/each}
			</div>
		{:then statsData}
			{#if statsData.loadError}
				<InlineErrorBanner
					message={statsData.loadError}
					onRetry={() => invalidate('app:invoices:stats')}
				/>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<StatCard
						label={m.total_invoices()}
						value={statsData.stats.total_invoices}
						description={m.all_time()}
						icon={FileText}
					/>
					<StatCard
						label={m.outstanding_balance()}
						value={formatCurrency(statsData.stats.outstanding_balance, statsData.stats.currency)}
						description={m.all_time_eur()}
						icon={Clock}
						color="amber"
					/>
					<StatCard
						label={m.received_payments()}
						value={formatCurrency(statsData.stats.received_payments, statsData.stats.currency)}
						description={m.all_time_eur()}
						icon={Wallet}
						color="emerald"
					/>
					<StatCard
						label={m.overdue_amount()}
						value={formatCurrency(statsData.stats.overdue_amount, statsData.stats.currency)}
						description={m.all_time_eur()}
						icon={AlertCircle}
						color="rose"
					/>
				</div>
			{/if}
		{/await}
	{/if}

	{#await invoicesDataPromise}
		<DataTable
			{columns}
			rows={[]}
			loading
			pagination={{
				mode: 'server',
				page: currentPage,
				pageSize,
				totalCount: 0,
				onPageChange: (nextPage) => updateQuery(nextPage, { ...filters })
			}}
			rowKey="id"
			title={m.all_invoices_title()}
			description={m.all_invoices_description()}
			toolbar={tableToolbar}
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
		<DataTable
			{columns}
			rows={invoices}
			pagination={{
				mode: 'server',
				page: invoicesData.pagination.page,
				pageSize: invoicesData.pagination.pageSize,
				totalCount: invoicesData.pagination.count,
				onPageChange: (nextPage) => updateQuery(nextPage, { ...filters })
			}}
			rowKey="id"
			title={m.all_invoices_title()}
			description={m.all_invoices_description()}
			toolbar={tableToolbar}
			empty={invoicesData.pagination.count > 0 && invoices.length === 0
				? {
						title: m.no_invoices_on_page(),
						action: { label: m.back_to_first_page(), onClick: () => updateQuery(1, { ...filters }) }
					}
				: emptyState}
			error={invoicesData.loadError ?? undefined}
			onRetry={retryInvoices}
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
