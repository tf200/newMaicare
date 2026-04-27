<script lang="ts">
	import {
		FileText,
		Users,
		Calendar,
		Eye,
		Search,
		Clock,
		CheckCircle2,
		XCircle,
		Timer,
		SquareMinus,
		Plus
	} from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FilterDropdown from '$lib/components/ui/FilterDropdown.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import CreateContractForm from '$lib/components/forms/CreateContractForm.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type {
		ContractCareType,
		ContractFinancingAct,
		ContractFinancingOption,
		ContractStatus
	} from '$lib/types/api';
	import type { ContractsFilters, ContractsLoadResult, ContractsRow } from './+page';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: ContractsFilters;
			};
			contractsData: Promise<ContractsLoadResult>;
		};
	}>();

	const contractsDataPromise = $derived(data.contractsData);
	const initial = $derived(data.initial);
	const currentPage = $derived(initial.page);
	const pageSize = $derived(initial.pageSize);

	let showCreateContract = $state(false);

	const appliedSearch = $derived((initial.filters.search ?? '').trim());
	const appliedStatus = $derived(initial.filters.status ?? []);
	const appliedCareType = $derived(initial.filters.careType ?? []);
	const appliedFinancingAct = $derived(initial.filters.financingAct ?? []);
	const appliedFinancingOption = $derived(initial.filters.financingOption ?? []);
	const appliedEndDateFrom = $derived((initial.filters.endDateFrom ?? '').trim());
	const appliedEndDateTo = $derived((initial.filters.endDateTo ?? '').trim());

	const activeFilters = $derived.by(() => ({
		status_approved: appliedStatus.includes('approved'),
		status_draft: appliedStatus.includes('draft'),
		status_terminated: appliedStatus.includes('terminated'),
		status_stopped: appliedStatus.includes('stopped'),
		status_expired: appliedStatus.includes('expired'),
		care_ambulante: appliedCareType.includes('ambulante'),
		care_accommodation: appliedCareType.includes('accommodation'),
		act_WMO: appliedFinancingAct.includes('WMO'),
		act_ZVW: appliedFinancingAct.includes('ZVW'),
		act_WLZ: appliedFinancingAct.includes('WLZ'),
		act_JW: appliedFinancingAct.includes('JW'),
		act_WPG: appliedFinancingAct.includes('WPG'),
		endDateFrom: appliedEndDateFrom,
		endDateTo: appliedEndDateTo
	}));

	const filterGroups = [
		{
			label: 'End Date Range',
			items: [
				{ key: 'endDateFrom', label: 'From', type: 'date' as const },
				{ key: 'endDateTo', label: 'To', type: 'date' as const }
			]
		},
		{
			label: 'Status',
			items: [
				{ key: 'status_approved', label: 'Approved' },
				{ key: 'status_draft', label: 'Draft' },
				{ key: 'status_terminated', label: 'Terminated' },
				{ key: 'status_stopped', label: 'Stopped' },
				{ key: 'status_expired', label: 'Expired' }
			]
		},
		{
			label: 'Care Type',
			items: [
				{ key: 'care_ambulante', label: 'Ambulante' },
				{ key: 'care_accommodation', label: 'Accommodation' }
			]
		},
		{
			label: 'Financing Act',
			items: [
				{ key: 'act_WMO', label: 'WMO' },
				{ key: 'act_ZVW', label: 'ZVW' },
				{ key: 'act_WLZ', label: 'WLZ' },
				{ key: 'act_JW', label: 'JW' },
				{ key: 'act_WPG', label: 'WPG' }
			]
		}
	];

	const columns: DataTableColumn[] = [
		{ key: 'client', label: 'Client', headerClass: 'pl-14' },
		{ key: 'care', label: 'Care', width: '300px' },
		{ key: 'financing', label: 'Financing', width: '150px' },
		{ key: 'period', label: 'Period', width: '200px' },
		{ key: 'status', label: m.status(), width: '140px' },
		{ key: 'actions', label: '', align: 'right', width: '80px' }
	];

	const statusMeta: Record<
		ContractStatus,
		{ label: string; className: string; icon: typeof CheckCircle2 }
	> = {
		approved: {
			label: 'Approved',
			className:
				'bg-emerald-600 text-white border border-emerald-700/60 shadow-sm shadow-emerald-700/30',
			icon: CheckCircle2
		},
		draft: {
			label: 'Draft',
			className: 'bg-amber-500 text-white border border-amber-600/60 shadow-sm shadow-amber-600/30',
			icon: Timer
		},
		terminated: {
			label: 'Terminated',
			className: 'bg-rose-600 text-white border border-rose-700/60 shadow-sm shadow-rose-700/30',
			icon: XCircle
		},
		stopped: {
			label: 'Stopped',
			className: 'bg-slate-600 text-white border border-slate-700/60 shadow-sm shadow-slate-700/30',
			icon: SquareMinus
		},
		expired: {
			label: 'Expired',
			className: 'bg-zinc-500 text-white border border-zinc-700/60 shadow-sm shadow-zinc-700/30',
			icon: Clock
		}
	};

	const formatDate = (date: string) =>
		new Intl.DateTimeFormat('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(date));

	const buildQuery = (pageValue: number, filters: ContractsFilters) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));

		if (filters.search) params.set('search', filters.search);
		if (filters.clientName) params.set('client_name', filters.clientName);
		if (filters.senderName) params.set('sender_name', filters.senderName);
		if (filters.endDateFrom) params.set('end_date_from', filters.endDateFrom);
		if (filters.endDateTo) params.set('end_date_to', filters.endDateTo);

		for (const status of filters.status) {
			params.append('status', status);
		}

		for (const careType of filters.careType) {
			params.append('care_type', careType);
		}

		for (const act of filters.financingAct) {
			params.append('financing_act', act);
		}

		for (const option of filters.financingOption) {
			params.append('financing_option', option);
		}

		return params.toString();
	};

	const updateQuery = (pageValue: number, filters: ContractsFilters) => {
		const nextQuery = buildQuery(pageValue, filters);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const applySearch = (value: string) => {
		updateQuery(1, {
			...initial.filters,
			clientName: '',
			senderName: '',
			search: value.trim()
		});
	};

	const applyFinancingOption = (value: ContractFinancingOption | '') => {
		updateQuery(1, {
			...initial.filters,
			clientName: '',
			senderName: '',
			financingOption: value ? [value] : []
		});
	};

	const handleFilterUpdate = (af: Record<string, any>) => {
		const status: ContractStatus[] = [];
		if (af.status_approved) status.push('approved');
		if (af.status_draft) status.push('draft');
		if (af.status_terminated) status.push('terminated');
		if (af.status_stopped) status.push('stopped');
		if (af.status_expired) status.push('expired');

		const careType: ContractCareType[] = [];
		if (af.care_ambulante) careType.push('ambulante');
		if (af.care_accommodation) careType.push('accommodation');

		const financingAct: ContractFinancingAct[] = [];
		if (af.act_WMO) financingAct.push('WMO');
		if (af.act_ZVW) financingAct.push('ZVW');
		if (af.act_WLZ) financingAct.push('WLZ');
		if (af.act_JW) financingAct.push('JW');
		if (af.act_WPG) financingAct.push('WPG');

		updateQuery(1, {
			...initial.filters,
			clientName: '',
			senderName: '',
			status,
			careType,
			financingAct,
			endDateFrom: af.endDateFrom || '',
			endDateTo: af.endDateTo || ''
		});
	};

	const clearFilters = () => {
		updateQuery(1, {
			...initial.filters,
			clientName: '',
			senderName: '',
			status: [],
			careType: [],
			financingAct: [],
			endDateFrom: '',
			endDateTo: ''
		});
	};
</script>

<svelte:head>
	<title>{m.contracts_page_title()}</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex flex-wrap items-center gap-4">
		<div class="relative w-full sm:w-64">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
				placeholder={m.search_contracts_placeholder()}
				value={appliedSearch}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						applySearch((event.currentTarget as HTMLInputElement).value);
					}
				}}
				onblur={(event) => applySearch((event.currentTarget as HTMLInputElement).value)}
			/>
		</div>

		<FilterDropdown
			filters={activeFilters}
			groups={filterGroups}
			title={m.contract_filters()}
			onUpdate={handleFilterUpdate}
			onClear={clearFilters}
		/>

		<div class="hidden h-6 w-px bg-border sm:block"></div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				onclick={() => applyFinancingOption('')}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {appliedFinancingOption.length ===
				0
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				All
			</button>
			<button
				onclick={() => applyFinancingOption('ZIN')}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {appliedFinancingOption[0] ===
				'ZIN'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				ZIN
			</button>
			<button
				onclick={() => applyFinancingOption('PGB')}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {appliedFinancingOption[0] ===
				'PGB'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				PGB
			</button>
		</div>
	</div>
{/snippet}

{#snippet clientCell(row: ContractsRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<Users class="h-5 w-5" />
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.clientFirstName} {row.clientLastName}</p>
			<p class="text-xs font-medium text-text-muted">File: {row.clientFileNumber || '—'}</p>
		</div>
	</div>
{/snippet}

{#snippet careCell(row: ContractsRow)}
	<div class="space-y-1">
		<p class="text-sm font-semibold text-text">{row.careName}</p>
		<p class="text-xs font-medium text-text-muted capitalize">{row.careType} - {row.senderName}</p>
	</div>
{/snippet}

{#snippet financingCell(row: ContractsRow)}
	<div>
		<p class="text-sm font-bold text-text">{row.financingAct}</p>
		<p class="text-xs font-semibold text-text-muted">{row.financingOption}</p>
	</div>
{/snippet}

{#snippet periodCell(row: ContractsRow)}
	<div class="space-y-1">
		<div class="flex items-center gap-2 text-sm font-semibold text-text">
			<Calendar class="h-4 w-4 text-text-muted" />
			<span>{formatDate(row.endDate)}</span>
		</div>
		{#if row.daysLeft >= 0}
			<p class="text-xs font-semibold text-emerald-600">{row.daysLeft} days left</p>
		{:else}
			<p class="text-xs font-semibold text-rose-600">Expired {-row.daysLeft} days ago</p>
		{/if}
	</div>
{/snippet}

{#snippet actionsCell(row: ContractsRow)}
	<div class="flex justify-end">
		<a
			href="/contracts/{row.id}"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.view_details()}
			aria-label={m.view_details()}
		>
			<Eye class="h-4 w-4" />
		</a>
	</div>
{/snippet}

{#snippet statusCell(row: ContractsRow)}
	{@const meta = statusMeta[row.status]}
	<span
		class="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold {meta.className}"
	>
		<meta.icon class="h-3.5 w-3.5" />
		{meta.label}
	</span>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-indigo-100/70 to-violet-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<FileText class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.contracts()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					Manage all care contracts with financing, timeline, and approval status.
				</p>
			</div>

			<Button class="gap-2" onclick={() => (showCreateContract = true)}>
				<Plus class="h-4 w-4" />
				Add contract
			</Button>
		</div>
	</header>

	<CreateContractForm bind:open={showCreateContract} onCreated={() => invalidateAll()} />

	{#await contractsDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each [1, 2, 3, 4] as _}
				<StatCard loading label="" value="" />
			{/each}
		</div>

		<DataTable
			{columns}
			rows={[]}
			loading
			{currentPage}
			{pageSize}
			totalCount={0}
			onPageChange={(nextPage) =>
				updateQuery(nextPage, { ...initial.filters, clientName: '', senderName: '' })}
			rowKey="id"
			title={m.contracts()}
			description="Contracts with financing, timeline, and status details."
			filters={tableFilters}
			cells={{
				client: clientCell,
				care: careCell,
				financing: financingCell,
				period: periodCell,
				status: statusCell,
				actions: actionsCell
			}}
		/>
	{:then contractsData}
		{#if contractsData.loadError}
			<InlineErrorBanner message={contractsData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard
				label="Total Contracts"
				value={contractsData.stats.total}
				description={m.all_matching_records()}
				icon={FileText}
				iconColor="text-text"
			/>
			<StatCard
				label="Approved"
				value={contractsData.stats.approved}
				description={m.current_page()}
				icon={CheckCircle2}
				valueColor="text-emerald-600"
				iconColor="text-emerald-500"
				hoverBorderColor="hover:border-emerald-500/30"
			/>
			<StatCard
				label={m.draft()}
				value={contractsData.stats.draft}
				description={m.pending_completion()}
				icon={Timer}
				valueColor="text-amber-600"
				iconColor="text-amber-500"
				hoverBorderColor="hover:border-amber-500/30"
			/>
			<StatCard
				label="Expiring Soon"
				value={contractsData.stats.expiringSoon}
				description={m.within_30_days()}
				icon={Clock}
				valueColor="text-rose-600"
				iconColor="text-rose-500"
				hoverBorderColor="hover:border-rose-500/30"
			/>
		</div>

		<DataTable
			{columns}
			rows={contractsData.rows}
			currentPage={contractsData.pagination.page}
			pageSize={contractsData.pagination.pageSize}
			totalCount={contractsData.pagination.count}
			onPageChange={(nextPage) =>
				updateQuery(nextPage, { ...initial.filters, clientName: '', senderName: '' })}
			rowKey="id"
			title={m.contracts()}
			description="Contracts with financing, timeline, and status details."
			filters={tableFilters}
			cells={{
				client: clientCell,
				care: careCell,
				financing: financingCell,
				period: periodCell,
				status: statusCell,
				actions: actionsCell
			}}
		/>
	{/await}
</section>
