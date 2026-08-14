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
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FilterDropdown from '$lib/components/ui/FilterDropdown.svelte';
	import CreateContractForm from '$lib/components/forms/CreateContractForm.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import type {
		ContractCareType,
		ContractFinancingAct,
		ContractFinancingOption,
		ContractStatus
	} from '$lib/types/api';
	import type { ContractsFilters, ContractsLoadResult, ContractsRow } from './+page';

	interface ContractFilterState {
		status_approved?: boolean;
		status_draft?: boolean;
		status_terminated?: boolean;
		status_stopped?: boolean;
		status_expired?: boolean;
		care_ambulante?: boolean;
		care_accommodation?: boolean;
		act_WMO?: boolean;
		act_ZVW?: boolean;
		act_WLZ?: boolean;
		act_JW?: boolean;
		act_WPG?: boolean;
		endDateFrom?: string;
		endDateTo?: string;
	}

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
			label: m.end_date_range(),
			items: [
				{ key: 'endDateFrom', label: m.from(), type: 'date' as const },
				{ key: 'endDateTo', label: m.to(), type: 'date' as const }
			]
		},
		{
			label: m.status(),
			items: [
				{ key: 'status_approved', label: m.approved() },
				{ key: 'status_draft', label: m.draft() },
				{ key: 'status_terminated', label: m.terminated() },
				{ key: 'status_stopped', label: m.stopped() },
				{ key: 'status_expired', label: m.expired() }
			]
		},
		{
			label: m.care_type(),
			items: [
				{ key: 'care_ambulante', label: m.ambulante() },
				{ key: 'care_accommodation', label: m.accommodation() }
			]
		},
		{
			label: m.financing_act(),
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
		{ key: 'client', label: m.client(), headerClass: 'pl-14' },
		{ key: 'care', label: m.care(), width: '300px' },
		{ key: 'financing', label: m.financing(), width: '150px' },
		{ key: 'period', label: m.period(), width: '200px' },
		{ key: 'status', label: m.status(), width: '140px' },
		{ key: 'actions', label: '', align: 'right', width: '80px' }
	];

	const statusMeta: Record<
		ContractStatus,
		{ label: string; className: string; icon: typeof CheckCircle2 }
	> = {
		approved: {
			label: m.approved(),
			className: 'border border-success-strong/30 bg-success/15 text-success-strong',
			icon: CheckCircle2
		},
		draft: {
			label: m.draft(),
			className: 'border border-warning-strong/30 bg-warning/15 text-warning-strong',
			icon: Timer
		},
		terminated: {
			label: m.terminated(),
			className: 'border border-error-strong/30 bg-error/15 text-error-strong',
			icon: XCircle
		},
		stopped: {
			label: m.stopped(),
			className: 'border border-info-strong/30 bg-info/15 text-info-strong',
			icon: SquareMinus
		},
		expired: {
			label: m.expired(),
			className: 'border border-border bg-bg text-text-muted',
			icon: Clock
		}
	};

	const formatDate = (date: string) =>
		new Intl.DateTimeFormat(getLocale() === 'nl' ? 'nl-NL' : 'en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(date));

	const buildQuery = (pageValue: number, filters: ContractsFilters) => {
		const params = new SvelteURLSearchParams();
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
		goto(resolve(`/(app)/contracts?${nextQuery}`), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
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

	const handleFilterUpdate = (af: ContractFilterState) => {
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

	const refreshContracts = () => invalidate('app:contracts:list');
</script>

<svelte:head>
	<title>{m.contracts_page_title()}</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex flex-wrap items-center gap-4">
		<div class="relative w-full sm:w-64">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
				aria-hidden="true"
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
				type="button"
				onclick={() => applyFinancingOption('')}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none {appliedFinancingOption.length ===
				0
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:bg-border/30 hover:text-text'}"
			>
				{m.all()}
			</button>
			<button
				type="button"
				onclick={() => applyFinancingOption('ZIN')}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none {appliedFinancingOption[0] ===
				'ZIN'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:bg-border/30 hover:text-text'}"
			>
				ZIN
			</button>
			<button
				type="button"
				onclick={() => applyFinancingOption('PGB')}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none {appliedFinancingOption[0] ===
				'PGB'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:bg-border/30 hover:text-text'}"
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
			<p class="text-xs font-medium text-text-muted">
				{m.file_number_label()}: {row.clientFileNumber || '—'}
			</p>
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
			<p class="text-xs font-semibold text-success-strong">
				{m.days_left({ days: row.daysLeft })}
			</p>
		{:else}
			<p class="text-xs font-semibold text-error-strong">
				{m.expired_days_ago({ days: -row.daysLeft })}
			</p>
		{/if}
	</div>
{/snippet}

{#snippet actionsCell(row: ContractsRow)}
	<div class="flex justify-end">
		<a
			href={resolve('/(app)/contracts/[id]', { id: row.id })}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
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
		class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand/10 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<FileText class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-text">{m.contracts()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.contracts_page_description()}
				</p>
			</div>

			<PermissionGuard permission={PERMISSIONS.CONTRACT.CREATE}>
				<Button class="gap-2" onclick={() => (showCreateContract = true)}>
					<Plus class="h-4 w-4" />
					{m.create_contract()}
				</Button>
			</PermissionGuard>
		</div>
	</header>

	<PermissionGuard permission={PERMISSIONS.CONTRACT.CREATE}>
		<CreateContractForm bind:open={showCreateContract} onCreated={refreshContracts} />
	</PermissionGuard>

	{#await contractsDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
			{#each Array.from({ length: 4 }, (_, index) => index) as index (index)}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
					<div class="h-3 w-28 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		</div>

		<DataTable
			{columns}
			rows={[]}
			loading
			pagination={{
				mode: 'server',
				page: currentPage,
				pageSize,
				totalCount: 0,
				onPageChange: (nextPage) =>
					updateQuery(nextPage, { ...initial.filters, clientName: '', senderName: '' })
			}}
			rowKey="id"
			title={m.contracts()}
			description={m.contracts_table_description()}
			toolbar={tableFilters}
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
		{#if !contractsData.loadError}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label={m.total_contracts()}
					value={contractsData.stats.total}
					description={m.all_matching_records()}
					icon={FileText}
				/>
				<StatCard
					label={m.approved()}
					value={contractsData.stats.approved}
					description={m.current_page()}
					icon={CheckCircle2}
					color="emerald"
				/>
				<StatCard
					label={m.draft()}
					value={contractsData.stats.draft}
					description={m.current_page()}
					icon={Timer}
					color="amber"
				/>
				<StatCard
					label={m.expiring_soon()}
					value={contractsData.stats.expiringSoon}
					description={m.current_page()}
					icon={Clock}
					color="rose"
				/>
			</div>
		{/if}

		<DataTable
			{columns}
			rows={contractsData.rows}
			pagination={{
				mode: 'server',
				page: contractsData.pagination.page,
				pageSize: contractsData.pagination.pageSize,
				totalCount: contractsData.pagination.count,
				onPageChange: (nextPage) =>
					updateQuery(nextPage, { ...initial.filters, clientName: '', senderName: '' })
			}}
			rowKey="id"
			title={m.contracts()}
			description={m.contracts_table_description()}
			toolbar={tableFilters}
			error={contractsData.loadError ?? undefined}
			onRetry={refreshContracts}
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
