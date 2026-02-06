<script lang="ts">
	import { Calendar, ClipboardList, ShieldAlert, Search, Eye, ClipboardCheck } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type { DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Filters from '$lib/components/ui/FilterDropdown.svelte';
	import type { RegistrationRow } from './+page';
	import type { RegistrationFilters } from '$lib/types/registrations';
	import type { PaginationState } from '$lib/types/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props<{
		data: {
			registrations: RegistrationRow[];
			pagination: PaginationState<RegistrationFilters>;
			loadError?: string | null;
		};
	}>();

	const registrations = $derived.by(() => data.registrations);
	const pagination = $derived.by(() => data.pagination);
	const currentPage = $derived.by(() => pagination.page);
	const pageSize = $derived.by(() => pagination.pageSize);
	const loadError = $derived.by(() => data.loadError);

	const appliedSearch = $derived.by(() => (pagination.filters.search ?? '').trim());
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
		...pagination.filters
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

	const totalCount = $derived.by(() => pagination.count);
	const pendingCount = $derived.by(
		() => registrations.filter((row: RegistrationRow) => row.formStatus === 'pending').length
	);
	const processedCount = $derived.by(
		() => registrations.filter((row: RegistrationRow) => row.formStatus === 'processed').length
	);
	const highRiskCount = $derived.by(
		() => registrations.filter((row: RegistrationRow) => row.riskCount >= 3).length
	);

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

		<div class="flex flex-wrap items-center gap-2">
			<button
				onclick={() => setFilters({ ...filters, status: '' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.status === ''
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.all()}
			</button>
			<button
				onclick={() => setFilters({ ...filters, status: 'pending' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.status ===
				'pending'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.pending()}
			</button>
			<button
				onclick={() => setFilters({ ...filters, status: 'processed' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.status ===
				'processed'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.processed()}
			</button>
		</div>

		<div class="hidden h-6 w-px bg-border sm:block"></div>

		<Filters
			{filters}
			groups={filterGroups}
			title="Filter registrations"
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
						title="Intake started"
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
			title="View registration"
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
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-teal-100/70 to-emerald-100/20 blur-2xl"
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

	{#if loadError}
		<InlineErrorBanner message={loadError} onRetry={() => invalidateAll()} />
	{/if}

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.total_forms()}
			</div>
			<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">{totalCount}</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.submitted()}</p>
		</div>
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.pending_review()}
			</div>
			<div class="mt-2 text-2xl font-bold tracking-tight text-secondary sm:text-3xl">
				{pendingCount}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.pending()}</p>
		</div>
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.processed()}
			</div>
			<div class="mt-2 text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
				{processedCount}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.processed()}</p>
		</div>
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.high_risk()}
			</div>
			<div class="mt-2 text-2xl font-bold tracking-tight text-rose-600 sm:text-3xl">
				{highRiskCount}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.risk()} 3+</p>
		</div>
	</div>

	<DataTable
		{columns}
		rows={registrations}
		{currentPage}
		{pageSize}
		totalCount={pagination.count}
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
</section>
