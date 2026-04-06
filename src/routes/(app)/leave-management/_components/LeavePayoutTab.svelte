<script lang="ts">
	import { Clock, CheckCircle, XCircle, Banknote, Search } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import type { PayoutRequest } from '$lib/types/api/salary';
	import { listPayoutRequests } from '$lib/api/salary';

	type PayoutStatus = 'pending' | 'approved' | 'rejected' | 'paid';
	type RequestFilter = 'all' | 'pending' | 'approved' | 'rejected';

	interface RequestFilterPill {
		id: RequestFilter;
		label: string;
	}

	const columns: DataTableColumn[] = [
		{ key: 'employee', label: m.employee() },
		{ key: 'hours', label: m.hours(), align: 'center', width: '100px' },
		{ key: 'amount', label: m.amount(), align: 'right', width: '140px' },
		{ key: 'month', label: m.month(), align: 'center', width: '120px' },
		{ key: 'status', label: m.status(), align: 'center', width: '140px' },
		{ key: 'date', label: m.date(), align: 'right', width: '140px' },
		{ key: 'actions', label: '', align: 'right', width: '120px' }
	];

	const statusConfig: Record<
		PayoutStatus,
		{ label: string; icon: typeof Clock; color: string; bgColor: string }
	> = {
		pending: {
			label: m.pending(),
			icon: Clock,
			color: 'text-warning',
			bgColor: 'bg-warning/10 border-warning/20'
		},
		approved: {
			label: m.leave_status_approved(),
			icon: CheckCircle,
			color: 'text-info',
			bgColor: 'bg-info/10 border-info/20'
		},
		paid: {
			label: m.paid(),
			icon: Banknote,
			color: 'text-success',
			bgColor: 'bg-success/10 border-success/20'
		},
		rejected: {
			label: m.leave_status_rejected(),
			icon: XCircle,
			color: 'text-error',
			bgColor: 'bg-error/10 border-error/20'
		}
	};

	const currencyFormatter = new Intl.NumberFormat('nl-NL', {
		style: 'currency',
		currency: 'EUR'
	});

	const formatDate = (dateStr: string) => {
		return new Intl.DateTimeFormat('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(dateStr));
	};

	const formatMonth = (monthStr: string | undefined | null) => {
		if (!monthStr) return '-';
		const [year, month] = monthStr.split('-');
		return new Intl.DateTimeFormat('nl-NL', {
			month: 'long',
			year: 'numeric'
		}).format(new Date(parseInt(year), parseInt(month) - 1));
	};

	let searchQuery = $state('');
	let requestFilter = $state<RequestFilter>('all');
	let currentPage = $state(1);
	let pageSize = $state(10);
	
	let data = $state<PayoutRequest[]>([]);
	let totalCount = $state(0);
	let loading = $state(false);
	let requestSequence = 0;
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	const requestFilterPills = $derived.by<RequestFilterPill[]>(() => [
		{ id: 'all', label: m.all() },
		{ id: 'pending', label: m.pending() },
		{ id: 'approved', label: m.leave_stats_approved() },
		{ id: 'rejected', label: m.leave_stats_rejected() }
	]);

	function getFilterPillClass(pillId: RequestFilter) {
		if (pillId === 'all') {
			return requestFilter === pillId
				? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'pending') {
			return requestFilter === pillId
				? 'bg-amber-500 text-white'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'approved') {
			return requestFilter === pillId
				? 'bg-emerald-600 text-white'
				: 'border border-border text-text-muted hover:text-text';
		}
		return requestFilter === pillId
			? 'bg-rose-600 text-white'
			: 'border border-border text-text-muted hover:text-text';
	}

	async function loadData() {
		const reqId = ++requestSequence;
		loading = true;
		
		try {
			const status = requestFilter === 'all' ? undefined : requestFilter;
			const res = await listPayoutRequests({
				page: currentPage,
				page_size: pageSize,
				status,
				employee_search: searchQuery
			});
			
			if (reqId !== requestSequence) return;
			
			data = res.data.results ?? [];
			totalCount = res.data.count ?? 0;
		} catch (error) {
			if (reqId !== requestSequence) return;
			console.error(error);
			data = [];
			totalCount = 0;
		} finally {
			if (reqId === requestSequence) {
				loading = false;
			}
		}
	}

	$effect(() => {
		// Dependencies: currentPage, pageSize, requestFilter
		// Use local variables to register tracking
		const _page = currentPage;
		const _size = pageSize;
		const _filter = requestFilter;
		
		void loadData();
	});
	
	function handleSearchInput(event: Event) {
		const val = (event.target as HTMLInputElement).value;
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			searchQuery = val;
			currentPage = 1;
			void loadData();
		}, 300);
	}

	const employeeInitials = (name: string) => {
		if (!name) return '';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};
