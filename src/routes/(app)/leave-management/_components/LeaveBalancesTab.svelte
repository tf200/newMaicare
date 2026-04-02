<script lang="ts">
	import { Search } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import YearSelector from '$lib/components/ui/YearSelector.svelte';
	import type { LeaveBalancesLoadResult, LeaveBalanceRow } from '../+page';

	type Props = {
		data: LeaveBalancesLoadResult;
		onSearch: (value: string) => void;
		onYearChange: (value: number | null) => void;
		onPageChange: (page: number) => void;
		onRetry: () => void;
	};

	let { data, onSearch, onYearChange, onPageChange, onRetry }: Props = $props();

	let searchDraft = $state('');
	let yearDraft = $state('');
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleSearch() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			onSearch(searchDraft.trim());
		}, 250);
	}

	function handleSearchInput(event: Event) {
		searchDraft = (event.currentTarget as HTMLInputElement).value;
		scheduleSearch();
	}

	function handleYearChange(year: number | null) {
		yearDraft = year != null ? String(year) : '';
		onYearChange(year);
	}

	$effect(() => {
		searchDraft = data.pagination.filters.employeeSearch;
		yearDraft = data.pagination.filters.year != null ? String(data.pagination.filters.year) : '';
	});

	onDestroy(() => {
		if (searchTimer) clearTimeout(searchTimer);
	});

	const columns: DataTableColumn[] = [
		{ key: 'employee', label: m.employee() },
		{ key: 'year', label: 'Year', align: 'center', width: '100px' },
		{ key: 'legal', label: m.leave_balance_legal(), width: '220px' },
		{ key: 'extra', label: m.leave_balance_extra(), width: '220px' },
		{ key: 'totalRemaining', label: m.leave_balance_total(), align: 'right', width: '160px' }
	];

	const dayFormatter = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 2
	});

	const formatDays = (value: number) => dayFormatter.format(value);

	const employeeInitials = (employeeName: string) => {
		const parts = employeeName.trim().split(/\s+/).filter(Boolean);

		if (parts.length === 0) return '??';
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

		return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
	};
</script>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
		<div class="relative w-full md:max-w-sm">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				placeholder={m.search_employees()}
				value={searchDraft}
				oninput={handleSearchInput}
				aria-label={m.search_employees()}
				class="h-10 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
			/>
		</div>
		<YearSelector bind:value={yearDraft} onchange={handleYearChange} className="w-36 shrink-0" />
	</div>
{/snippet}

{#snippet employeeCell(balance: LeaveBalanceRow)}
	<div class="flex items-center gap-3 py-1.5">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand shadow-sm shadow-brand/5"
		>
			<span class="text-xs font-bold">{employeeInitials(balance.employee_name)}</span>
		</div>
		<p class="text-sm font-semibold text-text">{balance.employee_name}</p>
	</div>
{/snippet}

{#snippet yearCell(balance: LeaveBalanceRow)}
	<span
		class="bg-surface-subtle inline-flex items-center rounded-lg border border-border px-2 py-1 text-xs font-semibold text-text"
	>
		{balance.year}
	</span>
{/snippet}

{#snippet balanceCell(remaining: number, total: number, colorClass: string, label: string)}
	<div class="flex flex-col gap-1.5 py-1">
		<span class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">{label}</span>
		<div class="flex items-baseline gap-1.5">
			<span class="text-sm font-semibold text-text">{formatDays(remaining)}</span>
			<span class="text-xs text-text-muted">
				/ {formatDays(total)}
				{m.leave_day_plural()}
			</span>
		</div>
		<div class="bg-surface-subtle h-1.5 w-full max-w-[140px] overflow-hidden rounded-full">
			<div
				class="h-full rounded-full transition-all {colorClass}"
				style={`width: ${Math.max(0, Math.min(100, (remaining / (total || 1)) * 100))}%`}
			></div>
		</div>
	</div>
{/snippet}

{#snippet legalCell(balance: LeaveBalanceRow)}
	{@render balanceCell(
		balance.legal_remaining_days,
		balance.legal_total_days,
		'bg-brand/70',
		m.leave_balance_legal()
	)}
{/snippet}

{#snippet extraCell(balance: LeaveBalanceRow)}
	{@render balanceCell(
		balance.extra_remaining_days,
		balance.extra_total_days,
		'bg-info/70',
		m.leave_balance_extra()
	)}
{/snippet}

{#snippet totalRemainingCell(balance: LeaveBalanceRow)}
	<div class="flex items-center justify-end">
		<span
			class="inline-flex items-center justify-center rounded-xl bg-success/10 px-3 py-1.5 text-sm font-bold text-success shadow-sm shadow-success/5"
		>
			{formatDays(balance.total_remaining_days)}
			{m.leave_balance_days_remaining()}
		</span>
	</div>
{/snippet}

{#if data.loadError}
	<InlineErrorBanner message={data.loadError} {onRetry} />
{:else}
	<div class="animate-in fade-in slide-in-from-bottom-2 space-y-5">
		<DataTable
			{columns}
			rows={data.balances}
			rowKey="id"
			title={m.leave_balance_title()}
			description={m.leave_balance_subtitle()}
			filters={tableFilters}
			headerInline
			currentPage={data.pagination.page}
			pageSize={data.pagination.pageSize}
			totalCount={data.pagination.count}
			{onPageChange}
			cells={{
				employee: employeeCell,
				year: yearCell,
				legal: legalCell,
				extra: extraCell,
				totalRemaining: totalRemainingCell
			}}
		/>
	</div>
{/if}

<style>
	@media (prefers-reduced-motion: reduce) {
		.animate-in {
			animation: none !important;
		}
	}
</style>
