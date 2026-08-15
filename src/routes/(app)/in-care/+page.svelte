<script lang="ts">
	import { Eye, HeartHandshake, MapPin, Search, Users, Calendar, Clock } from 'lucide-svelte';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import FilterPills, { type FilterPill } from '$lib/components/ui/FilterPills.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import type { PageProps } from './$types';
	import type { InCareFilters, InCareRow } from './+page';

	let { data }: PageProps = $props();

	const inCareDataPromise = $derived.by(() => data.inCareData);
	const inCareStatsPromise = $derived.by(() => data.inCareStats);
	const initial = $derived.by(() => data.initial);
	const currentPage = $derived.by(() => initial.page);
	const pageSize = $derived.by(() => initial.pageSize);
	const sort = $derived.by(() => initial.sort);
	const appliedSearch = $derived.by(() => (initial.filters.search ?? '').trim());
	const appliedStatuses = $derived.by(() => initial.filters.status ?? []);
	const selectedStatus = $derived.by(() =>
		appliedStatuses.length === 1 ? appliedStatuses[0] : ''
	);

	const columns: DataTableColumn[] = [
		{ key: 'client', label: m.client(), headerClass: 'pl-16' },
		{ key: 'status', label: m.status(), width: '150px' },
		{ key: 'contract', label: m.contract(), width: '140px', align: 'center' },
		{ key: 'coordinator', label: m.coordinator() },
		{ key: 'startDate', label: m.care_start_date(), width: '160px', align: 'center' },
		{
			key: 'daysInCare',
			label: m.days_in_care(),
			width: '150px',
			align: 'center',
			sortable: true
		},
		{ key: 'location', label: m.location(), width: '220px' },
		{ key: 'actions', label: '', width: '60px', align: 'right' }
	];

	const statusMeta: Record<InCareRow['status'], { label: string; className: string }> = {
		in_care: {
			label: m.in_care(),
			className: 'border border-success/30 bg-success/10 text-success'
		},
		scheduled_in_care: {
			label: m.scheduled(),
			className: 'border border-info/30 bg-info/10 text-info'
		}
	};

	const inCareFilterPills: FilterPill[] = [
		{ id: '', label: m.all() },
		{ id: 'in_care', label: m.in_care(), color: 'emerald' },
		{ id: 'scheduled_in_care', label: m.scheduled(), color: 'blue' }
	];

	const buildQuery = (
		pageValue: number,
		searchValue: string,
		statuses: InCareFilters['status'],
		sortDir: 'asc' | 'desc'
	) => {
		const params = new SvelteURLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		params.set('sort_days_in_care', sortDir);

		if (searchValue) params.set('search', searchValue);
		for (const status of statuses) params.append('status', status);

		return params.toString();
	};

	const updateQuery = (
		pageValue: number,
		searchValue: string,
		statuses: InCareFilters['status'],
		sortDir: 'asc' | 'desc'
	) => {
		const nextQuery = buildQuery(pageValue, searchValue, statuses, sortDir);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(resolve(localizeHref(resolve(`/(app)/in-care?${nextQuery}`)) as '/in-care/'), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	const applySearch = (searchValue: string) => {
		updateQuery(1, searchValue.trim(), appliedStatuses, sort.direction);
	};

	const applyStatus = (status: string) => {
		const nextStatuses: InCareFilters['status'] =
			status === 'in_care' || status === 'scheduled_in_care' ? [status] : [];
		updateQuery(1, appliedSearch, nextStatuses, sort.direction);
	};

	const handleSort = (column: string, direction: 'asc' | 'desc') => {
		if (column !== 'daysInCare') return;
		updateQuery(currentPage, appliedSearch, appliedStatuses, direction);
	};

	const formatDate = (date: string | null) => {
		if (!date) return '—';
		return new Intl.DateTimeFormat(getLocale() === 'nl' ? 'nl-NL' : 'en-GB', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(date));
	};
</script>

<svelte:head>
	<title>{m.in_care_page_title()}</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<label class="sr-only" for="in-care-search">{m.search_in_care()}</label>
			<Search
				aria-hidden="true"
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				id="in-care-search"
				type="search"
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				placeholder={m.search_in_care_placeholder()}
				value={appliedSearch}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						event.currentTarget.blur();
					}
				}}
				onblur={(event) => applySearch(event.currentTarget.value)}
			/>
		</div>

		<FilterPills pills={inCareFilterPills} activeId={selectedStatus} onSelect={applyStatus} />
	</div>
{/snippet}

