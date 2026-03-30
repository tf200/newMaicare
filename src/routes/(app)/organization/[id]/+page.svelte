<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Building2, Pencil, Plus, Search, Users, Warehouse, Clock } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import CreateLocationForm from '$lib/components/forms/CreateLocationForm.svelte';
	import EditLocationForm from '$lib/components/forms/EditLocationForm.svelte';
	import ManageShiftsForm from '$lib/components/forms/ManageShiftsForm.svelte';
	import { getLocation } from '$lib/api/organizations';
	import type { GetOrganizationResponse, OrganizationLocation } from '$lib/types/api';
	import type {
		OrganizationCountsLoadResult,
		OrganizationDetailLoadResult,
		OrganizationLocationsLoadResult
	} from './+page';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: { name: string };
			};
			organizationData: Promise<OrganizationDetailLoadResult>;
			countsData: Promise<OrganizationCountsLoadResult>;
			locationsData: Promise<OrganizationLocationsLoadResult>;
		};
	}>();

	const organizationDataPromise = $derived.by(() => data.organizationData);
	const countsDataPromise = $derived.by(() => data.countsData);
	const locationsDataPromise = $derived.by(() => data.locationsData);
	const currentPage = $derived.by(() => data.initial.page);
	const pageSize = $derived.by(() => data.initial.pageSize);
	const appliedSearch = $derived.by(() => (data.initial.filters.name ?? '').trim());

	const breadcrumbs = getBreadcrumbsState();
	$effect(() => {
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: '/dashboard' },
			{ label: m.organizations(), href: '/organization' },
			{ label: m.breadcrumb_organization_detail() }
		];
		return () => {
			breadcrumbs.items = [];
		};
	});

	let searchTerm = $state('');
	let showCreateLocation = $state(false);
	let showEditLocation = $state(false);
	let editLocation = $state<OrganizationLocation | null>(null);
	let isEditLoading = $state(false);
	let editLoadError = $state('');

	const openEdit = async (id: string) => {
		editLocation = null;
		editLoadError = '';
		showEditLocation = true;
		isEditLoading = true;
		try {
			const response = await getLocation(id);
			editLocation = response.data;
		} catch (error) {
			editLoadError = error instanceof Error ? error.message : 'Failed to load location.';
		} finally {
			isEditLoading = false;
		}
	};

	onMount(() => {
		searchTerm = appliedSearch;
	});

	const buildQuery = (pageValue: number, nameValue: string) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		if (nameValue) params.set('name', nameValue);
		return params.toString();
	};

	const updateQuery = (pageValue: number, nameValue: string) => {
		const nextQuery = buildQuery(pageValue, nameValue);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const applySearch = () => {
		const trimmed = searchTerm.trim();
		updateQuery(1, trimmed);
	};

	let showManageShifts = $state(false);
	let manageShiftsLocation = $state<OrganizationLocation | null>(null);

	const openManageShifts = (location: OrganizationLocation) => {
		manageShiftsLocation = location;
		showManageShifts = true;
	};

	const columns = $derived<DataTableColumn[]>([
		{ key: 'name', label: m.location() },
		{ key: 'address', label: m.address() },
		{ key: 'occupancy', label: m.occupancy(), width: '200px' },
		{ key: 'available', label: m.available(), align: 'right', width: '120px' },
		{ key: 'updated_at', label: m.updated(), align: 'right', width: '140px' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	]);

	const formatDate = (value: string) =>
		new Date(value).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});

	const formatNumber = (value: number) => new Intl.NumberFormat('en-GB').format(value);

	const formatOptional = (value: string | null, fallback = '—') =>
		value && value.trim().length > 0 ? value : fallback;

	const formatAddress = (organization: GetOrganizationResponse) => {
		const addition = organization.house_number_addition?.trim() ?? '';
		const suffix = addition.length > 0 ? addition : '';
		return `${organization.street} ${organization.house_number}${suffix}`.trim();
	};

	const occupancyPercent = (location: OrganizationLocation) => {
		if (!location.capacity || location.capacity <= 0) return null;
		return Math.min(100, Math.round((location.occupied / location.capacity) * 100));
	};
</script>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder={m.search_locations_placeholder()}
				bind:value={searchTerm}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text-muted placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				onkeydown={(event) => {
					if (event.key === 'Enter') applySearch();
				}}
				onblur={applySearch}
			/>
		</div>
	</div>
{/snippet}

