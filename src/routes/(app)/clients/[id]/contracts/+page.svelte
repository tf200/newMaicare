<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Calendar, Clock3, Eye, HandCoins, Plus, ShieldCheck, ScrollText } from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import CreateContractForm from '$lib/components/forms/CreateContractForm.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type { ListClientContractsResponse } from '$lib/types/api';
	import type { ClientDetailLoadResult } from '../+layout';
	import type { ClientContractsLoadResult } from './+page';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
			};
			contractsData: Promise<ClientContractsLoadResult>;
			clientId: string;
			clientData: Promise<ClientDetailLoadResult>;
		};
	}>();

	const contractsDataPromise = $derived(data.contractsData);
	const initial = $derived(data.initial);
	const clientId = $derived(data.clientId ?? page.params.id ?? '');
	const auth = getAuthState();
	const canCreateContract = $derived(auth.hasPermission(PERMISSIONS.CONTRACT.CREATE));
	const canViewContract = $derived(auth.hasPermission(PERMISSIONS.CONTRACT.VIEW));

	let showCreateContract = $state(false);
	let clientDisplayName = $state('');

	$effect(() => {
		let cancelled = false;
		clientDisplayName = '';
		void data.clientData.then((result: ClientDetailLoadResult) => {
			if (cancelled) return;
			clientDisplayName = result.clientName;
		});
		return () => {
			cancelled = true;
		};
	});

	const refreshClientContracts = () =>
		Promise.all([
			invalidate(`app:client:${clientId}:contracts`),
			invalidate(`app:client:${clientId}:detail`)
		]);

	const breadcrumbs = getBreadcrumbsState();
	$effect(() => {
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: '/dashboard' },
			{ label: m.clients(), href: '/clients' },
			{
				label: clientDisplayName || m.breadcrumb_client_detail(),
				href: `/clients/${page.params.id}`
			},
			{ label: m.contracts() }
		];
		return () => {
			breadcrumbs.items = [];
		};
	});

	const columns: DataTableColumn[] = [
		{ key: 'care', label: m.care(), width: '260px' },
		{ key: 'financing', label: m.financing(), width: '180px' },
		{ key: 'period', label: m.period(), width: '230px' },
		{ key: 'days', label: m.days_left_label(), align: 'right', width: '120px' },
		{ key: 'actions', label: '', align: 'right', width: '70px' }
	];

	const formatDate = (date: string) =>
		new Intl.DateTimeFormat('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(date));

	const buildQuery = (nextPage: number, nextPageSize: number) => {
		const searchParams = new SvelteURLSearchParams();
		searchParams.set('page', String(nextPage));
		searchParams.set('page_size', String(nextPageSize));
		return searchParams.toString();
	};

	const updatePage = (nextPage: number) => {
		const query = buildQuery(nextPage, initial.pageSize);
		if (page.url.searchParams.toString() === query) return;
		// The query string is constructed separately so pagination remains in the URL.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(resolve('/(app)/clients/[id]/contracts', { id: page.params.id ?? '' }) + `?${query}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};
</script>

<svelte:head>
	<title>{m.client_contracts()} | MaiCare</title>
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

{#snippet actionsCell(contract: ListClientContractsResponse)}
	<div class="flex justify-end">
		{#if contract.id}
			<PermissionGuard permission={PERMISSIONS.CONTRACT.VIEW}>
				<a
					href={resolve('/(app)/contracts/[id]', { id: contract.id })}
					class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
					title={m.view_details()}
					aria-label={m.view_details()}
				>
					<Eye class="h-4 w-4" />
				</a>
			</PermissionGuard>
		{/if}
	</div>
{/snippet}

<section class="space-y-6 pb-12">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-indigo-100/70 to-violet-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-2">
				<div class="hidden"></div>
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<ScrollText class="h-5 w-5" />
					</span>
					<span>{m.client_administration()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.contracts()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.contracts_overview()}
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
		<CreateContractForm
			bind:open={showCreateContract}
			preselectedClientId={clientId}
			preselectedClientDisplay={clientDisplayName}
			onCreated={refreshClientContracts}
		/>
	</PermissionGuard>

	{#await contractsDataPromise}
		<DataTable
			{columns}
			rows={[]}
			loading
			currentPage={initial.page}
			pageSize={initial.pageSize}
			totalCount={0}
			onPageChange={updatePage}
			title={m.client_contracts()}
			description={m.client_contracts_description()}
			cells={{
				care: careCell,
				financing: financingCell,
				period: periodCell,
				days: daysCell,
				actions: actionsCell
			}}
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
			onRowClick={canViewContract
				? (row) => {
						if (row.id) goto(resolve('/(app)/contracts/[id]', { id: row.id }));
					}
				: undefined}
			title={m.client_contracts()}
			description={m.client_contracts_description()}
			emptyTitle={m.no_contracts_found()}
			emptyDescription={m.no_contracts_description()}
			emptyActionLabel={m.create_contract()}
			emptyAction={() => (showCreateContract = true)}
			emptyActionDisabled={!canCreateContract}
			cells={{
				care: careCell,
				financing: financingCell,
				period: periodCell,
				days: daysCell,
				actions: actionsCell
			}}
		/>
	{/await}
</section>
