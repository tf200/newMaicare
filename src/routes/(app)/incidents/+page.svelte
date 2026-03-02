<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
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
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateIncidentForm from '$lib/components/forms/CreateIncidentForm.svelte';
	import type { PageData } from './$types';
	import type { Incident, IncidentSeverity, IncidentType } from '$lib/types/incidents';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props<{ data: PageData }>();

	const incidentsDataPromise = $derived(data.incidentsData);
	let currentPage = $state(1);
	let pageSize = $state(10);
	let confirmedFilter = $state<'' | 'true' | 'false'>('');
	let searchTerm = $state('');
	let showCreateIncident = $state(false);

	$effect(() => {
		currentPage = data.initial.page;
		pageSize = data.initial.pageSize;
		confirmedFilter = data.initial.filters.isConfirmed;
		searchTerm = data.initial.filters.search;
	});

	const normalizeSearch = (value: string) => value.trim().slice(0, 120);

	const typeLabels: Record<IncidentType, string> = {
		passing_away: 'Passing Away',
		self_harm: 'Self Harm',
		violence: 'Violence',
		fire_water_damage: 'Fire/Water Damage',
		accident: 'Accident',
		client_absence: 'Client Absence',
		medicines: 'Medicines',
		organization: 'Organization',
		use_prohibited_substances: 'Prohibited Substances',
		other: 'Other'
	};

	const severityLabels: Record<IncidentSeverity, string> = {
		near_incident: 'Near Incident',
		less_serious: 'Less Serious',
		serious: 'Serious',
		fatal: 'Fatal'
	};

	const severityDotStyles: Record<IncidentSeverity, string> = {
		near_incident: 'bg-sky-500 ring-4 ring-sky-500/20',
		less_serious: 'bg-amber-500 ring-4 ring-amber-500/20',
		serious: 'bg-secondary ring-4 ring-secondary/20',
		fatal: 'bg-rose-600 ring-4 ring-rose-600/20'
	};

	const typeBadgeStyles: Record<IncidentType, string> = {
		passing_away:
			'border border-slate-700/60 bg-slate-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-slate-700/30',
		self_harm:
			'border border-rose-700/60 bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-rose-700/30',
		violence:
			'border border-rose-700/60 bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-rose-700/30',
		fire_water_damage:
			'border border-orange-700/60 bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-orange-700/30',
		accident:
			'border border-amber-700/60 bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-amber-700/30',
		client_absence:
			'border border-blue-700/60 bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-blue-700/30',
		medicines:
			'border border-sky-700/60 bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-sky-700/30',
		organization:
			'border border-violet-700/60 bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-violet-700/30',
		use_prohibited_substances:
			'border border-purple-700/60 bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-purple-700/30',
		other:
			'border border-zinc-700/60 bg-zinc-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-zinc-700/30'
	};

	const columns: DataTableColumn[] = [
		{ key: 'client', label: 'Client', width: '200px' },
		{ key: 'type', label: 'Type', width: '220px' },
		{ key: 'severity', label: 'Severity', width: '140px' },
		{ key: 'location', label: 'Location', width: '180px' },
		{ key: 'employee', label: 'Employee', width: '180px' },
		{ key: 'date', label: 'Occurred At', width: '160px' },
		{ key: 'status', label: 'Status', width: '140px', align: 'center' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	];

	const formatDate = (dateStr: string) => {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString(getLocale() === 'nl' ? 'nl-NL' : 'en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getClientBsn = (row: Incident) =>
		(row as Incident & { clientBsnNumber?: string }).clientBsnNumber ?? '—';

	const buildQuery = (pageValue: number, status: '' | 'true' | 'false', search: string) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		if (status !== '') {
			params.set('is_confirmed', status);
		}
		const normalizedSearch = normalizeSearch(search);
		if (normalizedSearch) {
			params.set('search', normalizedSearch);
		}
		return params.toString();
	};

	const updateQuery = (pageValue: number, status: '' | 'true' | 'false', search: string) => {
		const nextQuery = buildQuery(pageValue, status, search);
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const setStatusFilter = (status: '' | 'true' | 'false') => {
		confirmedFilter = status;
		currentPage = 1;
		updateQuery(1, status, searchTerm);
	};

	const applySearch = () => {
		searchTerm = normalizeSearch(searchTerm);
		currentPage = 1;
		updateQuery(1, confirmedFilter, searchTerm);
	};

	const handleIncidentCreated = async () => {
		showCreateIncident = false;
		await invalidateAll();
	};
</script>

<svelte:head>
	<title>Incidents | MaiCare</title>
</svelte:head>

<section class="space-y-8">
	<!-- Hero Header -->
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-rose-100/70 to-orange-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-rose-600">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
						<AlertCircle class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">Incidents</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					Monitor and manage safety incidents, near-misses, and reporting across all locations and
					clients.
				</p>
			</div>
			<div class="flex items-center gap-3">
				<Button variant="secondary" class="gap-2" onclick={() => (showCreateIncident = true)}>
					<Plus class="h-4 w-4" />
					Create incident
				</Button>
			</div>
		</div>
	</header>

	<CreateIncidentForm bind:open={showCreateIncident} onCreated={handleIncidentCreated} />

	<!-- KPI Row -->
	{#await incidentsDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each [1, 2, 3, 4] as i (i)}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-14 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		</div>
	{:then incidentsData}
		{@const stats = incidentsData.stats}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div
				class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm"
			>
				<div class="absolute -right-4 -bottom-4 text-text opacity-[0.03]">
					<Activity class="h-32 w-32" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						Total Incidents
					</div>
					<div class="mt-2 text-3xl font-bold tracking-tight text-text">
						{stats.total}
					</div>
					<p class="mt-1 text-xs font-medium text-text-muted">Registered in system</p>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-rose-500/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-rose-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<BadgeAlert class="h-32 w-32" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						Serious/Fatal
					</div>
					<div class="mt-2 text-3xl font-bold tracking-tight text-text">
						{stats.seriousOrFatal}
					</div>
					<p class="mt-1 text-xs font-medium font-semibold text-rose-600">
						Requires immediate attention
					</p>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-orange-500/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-orange-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<Clock class="h-32 w-32" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						Pending Confirmation
					</div>
					<div class="mt-2 text-3xl font-bold tracking-tight text-text">
						{stats.pendingConfirmation}
					</div>
					<p class="mt-1 text-xs font-medium text-text-muted">Awaiting supervisor review</p>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-brand/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-brand opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<Calendar class="h-32 w-32" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						This Month
					</div>
					<div class="mt-2 text-3xl font-bold tracking-tight text-text">
						{stats.thisMonth}
					</div>
					<p class="mt-1 text-xs font-medium text-text-muted">Current billing period</p>
				</div>
			</div>
		</div>
	{/await}

	<!-- Data Table Section -->
	<div class="space-y-4">
		{#snippet typeCell(row: Incident)}
			<div class="flex items-center gap-3">
				<span
					class="inline-flex items-center rounded-full whitespace-nowrap {typeBadgeStyles[
						row.incidentType
					]}"
				>
					{typeLabels[row.incidentType]}
				</span>
			</div>
		{/snippet}

		{#snippet clientCell(row: Incident)}
			<div class="flex items-center gap-2">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
				>
					<User class="h-5 w-5" />
				</div>
				<div>
					<p class="text-sm font-semibold text-text">{row.clientFirstName} {row.clientLastName}</p>
					<p class="text-xs text-text-muted">{m.bsn()} {getClientBsn(row)}</p>
				</div>
			</div>
		{/snippet}

		{#snippet severityCell(row: Incident)}
			<div class="flex items-center gap-3">
				<span class="h-2 w-2 shrink-0 rounded-full {severityDotStyles[row.severity]}"></span>
				<span class="text-sm font-medium text-text">{severityLabels[row.severity]}</span>
			</div>
		{/snippet}

		{#snippet locationCell(row: Incident)}
			<div class="flex items-center gap-1.5 text-text-muted">
				<MapPin class="h-3.5 w-3.5" />
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
			{#if row.isConfirmed}
				<div class="flex justify-center">
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/60 bg-emerald-600 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-sm shadow-emerald-700/30"
					>
						<ShieldCheck class="h-3.5 w-3.5" />
						Confirmed
					</span>
				</div>
			{:else}
				<div class="flex justify-center">
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-secondary/70 bg-secondary px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-sm shadow-secondary/30"
					>
						<Clock class="h-3.5 w-3.5" />
						Pending
					</span>
				</div>
			{/if}
		{/snippet}

		{#snippet actionCell(row: Incident)}
			<div class="flex justify-end">
				<a
					href={`/incidents/${row.id}`}
					class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
					title="View details"
					aria-label="View details"
				>
					<Eye class="h-4 w-4" />
				</a>
			</div>
		{/snippet}

		{#snippet tableFilters()}
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div class="relative w-full sm:w-auto">
					<Search
						class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
					/>
					<input
						type="text"
						placeholder="Search client first or last name..."
						bind:value={searchTerm}
						class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-72"
						onkeydown={(event) => {
							if (event.key === 'Enter') applySearch();
						}}
						onblur={applySearch}
					/>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<button
						onclick={() => setStatusFilter('')}
						class="h-9 rounded-full px-4 text-xs font-semibold transition-all {confirmedFilter ===
						''
							? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
							: 'border border-border text-text-muted hover:text-text'}"
					>
						All
					</button>
					<button
						onclick={() => setStatusFilter('true')}
						class="h-9 rounded-full px-4 text-xs font-semibold transition-all {confirmedFilter ===
						'true'
							? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
							: 'border border-border text-text-muted hover:text-text'}"
					>
						Confirmed
					</button>
					<button
						onclick={() => setStatusFilter('false')}
						class="h-9 rounded-full px-4 text-xs font-semibold transition-all {confirmedFilter ===
						'false'
							? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
							: 'border border-border text-text-muted hover:text-text'}"
					>
						Pending
					</button>
				</div>
			</div>
		{/snippet}

		{#await incidentsDataPromise}
			<DataTable
				{columns}
				rows={[]}
				loading
				title="Recent Incidents"
				description="Displaying all reported incidents and near-misses."
				{currentPage}
				{pageSize}
				totalCount={0}
			/>
		{:then incidentsData}
			{@const incidents = incidentsData.incidents}
			{@const pagination = incidentsData.pagination}
			{#if incidentsData.loadError}
				<div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{incidentsData.loadError}
				</div>
			{/if}
			<DataTable
				{columns}
				rows={incidents}
				title="Recent Incidents"
				description="Displaying all reported incidents and near-misses."
				filters={tableFilters}
				currentPage={pagination.page}
				pageSize={pagination.pageSize}
				totalCount={pagination.count}
				onPageChange={(nextPage) => {
					currentPage = nextPage;
					updateQuery(nextPage, confirmedFilter, searchTerm);
				}}
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
	</div>
</section>