{#snippet nameCell(row: OrganizationLocation)}
	<div class="flex items-center gap-4 py-1">
		<div
			class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<Building2 class="h-5 w-5" />
		</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-bold text-text">{row.name}</p>
			<p class="font-mono text-xs tracking-wide text-text-subtle">
				{row.id.slice(0, 8)}
			</p>
		</div>
	</div>
{/snippet}

{#snippet addressCell(row: OrganizationLocation)}
	<div class="text-sm text-text-muted">
		{row.street}
		{row.house_number}{row.house_number_addition ?? ''}, {row.postal_code}
		{row.city}
	</div>
{/snippet}

{#snippet occupancyCell(row: OrganizationLocation)}
	{#if row.capacity}
		{@const percent = occupancyPercent(row)}
		<div class="flex w-full flex-col gap-1.5">
			<div class="flex items-center justify-between text-xs">
				<span class="font-medium text-text">
					{formatNumber(row.occupied)} / {formatNumber(row.capacity)}
				</span>
				{#if percent !== null}
					<span class="text-text-muted">{percent}%</span>
				{/if}
			</div>
			<div class="h-2 w-full overflow-hidden rounded-full bg-border/50">
				{#if percent !== null}
					<div
						class="h-full rounded-full bg-brand transition-all duration-500"
						style={`width:${percent}%`}
					></div>
				{/if}
			</div>
		</div>
	{:else}
		<span class="text-text-subtle">—</span>
	{/if}
{/snippet}

{#snippet availableCell(row: OrganizationLocation)}
	<span class="inline-flex items-center justify-end gap-1">
		<span class="text-sm font-semibold text-text">{formatNumber(row.available)}</span>
		<span class="text-xs text-text-subtle">{m.beds()}</span>
	</span>
{/snippet}

{#snippet updatedAtCell(row: OrganizationLocation)}
	<span class="text-sm text-text-muted">{formatDate(row.updated_at)}</span>
{/snippet}

{#snippet actionsCell(row: OrganizationLocation)}
	<div class="flex items-center justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			onclick={() => openManageShifts(row)}
			title={m.manage_shifts()}
		>
			<Clock class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			onclick={() => openEdit(row.id)}
			title={m.edit_location()}
		>
			<Pencil class="h-4 w-4" />
		</button>
	</div>
{/snippet}

<section class="space-y-8">
	<div class="hidden"></div>

	{#await organizationDataPromise}
		<header
			class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm"
			aria-busy="true"
		>
			<div class="h-8 w-56 animate-pulse rounded bg-border/70"></div>
			<div class="mt-4 h-4 w-36 animate-pulse rounded bg-border/70"></div>
		</header>
	{:then organizationData}
		{#if organizationData.loadError}
			<InlineErrorBanner message={organizationData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		{#if organizationData.organization}
			{@const organization = organizationData.organization}

			<header
				class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm"
			>
				<div
					class="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-gradient-to-br from-teal-100/70 to-emerald-100/20 blur-2xl"
				></div>
				<div class="relative flex flex-wrap items-start justify-between gap-6">
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
								<Building2 class="h-6 w-6 text-brand" />
							</span>
							<div>
								<h1 class="text-3xl font-bold tracking-tighter text-text">
									{organization.name}
								</h1>
								<p class="text-sm font-medium text-text-muted">{organization.id}</p>
							</div>
						</div>
					</div>
					<Button class="gap-2" onclick={() => (showCreateLocation = true)}>
						<Plus class="h-4 w-4" />
						Add location
					</Button>
				</div>
			</header>

			<CreateLocationForm
				bind:open={showCreateLocation}
				organizationId={organization.id}
				onCreated={() => invalidateAll()}
			/>
			{#if showEditLocation}
				{#key editLocation?.id ?? 'loading'}
					<EditLocationForm
						bind:open={showEditLocation}
						location={editLocation}
						isFetching={isEditLoading}
						loadErrorMessage={editLoadError}
						onUpdated={() => invalidateAll()}
					/>
				{/key}
			{/if}

			{#if showManageShifts}
				{#key manageShiftsLocation?.id ?? 'loading'}
					<ManageShiftsForm
						bind:open={showManageShifts}
						location={manageShiftsLocation}
						onUpdated={() => invalidateAll()}
					/>
				{/key}
			{/if}

			{#await countsDataPromise}
				<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each [1, 2, 3] as _}
						<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
							<div class="h-3 w-20 animate-pulse rounded bg-border/70"></div>
							<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
						</div>
					{/each}
				</section>
			{:then countsData}
				{#if countsData.loadError}
					<InlineErrorBanner message={countsData.loadError} onRetry={() => invalidateAll()} />
				{/if}

				<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					<div
						class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm"
					>
						<div class="absolute -right-4 -bottom-4 text-text opacity-[0.03]">
							<Warehouse class="h-32 w-32" />
						</div>
						<div class="relative">
							<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
								{m.locations()}
							</div>
							<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
								{formatNumber(countsData.counts.location_count)}
							</div>
							<p class="mt-2 text-xs font-medium text-text-muted">{m.active_care_locations()}</p>
						</div>
					</div>
					<div
						class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-orange-500/30"
					>
						<div
							class="absolute -right-4 -bottom-4 text-orange-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
						>
							<Users class="h-32 w-32" />
						</div>
						<div class="relative">
							<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
								{m.clients()}
							</div>
							<div
								class="mt-2 text-2xl font-bold tracking-tight text-orange-600 sm:text-3xl dark:text-orange-400"
							>
								{formatNumber(countsData.counts.client_count)}
							</div>
							<p class="mt-2 text-xs font-medium text-text-muted">{m.clients_under_care()}</p>
						</div>
					</div>
					<div
						class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-emerald-500/30"
					>
						<div
							class="absolute -right-4 -bottom-4 text-emerald-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
						>
							<Users class="h-32 w-32" />
						</div>
						<div class="relative">
							<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
								{m.employees()}
							</div>
							<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
								{formatNumber(countsData.counts.employee_count)}
							</div>
							<p class="mt-2 text-xs font-medium text-text-muted">{m.active_caregivers()}</p>
						</div>
					</div>
				</section>
			{/await}

			<div class="grid gap-6 lg:grid-cols-[1fr_2.2fr]">
				<aside class="space-y-6">
					<div
						class="rounded-3xl bg-gradient-to-br from-brand to-success p-6 text-white shadow-lg shadow-teal-900/10"
					>
						<h2 class="text-lg font-bold tracking-tight text-white">{m.organization_details()}</h2>
						<div class="mt-6 space-y-4 text-sm">
							<div>
								<p class="text-xs font-bold tracking-wider text-white/80 uppercase">
									{m.address()}
								</p>
								<p class="mt-1 font-semibold text-white">{formatAddress(organization)}</p>
								<p class="text-white/90">
									{organization.postal_code}
									{organization.city}
								</p>
							</div>
							<div>
								<p class="text-xs font-bold tracking-wider text-white/80 uppercase">{m.email()}</p>
								<p class="mt-1 text-white">{formatOptional(organization.email)}</p>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<p class="text-xs font-bold tracking-wider text-white/80 uppercase">
										{m.kvk_label()}
									</p>
									<p class="mt-1 text-white">{formatOptional(organization.kvk_number)}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-white/80 uppercase">
										{m.btw_label()}
									</p>
									<p class="mt-1 text-white">{formatOptional(organization.btw_number)}</p>
								</div>
							</div>
						</div>
						<div class="mt-6 border-t border-white/20 pt-4 text-xs text-white/70">
							{m.updated()}: {formatDate(organization.updated_at)}
						</div>
					</div>
				</aside>

				{#await locationsDataPromise}
					<DataTable
						title={m.locations()}
						description={m.locations_description()}
						{columns}
						rows={[]}
						loading
						{currentPage}
						{pageSize}
						totalCount={0}
						onPageChange={(nextPage) => updateQuery(nextPage, appliedSearch)}
						rowKey="id"
						filters={tableFilters}
						cells={{
							name: nameCell,
							address: addressCell,
							occupancy: occupancyCell,
							available: availableCell,
							updated_at: updatedAtCell,
							actions: actionsCell
						}}
					/>
				{:then locationsData}
					{#if locationsData.loadError}
						<InlineErrorBanner message={locationsData.loadError} onRetry={() => invalidateAll()} />
					{/if}

					<DataTable
						title={m.locations()}
						description={m.locations_description()}
						{columns}
						rows={locationsData.locations}
						currentPage={locationsData.pagination.page}
						pageSize={locationsData.pagination.pageSize}
						totalCount={locationsData.pagination.count}
						onPageChange={(nextPage) => updateQuery(nextPage, appliedSearch)}
						rowKey="id"
						filters={tableFilters}
						cells={{
							name: nameCell,
							address: addressCell,
							occupancy: occupancyCell,
							available: availableCell,
							updated_at: updatedAtCell,
							actions: actionsCell
						}}
					/>
				{/await}
			</div>
		{:else}
			<div
				class="rounded-3xl border border-border bg-surface p-6 text-sm text-text-muted shadow-sm"
			>
				{m.organization_not_available()}
			</div>
		{/if}
	{/await}
</section>
