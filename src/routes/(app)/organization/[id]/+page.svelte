<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Building2, MoreHorizontal, Plus, Search, Users, Warehouse } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import CreateLocationForm from '$lib/components/forms/CreateLocationForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const organization = $derived.by(() => data.organization);
	const counts = $derived.by(() => data.counts);
	const locations = $derived.by(() => data.locations);
	const currentPage = $derived.by(() => data.pagination.page);
	const pageSize = $derived.by(() => data.pagination.pageSize);
	const appliedSearch = $derived.by(() => (data.pagination.filters.name ?? '').trim());
	let searchTerm = $state('');
	let showCreateLocation = $state(false);

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

	const columns: DataTableColumn[] = [
		{ key: 'name', label: 'Location' },
		{ key: 'address', label: 'Address' },
		{ key: 'occupancy', label: 'Occupancy', width: '200px' },
		{ key: 'available', label: 'Available', align: 'right', width: '120px' },
		{ key: 'updated_at', label: 'Updated', align: 'right', width: '140px' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	];

	const formatDate = (value: string) =>
		new Date(value).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});

	const formatNumber = (value: number) => new Intl.NumberFormat('en-GB').format(value);

	const formatOptional = (value: string | null, fallback = '—') =>
		value && value.trim().length > 0 ? value : fallback;

	const formatAddress = () => {
		const addition = organization.house_number_addition?.trim() ?? '';
		const suffix = addition.length > 0 ? addition : '';
		return `${organization.street} ${organization.house_number}${suffix}`.trim();
	};

	const occupancyPercent = (location: PageData['locations'][number]) => {
		if (!location.capacity || location.capacity <= 0) return null;
		return Math.min(100, Math.round((location.occupied / location.capacity) * 100));
	};
</script>

