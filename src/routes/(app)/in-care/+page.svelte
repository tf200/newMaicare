<script lang="ts">
	import { Eye, HeartHandshake, MapPin, Search } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import FilterPills, { type FilterPill } from '$lib/components/ui/FilterPills.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type { InCareFilters, InCareLoadResult, InCareRow } from './+page';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: InCareFilters;
				sort: { direction: 'asc' | 'desc' };
			};
			inCareData: Promise<InCareLoadResult>;
		};
	}>();

	const inCareDataPromise = $derived(data.inCareData);
	const initial = $derived(data.initial);
	const currentPage = $derived(initial.page);
	const pageSize = $derived(initial.pageSize);
	const sort = $derived(initial.sort);

	const appliedSearch = $derived((initial.filters.search ?? '').trim());
	const appliedStatuses = $derived(initial.filters.status ?? []);
	const selectedStatus = $derived(appliedStatuses.length === 1 ? appliedStatuses[0] : '');

	const columns: DataTableColumn[] = [
		{ key: 'client', label: 'Client', headerClass: 'pl-16' },
		{ key: 'status', label: 'Status', width: '150px' },
		{ key: 'contract', label: 'Contract', width: '140px', align: 'center' },
		{ key: 'coordinator', label: 'Coordinator' },
		{ key: 'startDate', label: 'Care Start Date', width: '160px', align: 'center' },
		{ key: 'daysInCare', label: 'Days in Care', width: '150px', align: 'center', sortable: true },
		{ key: 'location', label: 'Location', width: '220px' },
		{ key: 'actions', label: '', width: '60px', align: 'right' }
	];

	const statusMeta: Record<InCareRow['status'], { label: string; className: string }> = {
		in_care: {
			label: 'In care',
			className:
				'bg-emerald-600 text-white border border-emerald-700/60 shadow-sm shadow-emerald-700/30'
		},
		scheduled_in_care: {
			label: 'Scheduled',
			className: 'bg-blue-600 text-white border border-blue-700/60 shadow-sm shadow-blue-700/30'
		}
	};

	const inCareFilterPills: FilterPill[] = [
		{ id: '', label: 'All' },
		{ id: 'in_care', label: 'In care', color: 'emerald' },
		{ id: 'scheduled_in_care', label: 'Scheduled', color: 'blue' }
	];

	const buildQuery = (
		pageValue: number,
		searchValue: string,
		statuses: InCareRow['status'][],
		sortDir: 'asc' | 'desc'
	) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		params.set('sort_days_in_care', sortDir);

		if (searchValue) params.set('search', searchValue);
		for (const status of statuses) {
			params.append('status', status);
		}

		return params.toString();
	};

	const updateQuery = (
		pageValue: number,
		searchValue: string,
		statuses: InCareRow['status'][],
		sortDir: 'asc' | 'desc'
	) => {
		const nextQuery = buildQuery(pageValue, searchValue, statuses, sortDir);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const applySearch = (searchValue: string) => {
		updateQuery(1, searchValue.trim(), appliedStatuses, sort.direction);
	};

	const applyStatus = (status: '' | InCareRow['status']) => {
		const nextStatuses = status ? [status] : [];
		updateQuery(1, appliedSearch, nextStatuses, sort.direction);
	};

	const handleSort = (column: string, direction: 'asc' | 'desc') => {
		if (column !== 'daysInCare') return;
		updateQuery(currentPage, appliedSearch, appliedStatuses, direction);
	};

	const formatDate = (date: string | null) => {
		if (!date) return '—';
		return new Intl.DateTimeFormat('en-US', {
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
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				placeholder={m.search_in_care_placeholder()}
				value={appliedSearch}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						applySearch((event.currentTarget as HTMLInputElement).value);
					}
				}}
				onblur={(event) => applySearch((event.currentTarget as HTMLInputElement).value)}
			/>
		</div>

		<FilterPills pills={inCareFilterPills} activeId={selectedStatus} onSelect={(id) => applyStatus(id as '' | InCareRow['status'])} />
	</div>
{/snippet}

{#snippet clientCell(row: InCareRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<HeartHandshake class="h-5 w-5" />
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
	{#if row.contractActive}
		<span
			class="inline-flex items-center justify-center rounded-full border border-emerald-700/60 bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-emerald-700/30"
		>
			Active
		</span>
	{:else}
		<span
			class="inline-flex items-center justify-center rounded-full border border-slate-600/60 bg-slate-500 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-slate-600/30"
		>
			No contract
		</span>
	{/if}
{/snippet}

{#snippet actionsCell(row: InCareRow)}
	<div class="flex justify-end gap-1">
		<a
			href="/clients/{row.id}"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.view_details()}
			aria-label={m.view_details()}
		>
			<Eye class="h-4 w-4" />
		</a>
	</div>
{/snippet}

{#snippet startDateCell(row: InCareRow)}
	<span class="text-sm font-semibold text-text">{formatDate(row.startDate)}</span>
{/snippet}

{#snippet locationCell(row: InCareRow)}
	<div class="flex items-center gap-2 text-sm font-semibold text-text">
		<MapPin class="h-4 w-4 text-text-muted" />
		<span>{row.location}</span>
	</div>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-emerald-100/70 to-indigo-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<HeartHandshake class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.in_care()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					Manage and monitor clients currently receiving care or scheduled for intake.
				</p>
			</div>
		</div>
	</header>

	{#await inCareDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
				<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
				<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
			</div>
		</div>

		<DataTable
			{columns}
			rows={[]}
			loading
			{currentPage}
			{pageSize}
			totalCount={0}
			sortColumn="daysInCare"
			sortDirection={sort.direction}
			onPageChange={(nextPage) =>
				updateQuery(nextPage, appliedSearch, appliedStatuses, sort.direction)}
			onSort={handleSort}
			rowKey="id"
			title={m.in_care()}
			description="Active clients who are receiving care or scheduled for upcoming intake."
			filters={tableFilters}
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
		{#if inCareData.loadError}
			<InlineErrorBanner message={inCareData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					Total In Care
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
					{inCareData.stats.total}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">{m.clients()}</p>
			</div>
		</div>

		<DataTable
			{columns}
			rows={inCareData.rows}
			currentPage={inCareData.pagination.page}
			pageSize={inCareData.pagination.pageSize}
			totalCount={inCareData.pagination.count}
			sortColumn="daysInCare"
			sortDirection={sort.direction}
			onPageChange={(nextPage) =>
				updateQuery(nextPage, appliedSearch, appliedStatuses, sort.direction)}
			onSort={handleSort}
			rowKey="id"
			title={m.in_care()}
			description="Active clients who are receiving care or scheduled for upcoming intake."
			filters={tableFilters}
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
