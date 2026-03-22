<script lang="ts">
	import { Search, Calendar, X, ChevronDown } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
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
	let yearDropdownOpen = $state(false);

	const currentYearObj = new Date().getFullYear();
	const yearOptions = Array.from({ length: 11 }, (_, i) => currentYearObj - i);

	function selectYear(y: number) {
		yearDraft = String(y);
		onYearChange(y);
		yearDropdownOpen = false;
	}

	function clickOutside(node: HTMLElement) {
		const handleClick = (e: Event) => {
			if (yearDropdownOpen && !node.contains(e.target as Node)) {
				yearDropdownOpen = false;
			}
		};
		document.addEventListener('mousedown', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('mousedown', handleClick, true);
			}
		};
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
		{ key: 'year', label: 'Jaar', align: 'center', width: '100px' },
		{ key: 'legal', label: 'Wettelijk', width: '220px' },
		{ key: 'extra', label: 'Bovenwettelijk', width: '220px' },
		{ key: 'totalRemaining', label: 'Totaal Resterend', align: 'right', width: '160px' }
	];

	const formatDays = (value: number) =>
		new Intl.NumberFormat(undefined, {
			maximumFractionDigits: 2
		}).format(value);

	const employeeInitials = (employeeName: string) => {
		const parts = employeeName.trim().split(/\s+/).filter(Boolean);

		if (parts.length === 0) return '??';
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

		return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
	};

	const scheduleSearch = () => {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			onSearch(searchDraft.trim());
		}, 250);
	};

	const handleYearInput = (event: Event) => {
		yearDraft = (event.currentTarget as HTMLInputElement).value;
		const trimmed = yearDraft.trim();
		if (!trimmed) {
			onYearChange(null);
			return;
		}

		const parsed = Number(trimmed);
		if (Number.isInteger(parsed) && parsed >= 2000 && parsed <= currentYearObj) {
			onYearChange(parsed);
		}
	};

	const handleSearchInput = (event: Event) => {
		searchDraft = (event.currentTarget as HTMLInputElement).value;
		scheduleSearch();
	};

	const clearYear = () => {
		yearDraft = '';
		onYearChange(null);
	};
</script>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
		<div class="relative w-full lg:max-w-sm">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				placeholder={m.search_employees()}
				value={searchDraft}
				oninput={handleSearchInput}
				class="h-10 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
			/>
		</div>
		<div class="relative w-36 shrink-0" use:clickOutside>
			<Calendar
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="number"
				min="2000"
				max={currentYearObj}
				step="1"
				placeholder="Jaar"
				value={yearDraft}
				oninput={handleYearInput}
				onclick={() => (yearDropdownOpen = true)}
				class="h-10 w-full cursor-pointer rounded-xl border border-border bg-surface px-9 text-sm font-medium text-text [-moz-appearance:textfield] placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			/>
			{#if yearDraft}
				<button
					type="button"
					class="hover:bg-surface-subtle absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text"
					onclick={clearYear}
					aria-label="Wissen"
				>
					<X class="h-3.5 w-3.5" />
				</button>
			{:else}
				<ChevronDown
					class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-subtle transition-transform {yearDropdownOpen
						? 'rotate-180'
						: ''}"
				/>
			{/if}

			{#if yearDropdownOpen}
				<div
					class="animate-in fade-in slide-in-from-top-2 absolute top-full left-0 z-50 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-lg ring-1 ring-black/5"
				>
					{#each yearOptions as y}
						<button
							type="button"
							class="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-border/50 {yearDraft ===
							String(y)
								? 'bg-brand/10 font-medium text-brand'
								: 'text-text-muted hover:text-text'}"
							onclick={() => selectYear(y)}
						>
							{y}
						</button>
					{/each}
				</div>
			{/if}
		</div>
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

{#snippet balanceCell(remaining: number, total: number, colorClass: string)}
	<div class="flex flex-col gap-1.5 py-1">
		<div class="flex items-baseline gap-1.5">
			<span class="text-sm font-semibold text-text">{formatDays(remaining)}</span>
			<span class="text-xs text-text-muted">/ {formatDays(total)} dgn</span>
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
	{@render balanceCell(balance.legal_remaining_days, balance.legal_total_days, 'bg-brand/70')}
{/snippet}

{#snippet extraCell(balance: LeaveBalanceRow)}
	{@render balanceCell(balance.extra_remaining_days, balance.extra_total_days, 'bg-info/70')}
{/snippet}

{#snippet totalRemainingCell(balance: LeaveBalanceRow)}
	<div class="flex items-center justify-end">
		<span
			class="inline-flex items-center justify-center rounded-xl bg-success/10 px-3 py-1.5 text-sm font-bold text-success shadow-sm shadow-success/5"
		>
			{formatDays(balance.total_remaining_days)} dgn
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
			surface="plain"
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
