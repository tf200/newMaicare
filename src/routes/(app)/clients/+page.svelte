<script lang="ts">
	import {
		UsersRound,
		Search,
		Eye,
		MapPin,
		Target,
		AlertTriangle,
		Building2,
		Activity,
		Clock
	} from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import FilterPills, { type FilterPill } from '$lib/components/ui/FilterPills.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import { listLocations } from '$lib/api/locations';
	import type { ClientStatus } from '$lib/types/api';
	import type {
		ClientsFilters,
		ClientsLoadResult,
		ClientsRow,
		ClientStatusCountsLoadResult
	} from './+page';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: ClientsFilters;
			};
			clientsData: Promise<ClientsLoadResult>;
			countsData: Promise<ClientStatusCountsLoadResult>;
		};
	}>();

	const clientsDataPromise = $derived(data.clientsData);
	const countsDataPromise = $derived(data.countsData);
	const initial = $derived(data.initial);
	const currentPage = $derived(initial.page);
	const pageSize = $derived(initial.pageSize);

	const appliedSearch = $derived((initial.filters.search ?? '').trim());
	const appliedStatus = $derived((initial.filters.status ?? '') as ClientStatus | '');
	const appliedLocationId = $derived((initial.filters.locationId ?? '').trim());

	let selectedLocationId = $state('');

	$effect(() => {
		selectedLocationId = appliedLocationId;
	});

	$effect(() => {
		// Only trigger update if the user changed the selection in the UI
		if (selectedLocationId !== appliedLocationId) {
			applyLocation(selectedLocationId);
		}
	});

	const columns: DataTableColumn[] = [
		{ key: 'client', label: m.client(), headerClass: 'pl-14' },
		{ key: 'fileNumber', label: m.file_number_label(), width: '130px' },
		{ key: 'status', label: m.status(), width: '160px' },
		{ key: 'careType', label: m.care_type(), width: '180px' },
		{ key: 'locationName', label: m.location(), width: '220px' },
		{ key: 'metrics', label: m.goals_risks(), width: '170px', align: 'center' },
		{ key: 'actions', label: '', align: 'right', width: '70px' }
	];

	const formatCareType = (value: string) => {
		if (value === '—') return value;
		return value
			.split('_')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');
	};

	const statusMeta: Record<ClientStatus, { label: string; className: string }> =
		{
			in_care: {
				label: m.status_in_care(),
				className:
					'bg-emerald-600 text-white border border-emerald-700/60 shadow-sm shadow-emerald-700/30'
			},
			on_waiting_list: {
				label: m.status_waiting_list(),
				className:
					'bg-amber-500 text-white border border-amber-600/60 shadow-sm shadow-amber-600/30'
			},
			scheduled_in_care: {
				label: m.status_scheduled_in_care(),
				className: 'bg-blue-600 text-white border border-blue-700/60 shadow-sm shadow-blue-700/30'
			},
			scheduled_out_of_care: {
				label: m.status_scheduled_out_of_care(),
				className: 'bg-rose-600 text-white border border-rose-700/60 shadow-sm shadow-rose-700/30'
			},
			out_of_care: {
				label: m.status_out_of_care(),
				className:
					'bg-slate-500 text-white border border-slate-600/60 shadow-sm shadow-slate-600/30'
			}
		};

	const statusFilterPills: FilterPill[] = [
		{ id: '', label: m.all() },
		{ id: 'in_care', label: m.status_in_care(), color: 'emerald' },
		{ id: 'on_waiting_list', label: m.status_waiting_list(), color: 'amber' },
		{ id: 'scheduled_in_care', label: m.status_scheduled_in_care(), color: 'blue' },
		{ id: 'scheduled_out_of_care', label: m.status_scheduled_out_of_care(), color: 'rose' },
		{ id: 'out_of_care', label: m.status_out_of_care(), color: 'slate' }
	];

	const buildQuery = (
		pageValue: number,
		searchValue: string,
		statusValue: ClientStatus | '',
		locationIdValue: string
	) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));

		if (searchValue) params.set('search', searchValue);
		if (statusValue) params.set('status', statusValue);
		if (locationIdValue) params.set('location_id', locationIdValue);

		return params.toString();
	};

	const updateQuery = (
		pageValue: number,
		searchValue: string,
		statusValue: ClientStatus | '',
		locationIdValue: string
	) => {
		const nextQuery = buildQuery(pageValue, searchValue, statusValue, locationIdValue);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const applySearch = (searchValue: string) => {
		updateQuery(1, searchValue.trim(), appliedStatus, appliedLocationId);
	};

	const applyStatus = (status: ClientStatus | '') => {
		updateQuery(1, appliedSearch, status, appliedLocationId);
	};

	const applyLocation = (locationId: string) => {
		updateQuery(1, appliedSearch, appliedStatus, locationId.trim());
	};

	const openClientDetail = (row: ClientsRow) => {
		goto(`/clients/${row.id}`);
	};
</script>

<svelte:head>
	<title>{m.clients_page_title()}</title>
</svelte:head>

{#snippet locationItem(option: any)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex flex-col gap-0.5 text-xs text-text-muted">
			<span>{option.street} {option.house_number}, {option.city}</span>
			<span class={option.available > 0 ? 'text-emerald-600' : 'text-rose-600'}>
				{m.spots_available({ count: option.available })}
			</span>
		</div>
	</div>
{/snippet}

{#snippet tableFilters()}
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative w-full sm:w-auto">
				<Search
					class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
				/>
				<input
					type="search"
					class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
					placeholder={m.search_clients()}
					value={appliedSearch}
					onkeydown={(event) => {
						if (event.key === 'Enter') {
							applySearch((event.currentTarget as HTMLInputElement).value);
						}
					}}
					onblur={(event) => applySearch((event.currentTarget as HTMLInputElement).value)}
				/>
			</div>

			<div class="w-full sm:w-64">
				<SearchSelect
					bind:value={selectedLocationId}
					loadOptions={async (query) => {
						const res = await listLocations({ search: query, pageSize: 20 });
						return res.data.results;
					}}
					labelFn={(loc) => loc.name}
					valueFn={(loc) => loc.id}
					item={locationItem}
					placeholder={m.all_locations()}
					searchPlaceholder={m.search_locations_placeholder()}
					compact
				/>
			</div>
		</div>

		<FilterPills pills={statusFilterPills} activeId={appliedStatus} onSelect={(id) => applyStatus(id as ClientStatus | '')} />
	</div>
{/snippet}

{#snippet clientCell(row: ClientsRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<UsersRound class="h-5 w-5" />
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.firstName} {row.lastName}</p>
			<p class="text-xs text-text-muted">{m.bsn()}: {row.bsn || '—'}</p>
		</div>
	</div>
{/snippet}

{#snippet fileNumberCell(row: ClientsRow)}
	<span class="font-mono text-xs font-semibold text-text">{row.fileNumber || '—'}</span>
{/snippet}

{#snippet statusCell(row: ClientsRow)}
	{@const meta = statusMeta[row.status]}
	<span
		class="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold {meta.className}"
	>
		{meta.label}
	</span>
{/snippet}

{#snippet careTypeCell(row: ClientsRow)}
	<span class="text-sm font-semibold text-text">{formatCareType(row.careType)}</span>
{/snippet}

{#snippet locationCell(row: ClientsRow)}
	<div class="flex items-center gap-2 text-sm font-semibold text-text">
		<MapPin class="h-4 w-4 text-text-muted" />
		<span>{row.locationName}</span>
	</div>
{/snippet}

{#snippet metricsCell(row: ClientsRow)}
	<div class="inline-flex items-center gap-2">
		<span
			class="inline-flex items-center gap-1 rounded-full border border-sky-700/50 bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white"
		>
			<Target class="h-3 w-3" />
			{row.goalsCount}
		</span>
		<span
			class="inline-flex items-center gap-1 rounded-full border border-rose-700/50 bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white"
		>
			<AlertTriangle class="h-3 w-3" />
			{row.riskCount}
		</span>
	</div>
{/snippet}

{#snippet actionsCell(row: ClientsRow)}
	<div class="flex justify-end gap-1">
		<a
			href={`/clients/${row.id}`}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.view_details()}
			aria-label={m.view_details()}
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
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-indigo-100/70 to-violet-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<UsersRound class="h-5 w-5" />
					</span>
					<span>{m.client_management()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.clients()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.client_index_description()}
				</p>
			</div>
		</div>
	</header>

	{#await clientsDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each [1, 2, 3, 4] as i (i)}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-28 animate-pulse rounded bg-border/70"></div>
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
			onPageChange={(nextPage) =>
				updateQuery(nextPage, appliedSearch, appliedStatus, appliedLocationId)}
			onRowClick={openClientDetail}
			rowKey="id"
			title={m.clients()}
			description={m.clients_table_description()}
			filters={tableFilters}
			cells={{
				client: clientCell,
				fileNumber: fileNumberCell,
				status: statusCell,
				careType: careTypeCell,
				locationName: locationCell,
				metrics: metricsCell,
				actions: actionsCell
			}}
		/>
	{:then clientsData}
		{#if clientsData.loadError}
			<InlineErrorBanner message={clientsData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard
				label={m.total_clients()}
				value={clientsData.stats.total}
				description={m.client()}
				icon={Activity}
			/>

			{#await countsDataPromise}
				{#each [1, 2, 3] as i (i)}
					<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
						<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
						<div class="mt-3 h-8 w-14 animate-pulse rounded bg-border/70"></div>
					</div>
				{/each}
			{:then countsData}
				<StatCard
					label={m.in_or_scheduled_in_care()}
					value={countsData.counts.clientsInOrScheduledInCare}
					description={m.in_or_scheduled_in_care_description()}
					icon={UsersRound}
					color="emerald"
					valueAccent={false}
				/>
				<StatCard
					label={m.waiting_list()}
					value={countsData.counts.clientsOnWaitingList}
					description={m.waiting_list_description()}
					icon={Clock}
					color="amber"
					valueAccent={false}
				/>
				<StatCard
					label={m.out_or_scheduled_out()}
					value={countsData.counts.clientsOutOrScheduledOutOfCare}
					description={m.out_or_scheduled_out_description()}
					icon={Building2}
					color="slate"
					valueAccent={false}
				/>
			{/await}
		</div>

		{#await countsDataPromise then countsData}
			{#if countsData.loadError}
				<InlineErrorBanner message={countsData.loadError} onRetry={() => invalidateAll()} />
			{/if}
		{/await}

		<DataTable
			{columns}
			rows={clientsData.rows}
			currentPage={clientsData.pagination.page}
			pageSize={clientsData.pagination.pageSize}
			totalCount={clientsData.pagination.count}
			onPageChange={(nextPage) =>
				updateQuery(nextPage, appliedSearch, appliedStatus, appliedLocationId)}
			onRowClick={openClientDetail}
			rowKey="id"
			title={m.clients()}
			description={m.clients_table_description()}
			emptyTitle={appliedSearch || appliedStatus || appliedLocationId
				? m.empty_no_results_title()
				: m.empty_clients_title()}
			emptyDescription={appliedSearch || appliedStatus || appliedLocationId
				? m.empty_no_results_description()
				: m.empty_clients_description()}
			emptyActionLabel={appliedSearch || appliedStatus || appliedLocationId
				? m.empty_no_results_action()
				: m.empty_clients_action()}
			emptyAction={appliedSearch || appliedStatus || appliedLocationId
				? () => updateQuery(1, '', '', '')
				: () => goto('/clients')}
			filters={tableFilters}
			cells={{
				client: clientCell,
				fileNumber: fileNumberCell,
				status: statusCell,
				careType: careTypeCell,
				locationName: locationCell,
				metrics: metricsCell,
				actions: actionsCell
			}}
		/>
	{/await}
</section>
