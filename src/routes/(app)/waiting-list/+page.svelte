<script lang="ts">
	import { ClipboardList, Search, AlertTriangle, Eye, HeartHandshake } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import PutClientInCareForm from '$lib/components/forms/PutClientInCareForm.svelte';
	import type { WaitingListFilters, WaitingListLoadResult, WaitingListRow } from './+page';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: WaitingListFilters;
				sort: { direction: 'asc' | 'desc' };
			};
			waitingListData: Promise<WaitingListLoadResult>;
		};
	}>();

	const waitingListDataPromise = $derived.by(() => data.waitingListData);
	const initial = $derived.by(() => data.initial);
	const currentPage = $derived.by(() => initial.page);
	const pageSize = $derived.by(() => initial.pageSize);
	const sort = $derived.by(() => initial.sort);
	let isPutInCareModalOpen = $state(false);
	let selectedClientId = $state<string | null>(null);

	const appliedSearch = $derived.by(() => (initial.filters.search ?? '').trim());
	const appliedAdmissionType = $derived.by(() => (initial.filters.admissionType ?? '').trim());
	const appliedPlacement = $derived.by(() => (initial.filters.placement ?? '').trim());

	const columns: DataTableColumn[] = [
		{ key: 'client', label: m.client(), headerClass: 'pl-14' },
		{ key: 'careType', label: m.care_type() },
		{ key: 'senderName', label: 'Sender' },
		{
			key: 'daysInWaitingList',
			label: 'Days Waiting',
			align: 'center',
			width: '150px',
			sortable: true
		},
		{ key: 'admissionType', label: m.admission_type(), width: '130px' },
		{ key: 'actions', label: '', align: 'right', width: '110px' }
	];

	const formatClientName = (row: WaitingListRow) =>
		`${row.clientFirstName} ${row.clientLastName}`.trim();

	const buildQuery = (
		pageValue: number,
		searchValue: string,
		admissionTypeValue: string,
		placementValue: string,
		sortDir: 'asc' | 'desc'
	) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		params.set('sort_days', sortDir);

		if (searchValue) params.set('search', searchValue);
		if (admissionTypeValue) params.set('admission_type', admissionTypeValue);
		if (placementValue) params.set('placement', placementValue);

		return params.toString();
	};

	const updateQuery = (
		pageValue: number,
		searchValue: string,
		admissionTypeValue: string,
		placementValue: string,
		sortDir: 'asc' | 'desc'
	) => {
		const nextQuery = buildQuery(
			pageValue,
			searchValue,
			admissionTypeValue,
			placementValue,
			sortDir
		);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const applySearch = (searchValue: string) => {
		updateQuery(1, searchValue.trim(), appliedAdmissionType, appliedPlacement, sort.direction);
	};

	const applyFilter = (type: string) => {
		updateQuery(1, appliedSearch, type, appliedPlacement, sort.direction);
	};

	const handleSort = (column: string, direction: 'asc' | 'desc') => {
		if (column !== 'daysInWaitingList') return;
		updateQuery(currentPage, appliedSearch, appliedAdmissionType, appliedPlacement, direction);
	};

	const openPutInCareModal = (row: WaitingListRow) => {
		selectedClientId = row.id;
		isPutInCareModalOpen = true;
	};

	const admissionTypeMeta: Record<
		WaitingListRow['admissionType'],
		{ label: string; className: string }
	> = {
		crisis: {
			label: 'Crisis',
			className: 'bg-rose-600 text-white border border-rose-700/60 shadow-sm shadow-rose-700/30'
		},
		regular: {
			label: 'Regular',
			className: 'bg-blue-600 text-white border border-blue-700/60 shadow-sm shadow-blue-700/30'
		},
		unknown: {
			label: 'Unknown',
			className: 'bg-border text-text-muted border border-border'
		}
	};

	const careTypeMeta: Record<WaitingListRow['careType'], { label: string; className: string }> = {
		protected_living: {
			label: 'Protected living',
			className:
				'bg-emerald-600 text-white border border-emerald-700/60 shadow-sm shadow-emerald-700/30'
		},
		training_center: {
			label: 'Training center',
			className:
				'bg-violet-600 text-white border border-violet-700/60 shadow-sm shadow-violet-700/30'
		},
		supported_independent_living: {
			label: 'Supported independent living',
			className: 'bg-sky-600 text-white border border-sky-700/60 shadow-sm shadow-sky-700/30'
		},
		ambulatory_support: {
			label: 'Ambulatory support',
			className: 'bg-amber-500 text-white border border-amber-600/60 shadow-sm shadow-amber-600/30'
		},
		other: {
			label: 'Other',
			className: 'bg-zinc-600 text-white border border-zinc-700/60 shadow-sm shadow-zinc-700/30'
		},
		unknown: {
			label: 'Unknown',
			className: 'bg-border text-text-muted border border-border'
		}
	};

	const waitingDaysClass = (days: number | null) => {
		if (days == null) return 'text-text-muted';
		if (days > 14) return 'text-rose-600';
		if (days >= 7) return 'text-amber-600';
		return 'text-emerald-600';
	};
</script>

<svelte:head>
	<title>{m.waiting_for_selection()} | MaiCare</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder="Search waiting list..."
				value={appliedSearch}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						applySearch((event.currentTarget as HTMLInputElement).value);
					}
				}}
				onblur={(event) => applySearch((event.currentTarget as HTMLInputElement).value)}
			/>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				onclick={() => applyFilter('')}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {appliedAdmissionType ===
				''
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				All
			</button>
			<button
				onclick={() => applyFilter('regular')}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {appliedAdmissionType ===
				'regular'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				Regular
			</button>
			<button
				onclick={() => applyFilter('crisis')}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {appliedAdmissionType ===
				'crisis'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				Crisis
			</button>
		</div>
	</div>
{/snippet}

{#snippet clientCell(row: WaitingListRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<ClipboardList class="h-5 w-5" />
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{formatClientName(row)}</p>
			<p class="text-xs text-text-muted">{m.bsn()} {row.clientBsnNumber ?? '—'}</p>
		</div>
	</div>
{/snippet}

{#snippet daysCell(row: WaitingListRow)}
	{@const days = row.daysInWaitingList}
	<span class="inline-flex items-center gap-1 text-sm font-semibold {waitingDaysClass(days)}">
		{#if days != null && days > 14}
			<AlertTriangle class="h-3.5 w-3.5" />
		{/if}
		{days ?? '—'}
	</span>
{/snippet}

{#snippet admissionTypeCell(row: WaitingListRow)}
	{@const meta = admissionTypeMeta[row.admissionType]}
	<span
		class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold {meta.className}"
	>
		{meta.label}
	</span>
{/snippet}

{#snippet careTypeCell(row: WaitingListRow)}
	{@const meta = careTypeMeta[row.careType]}
	<span
		class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold {meta.className}"
	>
		{meta.label}
	</span>
{/snippet}

{#snippet actionsCell(row: WaitingListRow)}
	<div class="flex justify-end gap-1">
		<PermissionGuard permission="CLIENT.STATUS.UPDATE">
			<button
				type="button"
				onclick={(event) => {
					event.stopPropagation();
					openPutInCareModal(row);
				}}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-emerald-100/80 hover:text-emerald-700"
				title="Put in care"
			>
				<HeartHandshake class="h-4 w-4" />
			</button>
		</PermissionGuard>
		<a
			href="/clients/{row.id}"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title="View details"
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
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-amber-100/70 to-orange-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<ClipboardList class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.waiting_for_selection()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					Clients approved for intake and currently awaiting placement.
				</p>
			</div>
		</div>
	</header>

	{#await waitingListDataPromise}
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
			sortColumn="daysInWaitingList"
			sortDirection={sort.direction}
			onPageChange={(nextPage) =>
				updateQuery(
					nextPage,
					appliedSearch,
					appliedAdmissionType,
					appliedPlacement,
					sort.direction
				)}
			onSort={handleSort}
			rowKey="id"
			title="Waiting List"
			description="Clients currently in waiting list"
			filters={tableFilters}
			cells={{
				client: clientCell,
				careType: careTypeCell,
				daysInWaitingList: daysCell,
				admissionType: admissionTypeCell,
				actions: actionsCell
			}}
		/>
	{:then waitingListData}
		{#if waitingListData.loadError}
			<InlineErrorBanner message={waitingListData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					Total Waiting
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
					{waitingListData.stats.total}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">{m.client()}</p>
			</div>
		</div>

		<DataTable
			{columns}
			rows={waitingListData.rows}
			currentPage={waitingListData.pagination.page}
			pageSize={waitingListData.pagination.pageSize}
			totalCount={waitingListData.pagination.count}
			sortColumn="daysInWaitingList"
			sortDirection={sort.direction}
			onPageChange={(nextPage) =>
				updateQuery(
					nextPage,
					appliedSearch,
					appliedAdmissionType,
					appliedPlacement,
					sort.direction
				)}
			onSort={handleSort}
			rowKey="id"
			title="Waiting List"
			description="Clients currently in waiting list"
			filters={tableFilters}
			cells={{
				client: clientCell,
				careType: careTypeCell,
				daysInWaitingList: daysCell,
				admissionType: admissionTypeCell,
				actions: actionsCell
			}}
		/>
	{/await}

	<PutClientInCareForm
		bind:open={isPutInCareModalOpen}
		clientId={selectedClientId}
		onSuccess={() => invalidateAll()}
	/>
</section>