</script>

{#snippet tableFilters()}
	<div class="flex w-full flex-wrap items-center gap-3">
		<div class="relative w-full sm:w-64">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				placeholder={m.search_employees()}
				oninput={handleSearchInput}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
			/>
		</div>
		<div class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
			{#each requestFilterPills as pill (pill.id)}
				<button
					onclick={() => {
						requestFilter = pill.id;
						currentPage = 1;
					}}
					class="h-9 rounded-full px-4 text-xs font-semibold transition-all {getFilterPillClass(
						pill.id
					)}"
				>
					{pill.label}
				</button>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet employeeCell(row: PayoutRequest)}
	<div class="flex items-center gap-3 py-1.5">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand shadow-sm shadow-brand/5"
		>
			<span class="text-xs font-bold">{employeeInitials(row.employee_name)}</span>
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.employee_name}</p>
			<p class="text-[10px] font-medium tracking-wider text-text-muted uppercase">
				Year {row.balance_year}
			</p>
		</div>
	</div>
{/snippet}

{#snippet hoursCell(row: PayoutRequest)}
	<span class="text-sm font-semibold text-text">
		{row.requested_hours}h
	</span>
{/snippet}

{#snippet amountCell(row: PayoutRequest)}
	<div class="flex flex-col items-end">
		<span class="text-sm font-bold text-text">
			{currencyFormatter.format(row.gross_amount)}
		</span>
		<span class="text-[10px] text-text-muted">
			{currencyFormatter.format(row.hourly_rate)}/h
		</span>
	</div>
{/snippet}

{#snippet monthCell(row: PayoutRequest)}
	<span class="text-xs font-medium text-text-muted">
		{formatMonth(row.salary_month)}
	</span>
{/snippet}

{#snippet statusCell(row: PayoutRequest)}
	{@const config = statusConfig[row.status]}
	<div
		class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold {config.bgColor} {config.color}"
	>
		<config.icon class="h-3.5 w-3.5" />
		{config.label}
	</div>
{/snippet}

{#snippet dateCell(row: PayoutRequest)}
	<span class="text-xs text-text-muted">
		{formatDate(row.requested_at)}
	</span>
{/snippet}

{#snippet actionsCell(row: PayoutRequest)}
	<div class="flex items-center justify-end gap-2">
		{#if row.status === 'pending'}
			<button
				type="button"
				aria-label="Approve payout"
				class="group flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success transition-all hover:bg-success hover:text-white hover:shadow-md hover:shadow-success/20 focus:ring-2 focus:ring-success/40 focus:outline-none"
			>
				<CheckCircle class="h-4 w-4 transition-transform group-hover:scale-110" />
			</button>
			<button
				type="button"
				aria-label="Reject payout"
				class="group flex h-8 w-8 items-center justify-center rounded-lg bg-error/10 text-error transition-all hover:bg-error hover:text-white hover:shadow-md hover:shadow-error/20 focus:ring-2 focus:ring-error/40 focus:outline-none"
			>
				<XCircle class="h-4 w-4 transition-transform group-hover:scale-110" />
			</button>
		{/if}
	</div>
{/snippet}

<div class="animate-in fade-in slide-in-from-bottom-2 space-y-5">
	<DataTable
		{columns}
		rows={data}
		{loading}
		rowKey="id"
		title={m.leave_payout_title()}
		description={m.leave_payout_subtitle()}
		filters={tableFilters}
		headerInline
		{currentPage}
		{pageSize}
		{totalCount}
		onPageChange={(p) => (currentPage = p)}
		cells={{
			employee: employeeCell,
			hours: hoursCell,
			amount: amountCell,
			month: monthCell,
			status: statusCell,
			date: dateCell,
			actions: actionsCell
		}}
	/>
</div>