{#snippet tableFilters()}
	<div class="flex items-center gap-3">
		<div class="relative">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
			/>
			<input
				type="text"
				placeholder="Search locations..."
				bind:value={searchTerm}
				class="h-9 w-64 rounded-xl border border-zinc-200 bg-white pr-3 pl-9 text-sm font-medium text-zinc-600 placeholder:text-zinc-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
				onkeydown={(event) => {
					if (event.key === 'Enter') applySearch();
				}}
				onblur={applySearch}
			/>
		</div>
	</div>
{/snippet}

{#snippet nameCell(row: PageData['locations'][number])}
	<div class="flex items-center gap-4 py-1">
		<div
			class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-100 text-teal-700 ring-1 ring-teal-100/50"
		>
			<Building2 class="h-5 w-5" />
		</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-bold text-zinc-900">{row.name}</p>
			<p class="font-mono text-xs tracking-wide text-zinc-400">{row.id.slice(0, 8)}</p>
		</div>
	</div>
{/snippet}

{#snippet addressCell(row: PageData['locations'][number])}
	<div class="text-sm text-zinc-600">
		{row.street}
		{row.house_number}{row.house_number_addition ?? ''}, {row.postal_code}
		{row.city}
	</div>
{/snippet}

{#snippet occupancyCell(row: PageData['locations'][number])}
	{#if row.capacity}
		{@const percent = occupancyPercent(row)}
		<div class="flex w-full flex-col gap-1.5">
			<div class="flex items-center justify-between text-xs">
				<span class="font-medium text-zinc-700">
					{formatNumber(row.occupied)} / {formatNumber(row.capacity)}
				</span>
				{#if percent !== null}
					<span class="text-zinc-500">{percent}%</span>
				{/if}
			</div>
			<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
				{#if percent !== null}
					<div
						class="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500"
						style={`width:${percent}%`}
					></div>
				{/if}
			</div>
		</div>
	{:else}
		<span class="text-zinc-400">—</span>
	{/if}
{/snippet}

{#snippet availableCell(row: PageData['locations'][number])}
	<span class="inline-flex items-center justify-end gap-1">
		<span class="text-sm font-semibold text-zinc-700">{formatNumber(row.available)}</span>
		<span class="text-xs text-zinc-400">beds</span>
	</span>
{/snippet}

{#snippet updatedAtCell(row: PageData['locations'][number])}
	<span class="text-sm text-zinc-500">{formatDate(row.updated_at)}</span>
{/snippet}

{#snippet actionsCell()}
	<Button variant="ghost" class="h-8 w-8 rounded-lg p-0 text-zinc-400 hover:text-zinc-900">
		<span class="sr-only">More</span>
		<MoreHorizontal class="h-4 w-4" />
	</Button>
{/snippet}

<section class="space-y-8">
	<header
		class="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-gradient-to-br from-teal-100/70 to-emerald-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-2 text-xs font-semibold text-zinc-400">
					<span>Organizations</span>
					<span>/</span>
					<span class="text-zinc-600">{page.params.id}</span>
				</div>
				<div class="flex items-center gap-3">
					<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
						<Building2 class="h-6 w-6 text-teal-700" />
					</span>
					<div>
						<h1 class="text-3xl font-bold tracking-tighter text-zinc-900">
							{organization.name}
						</h1>
						<p class="text-sm font-medium text-zinc-500">{organization.id}</p>
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

	<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		<div class="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<div class="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Locations</div>
				<span
					class="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-50 text-zinc-500"
				>
					<Warehouse class="h-4 w-4" />
				</span>
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
				{formatNumber(counts.location_count)}
			</div>
			<p class="mt-2 text-xs font-medium text-zinc-500">Active care locations</p>
		</div>
		<div class="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<div class="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Clients</div>
				<span
					class="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700"
				>
					<Users class="h-4 w-4" />
				</span>
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-teal-700">
				{formatNumber(counts.client_count)}
			</div>
			<p class="mt-2 text-xs font-medium text-zinc-500">Clients under care</p>
		</div>
		<div class="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<div class="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Employees</div>
				<span
					class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
				>
					<Users class="h-4 w-4" />
				</span>
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
				{formatNumber(counts.employee_count)}
			</div>
			<p class="mt-2 text-xs font-medium text-zinc-500">Active caregivers</p>
		</div>
	</section>

	<div class="grid gap-6 lg:grid-cols-[1fr_2.2fr]">
		<aside class="space-y-6">
			<div
				class="rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 p-6 text-white shadow-lg shadow-teal-900/10"
			>
				<h2 class="text-lg font-bold tracking-tight text-white">Organization details</h2>
				<div class="mt-6 space-y-4 text-sm">
					<div>
						<p class="text-xs font-bold tracking-wider text-teal-100 uppercase opacity-80">
							Address
						</p>
						<p class="mt-1 font-semibold text-white">{formatAddress()}</p>
						<p class="text-teal-50 opacity-90">
							{organization.postal_code}
							{organization.city}
						</p>
					</div>
					<div>
						<p class="text-xs font-bold tracking-wider text-teal-100 uppercase opacity-80">Email</p>
						<p class="mt-1 text-white">{formatOptional(organization.email)}</p>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-xs font-bold tracking-wider text-teal-100 uppercase opacity-80">KVK</p>
							<p class="mt-1 text-white">{formatOptional(organization.kvk_number)}</p>
						</div>
						<div>
							<p class="text-xs font-bold tracking-wider text-teal-100 uppercase opacity-80">BTW</p>
							<p class="mt-1 text-white">{formatOptional(organization.btw_number)}</p>
						</div>
					</div>
				</div>
				<div class="mt-6 border-t border-white/20 pt-4 text-xs text-teal-100 opacity-70">
					Updated {formatDate(organization.updated_at)}
				</div>
			</div>
		</aside>

		<DataTable
			title="Locations"
			description="Availability across organization sites."
			{columns}
			rows={locations}
			{currentPage}
			{pageSize}
			totalCount={data.pagination.count}
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
	</div>
</section>
