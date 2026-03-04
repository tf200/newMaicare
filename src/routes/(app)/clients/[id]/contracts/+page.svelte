<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		ArrowLeft,
		Calendar,
		ChevronRight,
		Clock3,
		HandCoins,
		ShieldCheck,
		ScrollText
	} from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type { ListClientContractsResponse } from '$lib/types/api';
	import type { ClientContractsLoadResult } from './+page';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
			};
			contractsData: Promise<ClientContractsLoadResult>;
		};
	}>();

	const contractsDataPromise = $derived(data.contractsData);
	const initial = $derived(data.initial);

	const columns: DataTableColumn[] = [
		{ key: 'care', label: 'Care', width: '260px' },
		{ key: 'financing', label: 'Financing', width: '180px' },
		{ key: 'period', label: 'Period', width: '230px' },
		{ key: 'days', label: 'Days Left', align: 'right', width: '120px' }
	];

	const formatDate = (date: string) =>
		new Intl.DateTimeFormat('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(date));

	const buildQuery = (nextPage: number, nextPageSize: number) => {
		const searchParams = new URLSearchParams();
		searchParams.set('page', String(nextPage));
		searchParams.set('page_size', String(nextPageSize));
		return searchParams.toString();
	};

	const updatePage = (nextPage: number) => {
		const query = buildQuery(nextPage, initial.pageSize);
		if (page.url.searchParams.toString() === query) return;
		goto(`?${query}`, { replaceState: true, keepFocus: true, noScroll: true });
	};
</script>

<svelte:head>
	<title>Client Contracts | MaiCare</title>
</svelte:head>

{#snippet careCell(contract: ListClientContractsResponse)}
	<div class="space-y-1">
		<p class="text-sm font-semibold text-text">{contract.care_name}</p>
		<p class="text-xs font-medium text-text-muted capitalize">{contract.care_type}</p>
	</div>
{/snippet}

{#snippet financingCell(contract: ListClientContractsResponse)}
	<div class="space-y-1">
		<div class="flex items-center gap-2 text-sm font-semibold text-text">
			<HandCoins class="h-4 w-4 text-text-muted" />
			<span>{contract.financing_act}</span>
		</div>
		<div class="flex items-center gap-2 text-xs font-medium text-text-muted">
			<ShieldCheck class="h-3.5 w-3.5 text-text-subtle" />
			<span>{contract.financing_option}</span>
		</div>
	</div>
{/snippet}

{#snippet periodCell(contract: ListClientContractsResponse)}
	<div class="space-y-1">
		<div class="flex items-center gap-2 text-sm font-semibold text-text">
			<Calendar class="h-4 w-4 text-text-muted" />
			<span>{formatDate(contract.start_date)}</span>
		</div>
		<div class="flex items-center gap-2 text-xs font-medium text-text-muted">
			<Clock3 class="h-3.5 w-3.5 text-text-subtle" />
			<span>{formatDate(contract.end_date)}</span>
		</div>
	</div>
{/snippet}

{#snippet daysCell(contract: ListClientContractsResponse)}
	{#if contract.days_left >= 0}
		<span class="text-sm font-semibold text-emerald-600">{contract.days_left}</span>
	{:else}
		<span class="text-sm font-semibold text-rose-600">{contract.days_left}</span>
	{/if}
{/snippet}

<section class="space-y-6 pb-12">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-indigo-100/70 to-violet-100/20 blur-2xl"
		></div>
		<div class="relative space-y-2">
			<nav class="flex items-center gap-2 text-sm font-medium text-text-subtle">
				<a href="/clients" class="flex items-center gap-1 transition-colors hover:text-text">
					<ArrowLeft class="h-4 w-4" />
					Clients
				</a>
				<ChevronRight class="h-4 w-4" />
				<a href={`/clients/${page.params.id}`} class="transition-colors hover:text-text"
					>Client Detail</a
				>
				<ChevronRight class="h-4 w-4" />
				<span class="text-text">Contracts</span>
			</nav>
			<div class="flex items-center gap-3 text-sm font-semibold text-brand">
				<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
					<ScrollText class="h-5 w-5" />
				</span>
				<span>Client Administration</span>
			</div>
			<h1 class="text-3xl font-bold tracking-tighter text-text">Contracts</h1>
			<p class="max-w-2xl text-sm font-medium text-text-muted">
				Overview of all contracts for this client.
			</p>
		</div>
	</header>

	{#await contractsDataPromise}
		<DataTable
			{columns}
			rows={[]}
			loading
			currentPage={initial.page}
			pageSize={initial.pageSize}
			totalCount={0}
			onPageChange={updatePage}
			title="Client Contracts"
			description="Contracts linked to this client account."
			cells={{ care: careCell, financing: financingCell, period: periodCell, days: daysCell }}
		/>
	{:then contractsData}
		{#if contractsData.loadError}
			<InlineErrorBanner message={contractsData.loadError} />
		{/if}

		<DataTable
			{columns}
			rows={contractsData.rows}
			currentPage={contractsData.pagination.page}
			pageSize={contractsData.pagination.pageSize}
			totalCount={contractsData.pagination.count}
			onPageChange={updatePage}
			title="Client Contracts"
			description="Contracts linked to this client account."
			emptyTitle="No contracts found"
			emptyDescription="There are no contracts available for this client yet."
			emptyActionLabel="No action"
			emptyActionDisabled
			cells={{ care: careCell, financing: financingCell, period: periodCell, days: daysCell }}
		/>
	{/await}
</section>
