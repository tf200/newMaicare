<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		AlertCircle,
		Activity,
		MapPin,
		User,
		Search,
		Calendar,
		Clock,
		Eye,
		BadgeAlert,
		ShieldCheck,
		Plus
	} from 'lucide-svelte';
	import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import FilterPills, { type FilterPill } from '$lib/components/ui/FilterPills.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import CreateIncidentForm from '$lib/components/forms/CreateIncidentForm.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import type { PageProps } from './$types';
	import type { Incident, IncidentSeverity, IncidentType } from '$lib/types/incidents';
	import type { IncidentFilters } from './+page';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	let { data }: PageProps = $props();

	const incidentsDataPromise = $derived.by(() => data.incidentsData);
	const countsDataPromise = $derived.by(() => data.countsData);
	const initial = $derived.by(() => data.initial);
	const currentPage = $derived.by(() => initial.page);
	const pageSize = $derived.by(() => initial.pageSize);
	const confirmedFilter = $derived.by(() => initial.filters.isConfirmed);
	const appliedSearch = $derived.by(() => initial.filters.search);
	let showCreateIncident = $state(false);

	const normalizeSearch = (value: string) => value.trim().slice(0, 120);

	const typeLabels: Record<IncidentType, string> = {
		passing_away: m.passing_away(),
		self_harm: m.self_harm(),
		violence: m.violence(),
		fire_water_damage: m.fire_water_damage(),
		accident: m.accident(),
		client_absence: m.client_absence(),
		medicines: m.medicines(),
		organization: m.organization(),
		use_prohibited_substances: m.use_prohibited_substances(),
		other: m.other()
	};

	const severityLabels: Record<IncidentSeverity, string> = {
		near_incident: m.near_incident(),
		less_serious: m.less_serious(),
		serious: m.serious(),
		fatal: m.fatal()
	};

	const severityDotStyles: Record<IncidentSeverity, string> = {
		near_incident: 'bg-info ring-4 ring-info/20',
		less_serious: 'bg-warning ring-4 ring-warning/20',
		serious: 'bg-secondary ring-4 ring-secondary/20',
		fatal: 'bg-error ring-4 ring-error/20'
	};

	const typeBadgeStyles: Record<IncidentType, string> = {
		passing_away: 'border-border bg-border/40 text-text-muted',
		self_harm: 'border-error/30 bg-error/10 text-error',
		violence: 'border-error/30 bg-error/10 text-error',
		fire_water_damage: 'border-secondary/30 bg-secondary/10 text-secondary',
		accident: 'border-warning/30 bg-warning/10 text-warning',
		client_absence: 'border-info/30 bg-info/10 text-info',
		medicines: 'border-info/30 bg-info/10 text-info',
		organization: 'border-brand/30 bg-brand/10 text-brand',
		use_prohibited_substances: 'border-secondary/30 bg-secondary/10 text-secondary',
		other: 'border-border bg-border/40 text-text-muted'
	};

	const confirmedFilterPills: FilterPill[] = [
		{ id: '', label: m.all() },
		{ id: 'true', label: m.confirmed(), color: 'emerald' },
		{ id: 'false', label: m.pending(), color: 'amber' }
	];

	const columns: DataTableColumn[] = [
		{ key: 'client', label: m.client(), width: '200px' },
		{ key: 'type', label: m.type(), width: '220px' },
		{ key: 'severity', label: m.severity(), width: '140px' },
		{ key: 'location', label: m.location(), width: '180px' },
		{ key: 'employee', label: m.employee(), width: '180px' },
		{ key: 'date', label: m.occurred_at(), width: '160px' },
		{ key: 'status', label: m.status(), width: '140px', align: 'center' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	];

	const formatDate = (dateStr: string) => {
		if (!dateStr) return m.not_available_short();
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return m.not_available_short();
		return date.toLocaleDateString(getLocale() === 'nl' ? 'nl-NL' : 'en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getClientBsn = (row: Incident) => row.clientBsnNumber ?? m.not_available_short();

	const buildQuery = (
		pageValue: number,
		status: IncidentFilters['isConfirmed'],
		search: string
	) => {
		const params = new SvelteURLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		if (status) params.set('is_confirmed', status);
		const normalizedSearch = normalizeSearch(search);
		if (normalizedSearch) params.set('search', normalizedSearch);
		return params.toString();
	};

	const updateQuery = (
		pageValue: number,
		status: IncidentFilters['isConfirmed'],
		search: string
	) => {
		const nextQuery = buildQuery(pageValue, status, search);
		if (page.url.searchParams.toString() === nextQuery) return;
		const target = new SvelteURL(localizeHref(resolve('/(app)/incidents')), page.url);
		target.search = nextQuery;
		goto(resolve(`${target.pathname}${target.search}` as '/incidents/'), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	const setStatusFilter = (status: string) => {
		const nextStatus: IncidentFilters['isConfirmed'] =
			status === 'true' || status === 'false' ? status : '';
		updateQuery(1, nextStatus, appliedSearch);
	};

	const applySearch = (search: string) => {
		updateQuery(1, confirmedFilter, normalizeSearch(search));
	};

	const handleIncidentCreated = async () => {
		showCreateIncident = false;
		await Promise.all([invalidate('app:incidents:list'), invalidate('app:incidents:counts')]);
	};
</script>

<svelte:head>
	<title>{m.incidents_page_title()}</title>
</svelte:head>

{#snippet typeCell(row: Incident)}
	<span
		class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap {typeBadgeStyles[
			row.incidentType
		]}"
	>
		{typeLabels[row.incidentType]}
	</span>
{/snippet}

{#snippet clientCell(row: Incident)}
	<div class="flex items-center gap-2">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<User aria-hidden="true" class="h-5 w-5" />
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.clientFirstName} {row.clientLastName}</p>
			<p class="text-xs text-text-muted">{m.bsn()} {getClientBsn(row)}</p>
		</div>
	</div>
{/snippet}

{#snippet severityCell(row: Incident)}
	<div class="flex items-center gap-3">
		<span aria-hidden="true" class="h-2 w-2 shrink-0 rounded-full {severityDotStyles[row.severity]}"
		></span>
		<span class="text-sm font-medium text-text">{severityLabels[row.severity]}</span>
	</div>
{/snippet}

{#snippet locationCell(row: Incident)}
	<div class="flex items-center gap-1.5 text-text-muted">
		<MapPin aria-hidden="true" class="h-3.5 w-3.5" />
		<span class="text-xs font-medium">{row.locationName}</span>
	</div>
{/snippet}

{#snippet employeeCell(row: Incident)}
	<span class="text-xs font-medium text-text-muted"
		>{row.employeeFirstName} {row.employeeLastName}</span
	>
{/snippet}

{#snippet dateCell(row: Incident)}
	<span class="text-xs font-medium text-text-muted">{formatDate(row.occurredAt)}</span>
{/snippet}

{#snippet statusCell(row: Incident)}
	<div class="flex justify-center">
		<span
			class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap {row.isConfirmed
				? 'border-success/30 bg-success/10 text-success'
				: 'border-warning/30 bg-warning/10 text-warning'}"
		>
			{#if row.isConfirmed}
				<ShieldCheck aria-hidden="true" class="h-3.5 w-3.5" />
				{m.confirmed()}
			{:else}
				<Clock aria-hidden="true" class="h-3.5 w-3.5" />
				{m.pending()}
			{/if}
		</span>
	</div>
{/snippet}

{#snippet actionCell(row: Incident)}
	<div class="flex justify-end">
		<a
			href={resolve(
				localizeHref(resolve('/(app)/incidents/[id]', { id: row.id })) as `/incidents/${string}/`
			)}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
			title={m.view_details()}
			aria-label={m.view_details()}
			data-sveltekit-preload-data="hover"
		>
			<Eye aria-hidden="true" class="h-4 w-4" />
		</a>
	</div>
{/snippet}

{#snippet tableFilters()}
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<label class="sr-only" for="incident-search">{m.search_incidents()}</label>
			<Search
				aria-hidden="true"
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				id="incident-search"
				type="search"
				placeholder={m.search_client_name_placeholder()}
				value={appliedSearch}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-72"
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						event.currentTarget.blur();
					}
				}}
				onblur={(event) => applySearch(event.currentTarget.value)}
			/>
		</div>

		<FilterPills
			pills={confirmedFilterPills}
			activeId={confirmedFilter}
			onSelect={setStatusFilter}
		/>
	</div>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-error/15 to-secondary/15 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-error">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-error/10">
						<AlertCircle aria-hidden="true" class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-text">{m.incidents()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.incidents_header_description()}
				</p>
			</div>

			<PermissionGuard permission={PERMISSIONS.CLIENT.INCIDENT_CREATE}>
				<Button variant="secondary" class="gap-2" onclick={() => (showCreateIncident = true)}>
					<Plus aria-hidden="true" class="h-4 w-4" />
					{m.create_incident()}
				</Button>
			</PermissionGuard>
		</div>
	</header>

	<PermissionGuard permission={PERMISSIONS.CLIENT.INCIDENT_CREATE}>
		<CreateIncidentForm bind:open={showCreateIncident} onCreated={handleIncidentCreated} />
	</PermissionGuard>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#await incidentsDataPromise}
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
				<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
				<div class="mt-3 h-8 w-14 animate-pulse rounded bg-border/70"></div>
			</div>
		{:then incidentsData}
			{#if !incidentsData.loadError}
				<StatCard
					label={m.matching_incidents()}
					value={incidentsData.pagination.count}
					description={m.registered_in_system()}
					icon={Activity}
					color="brand"
				/>
			{/if}
		{/await}

		{#await countsDataPromise}
			{#each [1, 2, 3] as item (item)}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-14 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		{:then countsData}
			{#if !countsData.loadError}
				<StatCard
					label={m.serious_fatal()}
					value={countsData.counts.seriousFatal}
					description={m.requires_immediate_attention()}
					icon={BadgeAlert}
					color="rose"
				/>
				<StatCard
					label={m.pending_confirmation()}
					value={countsData.counts.pendingConfirmation}
					description={m.awaiting_supervisor_review()}
					icon={Clock}
					color="amber"
				/>
				<StatCard
					label={m.past_24_hours()}
					value={countsData.counts.past24h}
					description={m.incidents_last_day()}
					icon={Calendar}
					color="secondary"
				/>
			{/if}
		{/await}
	</div>

	{#await countsDataPromise then countsData}
		{#if countsData.loadError}
			<InlineErrorBanner
				message={countsData.loadError}
				onRetry={() => invalidate('app:incidents:counts')}
			/>
		{/if}
	{/await}

	{#await incidentsDataPromise}
		<DataTable
			{columns}
			rows={[]}
			loading
			pagination={{
				mode: 'server',
				page: currentPage,
				pageSize,
				totalCount: 0,
				onPageChange: (nextPage) => updateQuery(nextPage, confirmedFilter, appliedSearch)
			}}
			title={m.recent_incidents_title()}
			description={m.incidents_table_description()}
			toolbar={tableFilters}
			rowKey="id"
			empty={{ title: m.no_incidents(), description: m.no_incidents_description() }}
			cells={{
				type: typeCell,
				client: clientCell,
				severity: severityCell,
				location: locationCell,
				employee: employeeCell,
				date: dateCell,
				status: statusCell,
				actions: actionCell
			}}
		/>
	{:then incidentsData}
		<DataTable
			{columns}
			rows={incidentsData.incidents}
			pagination={{
				mode: 'server',
				page: incidentsData.pagination.page,
				pageSize: incidentsData.pagination.pageSize,
				totalCount: incidentsData.pagination.count,
				onPageChange: (nextPage) => updateQuery(nextPage, confirmedFilter, appliedSearch)
			}}
			title={m.recent_incidents_title()}
			description={m.incidents_table_description()}
			toolbar={tableFilters}
			rowKey="id"
			error={incidentsData.loadError ?? undefined}
			onRetry={() => invalidate('app:incidents:list')}
			empty={{ title: m.no_incidents(), description: m.no_incidents_description() }}
			cells={{
				type: typeCell,
				client: clientCell,
				severity: severityCell,
				location: locationCell,
				employee: employeeCell,
				date: dateCell,
				status: statusCell,
				actions: actionCell
			}}
		/>
	{/await}
</section>
