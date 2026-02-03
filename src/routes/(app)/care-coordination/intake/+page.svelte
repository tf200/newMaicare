<script lang="ts">
	import {
		Calendar,
		ClipboardList,
		Search,
		Eye,
		ClipboardCheck,
		MapPin,
		CheckCircle,
		Clock
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import type { DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import type { IntakeRow, IntakeFilters } from './+page';
	import type { PaginationState } from '$lib/types/ui';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props<{
		data: {
			intakes: IntakeRow[];
			stats: { total: number; completed: number; pending: number };
			pagination: PaginationState<IntakeFilters>;
		};
	}>();

	const intakes = $derived.by(() => data.intakes);
	const stats = $derived.by(() => data.stats);
	const pagination = $derived.by(() => data.pagination);
	const currentPage = $derived.by(() => pagination.page);
	const pageSize = $derived.by(() => pagination.pageSize);

	const appliedSearch = $derived.by(() => (pagination.filters.search ?? '').trim());
	let searchTerm = $state('');

	$effect(() => {
		searchTerm = appliedSearch;
	});

	const defaultFilters: IntakeFilters = {
		search: '',
		status: ''
	};

	let filters = $derived.by(() => ({
		...defaultFilters,
		...pagination.filters
	}));

	const careOptions: Array<{ key: keyof IntakeRow; label: string; className: string }> = [
		{
			key: 'careProtectedLiving',
			label: 'Protected living',
			className: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
		},
		{
			key: 'careAssistedIndependentLiving',
			label: 'Assisted living',
			className: 'bg-blue-500/10 text-blue-700 border border-blue-500/20'
		},
		{
			key: 'careRoomTrainingCenter',
			label: 'Room training',
			className: 'bg-purple-500/10 text-purple-700 border border-purple-500/20'
		},
		{
			key: 'careAmbulatoryGuidance',
			label: 'Ambulatory guidance',
			className: 'bg-amber-400/15 text-amber-700 border border-amber-400/30'
		}
	];

	const columns: DataTableColumn[] = [
		{ key: 'client', label: m.client(), headerClass: 'pl-14' },
		{ key: 'intakeDate', label: 'Intake Date' },
		{ key: 'intakeStatus', label: m.intake_status() },
		{ key: 'goalAssessment', label: 'Goal Assessment' },
		{ key: 'care', label: m.care_type() },
		{ key: 'location', label: 'Location' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	];

	const formatClientName = (row: IntakeRow) =>
		`${row.clientFirstName} ${row.clientLastName}`.trim();

	const formatDate = (value: string) =>
		new Date(value).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});

	const getCareTags = (row: IntakeRow) => careOptions.filter((option) => Boolean(row[option.key]));

	const statusStyles: Record<IntakeRow['intakeStatus'], string> = {
		scheduled: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
		in_progress: 'bg-amber-400/15 text-amber-700 border-amber-400/30',
		completed: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
	};

	const statusLabels: Record<IntakeRow['intakeStatus'], string> = {
		scheduled: m.scheduled(),
		in_progress: 'In Progress',
		completed: m.processed()
	};
</script>

<svelte:head>
	<title>Intake | MaiCare</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder="Search intakes..."
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
				onclick={() => setFilters({ ...filters, status: 'done' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.status === 'done'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				Completed
			</button>
		</div>
	</div>
{/snippet}

{#snippet clientCell(row: IntakeRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<ClipboardList class="h-5 w-5" />
		</div>
		<div>
			<div class="flex items-center gap-2">
				<p class="text-sm font-semibold text-text">{formatClientName(row)}</p>
			</div>
			<p class="text-xs text-text-subtle">{m.bsn()} {row.clientBsnNumber}</p>
		</div>
	</div>
{/snippet}

{#snippet intakeDateCell(row: IntakeRow)}
	<div class="flex items-center gap-2 text-sm text-text-muted">
		<Calendar class="h-4 w-4 text-text-subtle" />
		<span>{formatDate(row.intakeDate)}</span>
	</div>
{/snippet}

{#snippet intakeStatusCell(row: IntakeRow)}
	<span
		class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold {statusStyles[
			row.intakeStatus
		]}"
	>
		{statusLabels[row.intakeStatus]}
	</span>
{/snippet}

{#snippet goalAssessmentCell(row: IntakeRow)}
	{#if row.goalAssessmentStatus === 'done'}
		<span
			class="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600"
		>
			<CheckCircle class="mr-1.5 h-3.5 w-3.5" />
			Done
		</span>
	{:else}
		<span
			class="inline-flex items-center rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary shadow-sm shadow-secondary/10"
		>
			<Clock class="mr-1.5 h-3.5 w-3.5" />
			Pending
		</span>
	{/if}
{/snippet}

{#snippet careCell(row: IntakeRow)}
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

{#snippet locationCell(row: IntakeRow)}
	<div class="flex items-center gap-2 text-sm text-text-muted">
		<MapPin class="h-4 w-4 text-text-subtle" />
		<span>{row.assignedLocation}</span>
	</div>
{/snippet}

{#snippet actionsCell(row: IntakeRow)}
	<div class="flex justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title="View intake"
		>
			<Eye class="h-4 w-4" />
		</button>
	</div>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-blue-100/70 to-indigo-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<ClipboardCheck class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.intake_management()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.intake_management_description()}
				</p>
			</div>
		</div>
	</header>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				Total Intakes
			</div>
			<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">{stats.total}</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.all()}</p>
		</div>
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				Completed Assessments
			</div>
			<div class="mt-2 text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
				{stats.completed}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.processed()}</p>
		</div>
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				Pending Assessments
			</div>
			<div class="mt-2 text-2xl font-bold tracking-tight text-secondary sm:text-3xl">
				{stats.pending}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.pending()}</p>
		</div>
	</div>

	<DataTable
		{columns}
		rows={intakes}
		{currentPage}
		{pageSize}
		totalCount={pagination.count}
		onPageChange={(nextPage) => updateQuery(nextPage, { ...filters })}
		rowKey="id"
		title={m.intake()}
		description={m.intake_management_description()}
		filters={tableFilters}
		cells={{
			client: clientCell,
			intakeDate: intakeDateCell,
			intakeStatus: intakeStatusCell,
			goalAssessment: goalAssessmentCell,
			care: careCell,
			location: locationCell,
			actions: actionsCell
		}}
	/>
</section>