{#snippet clientCell(row: InCareRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<HeartHandshake aria-hidden="true" class="h-5 w-5" />
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.clientFirstName} {row.clientLastName}</p>
			<p class="text-xs text-text-muted">{m.bsn()}: {row.clientBsnNumber ?? '—'}</p>
		</div>
	</div>
{/snippet}

{#snippet statusCell(row: InCareRow)}
	{@const meta = statusMeta[row.status]}
	<span
		class="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold {meta.className}"
	>
		{meta.label}
	</span>
{/snippet}

{#snippet contractCell(row: InCareRow)}
	<span
		class="inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold {row.contractActive
			? 'border-success/30 bg-success/10 text-success'
			: 'border-border bg-border/40 text-text-muted'}"
	>
		{row.contractActive ? m.active() : m.no_contract()}
	</span>
{/snippet}

{#snippet actionsCell(row: InCareRow)}
	<div class="flex justify-end gap-1">
		<a
			href={resolve(
				localizeHref(resolve('/(app)/clients/[id]', { id: row.id })) as `/clients/${string}/`
			)}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
			title={m.view_details()}
			aria-label={m.view_details()}
		>
			<Eye aria-hidden="true" class="h-4 w-4" />
		</a>
	</div>
{/snippet}

{#snippet startDateCell(row: InCareRow)}
	<span class="text-sm font-semibold text-text">{formatDate(row.startDate)}</span>
{/snippet}

{#snippet locationCell(row: InCareRow)}
	<div class="flex items-center gap-2 text-sm font-semibold text-text">
		<MapPin aria-hidden="true" class="h-4 w-4 text-text-muted" />
		<span>{row.location}</span>
	</div>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-success/20 to-brand/10 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<HeartHandshake aria-hidden="true" class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-text">{m.in_care()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.in_care_header_description()}
				</p>
			</div>
		</div>
	</header>

	{#await inCareStatsPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each [1, 2, 3, 4] as item (item)}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		</div>
	{:then inCareStats}
		{#if inCareStats.loadError}
			<InlineErrorBanner
				message={inCareStats.loadError}
				onRetry={() => invalidate('app:in-care:stats')}
			/>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label={m.total_in_care()}
					value={inCareStats.total}
					description={m.clients()}
					icon={Users}
					color="brand"
				/>
				<StatCard
					label={m.in_care()}
					value={inCareStats.clientsInCare}
					description={m.currently_in_care()}
					icon={HeartHandshake}
					color="emerald"
				/>
				<StatCard
					label={m.scheduled()}
					value={inCareStats.clientsScheduledInCare}
					description={m.scheduled_for_intake()}
					icon={Calendar}
					color="blue"
				/>
				<StatCard
					label={m.contracts_ending_soon()}
					value={inCareStats.contractsEndingSoon}
					description={m.within_30_days()}
					icon={Clock}
					color="rose"
				/>
			</div>
		{/if}
	{/await}

	{#await inCareDataPromise}
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
					updateQuery(nextPage, appliedSearch, appliedStatuses, sort.direction)
			}}
			sortColumn="daysInCare"
			sortDirection={sort.direction}
			onSort={handleSort}
			rowKey="id"
			title={m.in_care()}
			description={m.in_care_table_description()}
			toolbar={tableFilters}
			empty={{
				title: m.no_in_care_clients(),
				description: m.no_in_care_clients_description()
			}}
			cells={{
				client: clientCell,
				status: statusCell,
				contract: contractCell,
				startDate: startDateCell,
				location: locationCell,
				actions: actionsCell
			}}
		/>
	{:then inCareData}
		<DataTable
			{columns}
			rows={inCareData.rows}
			pagination={{
				mode: 'server',
				page: inCareData.pagination.page,
				pageSize: inCareData.pagination.pageSize,
				totalCount: inCareData.pagination.count,
				onPageChange: (nextPage) =>
					updateQuery(nextPage, appliedSearch, appliedStatuses, sort.direction)
			}}
			sortColumn="daysInCare"
			sortDirection={sort.direction}
			onSort={handleSort}
			rowKey="id"
			title={m.in_care()}
			description={m.in_care_table_description()}
			toolbar={tableFilters}
			error={inCareData.loadError ?? undefined}
			onRetry={() => invalidate('app:in-care:list')}
			empty={{
				title: m.no_in_care_clients(),
				description: m.no_in_care_clients_description()
			}}
			cells={{
				client: clientCell,
				status: statusCell,
				contract: contractCell,
				startDate: startDateCell,
				location: locationCell,
				actions: actionsCell
			}}
		/>
	{/await}
</section>
