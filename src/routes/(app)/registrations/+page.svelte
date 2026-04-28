<script lang="ts">
	import { Calendar, ClipboardList, ShieldAlert, Search, Eye, ClipboardCheck, Clock, CheckCircle2, FileText } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type { DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Filters from '$lib/components/ui/FilterDropdown.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import FilterPills, { type FilterPill } from '$lib/components/ui/FilterPills.svelte';
	import type { RegistrationRow, RegistrationsLoadResult } from './+page';
	import type { RegistrationFilters } from '$lib/types/registrations';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: RegistrationFilters;
			};
			registrationsData: Promise<RegistrationsLoadResult>;
		};
	}>();

	const registrationsDataPromise = $derived.by(() => data.registrationsData);
	const initial = $derived.by(() => data.initial);
	const currentPage = $derived.by(() => initial.page);
	const pageSize = $derived.by(() => initial.pageSize);

	const appliedSearch = $derived.by(() => (initial.filters.search ?? '').trim());
	let searchTerm = $state('');

	$effect(() => {
		if (searchTerm !== appliedSearch) {
			searchTerm = appliedSearch;
		}
	});

	const defaultFilters: RegistrationFilters = {
		status: '',
		search: '',
		riskAggressiveBehavior: undefined,
		riskSuicidalSelfharm: undefined,
		riskSubstanceAbuse: undefined,
		riskPsychiatricIssues: undefined,
		riskCriminalHistory: undefined,
		riskFlightBehavior: undefined,
		riskWeaponPossession: undefined,
		riskSexualBehavior: undefined,
		riskDayNightRhythm: undefined
	};

	const filterGroups: Array<{
		label: string;
		items: Array<{ key: keyof RegistrationFilters; label: string }>;
	}> = [
		{
			label: 'Behavioral Risks',
			items: [
				{ key: 'riskAggressiveBehavior', label: 'Aggressive behavior' },
				{ key: 'riskSexualBehavior', label: 'Sexual behavior' },
				{ key: 'riskFlightBehavior', label: 'Flight behavior' }
			]
		},
		{
			label: 'Clinical Factors',
			items: [
				{ key: 'riskPsychiatricIssues', label: 'Psychiatric issues' },
				{ key: 'riskSuicidalSelfharm', label: 'Suicidal / Self-harm' },
				{ key: 'riskSubstanceAbuse', label: 'Substance abuse' },
				{ key: 'riskDayNightRhythm', label: 'Day/night rhythm' }
			]
		},
		{
			label: 'Safety & Legal',
			items: [
				{ key: 'riskCriminalHistory', label: 'Criminal history' },
				{ key: 'riskWeaponPossession', label: 'Weapon possession' }
			]
		}
	];

	let filters = $derived.by(() => ({
		...defaultFilters,
		...initial.filters
	}));

	const careOptions: Array<{ key: keyof RegistrationRow; label: string; className: string }> = [
		{
			key: 'careProtectedLiving',
			label: 'Protected living',
			className: 'bg-emerald-600 text-white border border-emerald-700/60'
		},
		{
			key: 'careAssistedIndependentLiving',
			label: 'Assisted living',
			className: 'bg-blue-600 text-white border border-blue-700/60'
		},
		{
			key: 'careRoomTrainingCenter',
			label: 'Room training',
			className: 'bg-purple-600 text-white border border-purple-700/60'
		},
		{
			key: 'careAmbulatoryGuidance',
			label: 'Ambulatory guidance',
			className: 'bg-amber-500 text-white border border-amber-600/60'
		}
	];

	const registrationFilterPills: FilterPill[] = [
		{ id: '', label: m.all() },
		{ id: 'pending', label: m.pending(), color: 'amber' },
		{ id: 'processed', label: m.processed(), color: 'emerald' }
	];

	const statusMeta: Record<RegistrationRow['formStatus'], { label: string; className: string }> = {
		pending: {
			label: m.pending(),
			className: 'bg-secondary text-white border border-secondary/70 shadow-sm shadow-secondary/30'
		},
		processed: {
			label: m.processed(),
			className:
				'bg-emerald-600 text-white border border-emerald-700/60 shadow-sm shadow-emerald-700/30'
		}
	};

	const riskTone = (risk: number) => {
		if (risk >= 4)
			return 'bg-rose-600 text-white border border-rose-700/60 shadow-sm shadow-rose-700/30';
		if (risk >= 2)
			return 'bg-amber-500 text-white border border-amber-600/60 shadow-sm shadow-amber-600/30';
		return 'bg-border text-text-muted border border-border';
	};

	const columns: DataTableColumn[] = [
		{ key: 'client', label: m.client(), headerClass: 'pl-14' },
		{ key: 'referrer', label: m.referrer() },
		{ key: 'care', label: m.care_type() },
		{ key: 'risk', label: m.risk(), align: 'center', width: '90px' },
		{ key: 'status', label: m.status(), width: '130px' },
		{ key: 'submitted', label: m.submitted(), width: '180px' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	];

	const formatClientName = (row: RegistrationRow) =>
		`${row.clientFirstName} ${row.clientLastName}`.trim();

	const formatReferrer = (row: RegistrationRow) =>
		`${row.referrerFirstName} ${row.referrerLastName}`.trim();

	const formatDate = (value: string) =>
		new Date(value).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});

	const getCareTags = (row: RegistrationRow) =>
		careOptions.filter((option) => Boolean(row[option.key]));

	const paramMap: Record<keyof Omit<RegistrationFilters, 'status' | 'search'>, string> = {
		riskAggressiveBehavior: 'risk_aggressive_behavior',
		riskSuicidalSelfharm: 'risk_suicidal_selfharm',
		riskSubstanceAbuse: 'risk_substance_abuse',
		riskPsychiatricIssues: 'risk_psychiatric_issues',
		riskCriminalHistory: 'risk_criminal_history',
		riskFlightBehavior: 'risk_flight_behavior',
		riskWeaponPossession: 'risk_weapon_possession',
		riskSexualBehavior: 'risk_sexual_behavior',
		riskDayNightRhythm: 'risk_day_night_rhythm'
	};

	const buildQuery = (pageValue: number, nextFilters: RegistrationFilters) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));

		if (nextFilters.status) params.set('status', nextFilters.status);
		if (nextFilters.search) params.set('search', nextFilters.search);

		for (const [key, param] of Object.entries(paramMap)) {
			const value = nextFilters[key as keyof RegistrationFilters];
			if (value != null) {
				params.set(param, String(value));
			}
		}

		return params.toString();
	};

	const setFilters = (nextFilters: RegistrationFilters) => {
		updateQuery(1, nextFilters);
	};

	const updateQuery = (pageValue: number, nextFilters: RegistrationFilters) => {
		const nextQuery = buildQuery(pageValue, nextFilters);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const applySearch = () => {
		const nextSearch = searchTerm.trim();
		setFilters({ ...filters, search: nextSearch });
	};

	const clearFilters = () => {
		searchTerm = '';
		updateQuery(1, { ...defaultFilters });
	};
</script>

{#snippet tableFilters()}
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder={m.search_registrations()}
				bind:value={searchTerm}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				onkeydown={(event) => {
					if (event.key === 'Enter') applySearch();
				}}
				onblur={applySearch}
			/>
		</div>

		<FilterPills pills={registrationFilterPills} activeId={filters.status} onSelect={(id) => setFilters({ ...filters, status: id })} />

		<div class="hidden h-6 w-px bg-border sm:block"></div>

		<Filters
			{filters}
			groups={filterGroups}
			title={m.filter_registrations()}
			onUpdate={(nextFilters) => setFilters(nextFilters as unknown as RegistrationFilters)}
			onClear={clearFilters}
		/>
	</div>
{/snippet}

<svelte:head>
	<title>{m.registrations()} | MaiCare</title>
</svelte:head>

{#snippet clientCell(row: RegistrationRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<ClipboardList class="h-5 w-5" />
		</div>
		<div>
			<div class="flex items-center gap-2">
				<p class="text-sm font-semibold text-text">{formatClientName(row)}</p>
				{#if row.intakeFormId}
					<div
						class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
						title={m.intake_started()}
					>
						<ClipboardCheck class="h-2.5 w-2.5" />
					</div>
				{/if}
			</div>
			<p class="text-xs text-text-subtle">{m.bsn()} {row.clientBsnNumber}</p>
		</div>
	</div>
{/snippet}

{#snippet referrerCell(row: RegistrationRow)}
	<div class="space-y-1">
		<span class="text-sm font-medium text-text">{formatReferrer(row)}</span>
		<span class="text-xs text-text-subtle">{m.referrer()}</span>
	</div>
{/snippet}

{#snippet careCell(row: RegistrationRow)}
	{@const tags = getCareTags(row)}
	<div class="flex flex-wrap gap-2">
		{#if tags.length === 0}
			<span class="text-xs text-text-subtle">—</span>
		{:else}
			{#each tags as tag (tag.key)}
				<span
					class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold {tag.className}"
				>
					{tag.label}
				</span>
			{/each}
		{/if}
	</div>
{/snippet}

{#snippet riskCell(row: RegistrationRow)}
	<span
		class="inline-flex items-center justify-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold {riskTone(
			row.riskCount
		)}"
	>
		<ShieldAlert class="h-3.5 w-3.5" />
		{row.riskCount}
	</span>
{/snippet}

{#snippet statusCell(row: RegistrationRow)}
	{@const meta = statusMeta[row.formStatus]}
	<span
		class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold {meta.className}"
	>
		{meta.label}
	</span>
{/snippet}

{#snippet submittedCell(row: RegistrationRow)}
	<div class="flex items-center gap-2 text-sm text-text-muted">
		<Calendar class="h-4 w-4 text-text-subtle" />
		<span>{formatDate(row.submittedAt)}</span>
	</div>
{/snippet}

{#snippet actionsCell(row: RegistrationRow)}
	<div class="flex justify-end gap-1">
		<a
			href="/registrations/{row.id}"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.view_registration()}
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
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-indigo-100/70 to-emerald-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<ClipboardList class="h-5 w-5" />
					</span>
					<span>{m.registrations()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.care_registrations()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.registrations_description()}
				</p>
			</div>
		</div>
	</header>

	{#await registrationsDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each [1, 2, 3, 4] as _}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
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
			onPageChange={(nextPage) => updateQuery(nextPage, { ...filters })}
			onRowClick={(row) => goto(`/registrations/${row.id}`)}
			rowKey="id"
			title={m.registration_intake()}
			description={m.registration_intake_description()}
			filters={tableFilters}
			cells={{
				client: clientCell,
				referrer: referrerCell,
				care: careCell,
				risk: riskCell,
				status: statusCell,
				submitted: submittedCell,
				actions: actionsCell
			}}
		/>
	{:then registrationsData}
		{@const registrations = registrationsData.registrations}
		{@const pendingCount = registrations.filter(
			(row: RegistrationRow) => row.formStatus === 'pending'
		).length}
		{@const processedCount = registrations.filter(
			(row: RegistrationRow) => row.formStatus === 'processed'
		).length}
		{@const highRiskCount = registrations.filter(
			(row: RegistrationRow) => row.riskCount >= 3
		).length}

		{#if registrationsData.loadError}
			<InlineErrorBanner message={registrationsData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard
				label={m.total_forms()}
				value={registrationsData.pagination.count}
				description={m.submitted()}
				icon={FileText}
			/>
			<StatCard
				label={m.pending_review()}
				value={pendingCount}
				description={m.pending()}
				icon={Clock}
				color="secondary"
			/>
			<StatCard
				label={m.processed()}
				value={processedCount}
				description={m.processed()}
				icon={CheckCircle2}
				color="emerald"
			/>
			<StatCard
				label={m.high_risk()}
				value={highRiskCount}
				description={`${m.risk()} 3+`}
				icon={ShieldAlert}
				color="rose"
			/>
		</div>

		<DataTable
			{columns}
			rows={registrations}
			currentPage={registrationsData.pagination.page}
			pageSize={registrationsData.pagination.pageSize}
			totalCount={registrationsData.pagination.count}
			onPageChange={(nextPage) => updateQuery(nextPage, { ...filters })}
			onRowClick={(row) => goto(`/registrations/${row.id}`)}
			rowKey="id"
			title={m.registration_intake()}
			description={m.registration_intake_description()}
			filters={tableFilters}
			cells={{
				client: clientCell,
				referrer: referrerCell,
				care: careCell,
				risk: riskCell,
				status: statusCell,
				submitted: submittedCell,
				actions: actionsCell
			}}
		/>
	{/await}
</section>
