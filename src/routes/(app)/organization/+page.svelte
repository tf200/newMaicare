<script lang="ts">
	import { Building2, Eye, Pencil, Plus, Search, MapPin, Users } from 'lucide-svelte';
	import { afterNavigate, goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import CreateOrganizationForm from '$lib/components/forms/CreateOrganizationForm.svelte';
	import EditOrganizationForm from '$lib/components/forms/EditOrganizationForm.svelte';
	import { getOrganization } from '$lib/api/organizations';
	import type { GetOrganizationResponse } from '$lib/types/api';
	import type { OrganizationLoadResult } from './+page';
	import type { OrganizationCountsLoadResult } from './+layout';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { m } from '$lib/paraglide/messages';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: { name: string };
			};
			organizationsData: Promise<OrganizationLoadResult>;
			countsData: Promise<OrganizationCountsLoadResult>;
		};
	}>();
	type OrganizationRow = OrganizationLoadResult['organisations'][number];

	let showCreateOrg = $state(false);
	let showEditOrg = $state(false);
	let editOrganization = $state<GetOrganizationResponse | null>(null);
	let isEditLoading = $state(false);
	let editLoadError = $state('');
	let editRequestController: AbortController | null = null;

	const columns: DataTableColumn[] = [
		{ key: 'name', label: m.organization(), headerClass: 'pl-14' },
		{ key: 'address', label: m.address() },
		{ key: 'city', label: m.city() },
		{ key: 'email', label: m.email() },
		{ key: 'kvkNumber', label: m.registration(), align: 'left', width: '180px' },
		{ key: 'locationCount', label: m.location(), align: 'right', width: '100px' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	];

	const organizationsDataPromise = $derived.by(() => data.organizationsData);
	const countsDataPromise = $derived.by(() => data.countsData);
	const currentPage = $derived.by(() => data.initial.page);
	const pageSize = $derived.by(() => data.initial.pageSize);
	const appliedSearch = $derived.by(() => (data.initial.filters.name ?? '').trim());
	let searchTerm = $state('');

	afterNavigate(() => {
		searchTerm = appliedSearch;
	});

	const buildQuery = (pageValue: number, nameValue: string) => {
		const params = new SvelteURLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		if (nameValue) params.set('name', nameValue);
		return params.toString();
	};

	const updateQuery = (pageValue: number, nameValue: string) => {
		const nextQuery = buildQuery(pageValue, nameValue);
		if (page.url.searchParams.toString() === nextQuery) return;
		const target = new SvelteURL(page.url);
		target.pathname = resolve('/(app)/organization');
		target.search = nextQuery;
		// The target preserves the localized URL and uses the resolved route pathname above.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(target, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	const applySearch = () => {
		const trimmed = searchTerm.trim();
		updateQuery(1, trimmed);
	};

	const openEdit = async (id: string) => {
		editRequestController?.abort();
		const controller = new AbortController();
		editRequestController = controller;
		editOrganization = null;
		editLoadError = '';
		showEditOrg = true;
		isEditLoading = true;
		try {
			const response = await getOrganization(id, { signal: controller.signal });
			if (controller.signal.aborted) return;
			editOrganization = {
				...response.data,
				house_number_addition: response.data.house_number_addition ?? '',
				email: response.data.email ?? '',
				kvk_number: response.data.kvk_number ?? '',
				btw_number: response.data.btw_number ?? ''
			};
		} catch {
			if (controller.signal.aborted) return;
			editLoadError = m.failed_load_organization();
		} finally {
			if (editRequestController === controller) {
				isEditLoading = false;
				editRequestController = null;
			}
		}
	};

	const closeEdit = () => {
		editRequestController?.abort();
		editRequestController = null;
		isEditLoading = false;
	};

	const invalidateOrganizationData = () => {
		void invalidate('app:organization:list');
	};

	const formatOptional = (value: string | null, fallback = '—') =>
		value && value.trim().length > 0 ? value : fallback;

	const formatAddress = (org: OrganizationRow) => {
		const addition = org.houseNumberAddition?.trim() ?? '';
		const suffix = addition.length > 0 ? addition : '';
		return `${org.street} ${org.houseNumber}${suffix}`.trim();
	};

	const formatCity = (org: OrganizationRow) => `${org.postalCode} ${org.city}`.trim();
</script>

<svelte:head>
	<title>{m.organization()} | MaiCare</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
				aria-hidden="true"
			/>
			<input
				type="text"
				placeholder={m.search_placeholder_short()}
				aria-label={m.search_organizations()}
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

{#snippet nameCell(row: OrganizationRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<Building2 class="h-5 w-5" />
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.name}</p>
		</div>
	</div>
{/snippet}

{#snippet addressCell(row: OrganizationRow)}
	<div class="text-sm text-text-muted">{formatAddress(row)}</div>
{/snippet}

{#snippet cityCell(row: OrganizationRow)}
	<span class="text-sm font-medium text-text-muted">{formatCity(row)}</span>
{/snippet}

{#snippet emailCell(row: OrganizationRow)}
	<span class={`text-sm ${row.email ? 'text-text-muted' : 'text-text-subtle'}`}>
		{formatOptional(row.email)}
	</span>
{/snippet}

{#snippet kvkNumberCell(row: OrganizationRow)}
	<div class="flex flex-col gap-1 text-xs text-text-muted">
		{#if row.kvkNumber}
			<span
				class="inline-flex w-fit items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-1 font-semibold text-secondary"
			>
				{m.kvk_label()} <span class="font-normal text-secondary">{row.kvkNumber}</span>
			</span>
		{/if}
		{#if row.btwNumber}
			<span
				class="inline-flex w-fit items-center gap-2 rounded-full bg-brand/10 px-2.5 py-1 font-semibold text-brand"
			>
				{m.btw_label()} <span class="font-normal text-brand">{row.btwNumber}</span>
			</span>
		{/if}
		{#if !row.kvkNumber && !row.btwNumber}
			<span class="text-text-subtle">—</span>
		{/if}
	</div>
{/snippet}

{#snippet locationCountCell(row: OrganizationRow)}
	<span class="inline-flex items-center justify-end gap-1.5">
		<span class="text-sm font-semibold text-text">
			{row.locationCount}
		</span>
		<span class="text-xs text-text-subtle">{m.sites()}</span>
	</span>
{/snippet}

{#snippet actionsCell(row: OrganizationRow)}
	<div class="flex justify-end gap-1">
		<button
			type="button"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
			onclick={() => goto(resolve('/(app)/organization/[id]', { id: row.id }))}
			title={m.view_organization()}
			aria-label={m.view_organization()}
		>
			<Eye class="h-4 w-4" aria-hidden="true" />
		</button>
		<PermissionGuard permission={PERMISSIONS.ORGANISATION.UPDATE}>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
				onclick={() => openEdit(row.id)}
				title={m.edit_organization()}
				aria-label={m.edit_organization()}
			>
				<Pencil class="h-4 w-4" aria-hidden="true" />
			</button>
		</PermissionGuard>
	</div>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-100/70 to-emerald-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<Building2 class="h-5 w-5" />
					</span>
					<span>{m.organization()}</span>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-text">{m.organizations()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.organizations_description()}
				</p>
			</div>
			<PermissionGuard permission={PERMISSIONS.ORGANISATION.CREATE}>
				<Button class="gap-2" onclick={() => (showCreateOrg = true)}>
					<Plus class="h-4 w-4" aria-hidden="true" />
					{m.add_organization()}
				</Button>
			</PermissionGuard>
		</div>
	</header>

	<CreateOrganizationForm bind:open={showCreateOrg} onCreated={invalidateOrganizationData} />
	{#if showEditOrg}
		{#key editOrganization?.id ?? 'loading'}
			<EditOrganizationForm
				bind:open={showEditOrg}
				organization={editOrganization}
				isFetching={isEditLoading}
				loadErrorMessage={editLoadError}
				onClose={closeEdit}
				onUpdated={invalidateOrganizationData}
			/>
		{/key}
	{/if}

	{#await countsDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each [1, 2, 3] as item (item)}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		</div>
	{:then countsData}
		{#if countsData.loadError}
			<InlineErrorBanner
				message={countsData.loadError}
				onRetry={() => invalidate('app:organization:counts')}
			/>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#await organizationsDataPromise}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
				</div>
			{:then organizationsData}
				<StatCard
					label={appliedSearch ? m.matching_organizations() : m.total_organizations()}
					value={organizationsData.pagination.count}
					description={appliedSearch
						? m.matching_organizations_description()
						: m.active_in_network()}
					icon={Building2}
				/>
			{/await}
			<StatCard
				label={m.total_locations()}
				value={countsData.counts.totalLocations}
				description={m.total_care_sites()}
				icon={MapPin}
				color="brand"
			/>
			<StatCard
				label={m.total_capacity()}
				value={countsData.counts.totalCapacity}
				description={m.available_places()}
				icon={Users}
				color="emerald"
			/>
		</div>
	{/await}

	{#await organizationsDataPromise}
		<DataTable
			{columns}
			rows={[]}
			loading
			pagination={{
				mode: 'server',
				page: currentPage,
				pageSize,
				totalCount: 0,
				onPageChange: (nextPage) => updateQuery(nextPage, appliedSearch)
			}}
			rowKey="id"
			title={m.organization_directory()}
			description={m.organization_directory_description()}
			toolbar={tableFilters}
			cells={{
				name: nameCell,
				address: addressCell,
				city: cityCell,
				email: emailCell,
				kvkNumber: kvkNumberCell,
				locationCount: locationCountCell,
				actions: actionsCell
			}}
		/>
	{:then organizationsData}
		<DataTable
			{columns}
			rows={organizationsData.organisations}
			pagination={{
				mode: 'server',
				page: organizationsData.pagination.page,
				pageSize: organizationsData.pagination.pageSize,
				totalCount: organizationsData.pagination.count,
				onPageChange: (nextPage) => updateQuery(nextPage, appliedSearch)
			}}
			rowKey="id"
			title={m.organization_directory()}
			description={m.organization_directory_description()}
			toolbar={tableFilters}
			error={organizationsData.loadError ?? undefined}
			onRetry={() => invalidate('app:organization:list')}
			cells={{
				name: nameCell,
				address: addressCell,
				city: cityCell,
				email: emailCell,
				kvkNumber: kvkNumberCell,
				locationCount: locationCountCell,
				actions: actionsCell
			}}
		/>
	{/await}
</section>
