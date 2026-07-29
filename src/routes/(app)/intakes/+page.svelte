<script lang="ts">
	import {
		Calendar,
		ClipboardList,
		Search,
		Eye,
		ClipboardCheck,
		CheckCircle,
		Clock,
		Trash2
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import FilterDropdown from '$lib/components/ui/FilterDropdown.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import type { DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import type {
		IntakeRow as IntakeRowData,
		IntakeFilters,
		IntakesLoadResult,
		IntakesStatsLoadResult
	} from './+page';
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { intakes } from '$lib/api/intakes';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { getToastState } from '$lib/state/toast.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';

	type IntakeRow = IntakeRowData & {
		hasClient: boolean;
	};

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: IntakeFilters;
			};
			intakesData: Promise<IntakesLoadResult>;
			statsData: Promise<IntakesStatsLoadResult>;
		};
	}>();

	const intakesDataPromise = $derived.by(() => data.intakesData);
	const statsDataPromise = $derived.by(() => data.statsData);
	const initial = $derived.by(() => data.initial);
	const currentPage = $derived.by(() => initial.page);
	const pageSize = $derived.by(() => initial.pageSize);

	const appliedSearch = $derived.by(() => (initial.filters.search ?? '').trim());
	let searchTerm = $state(initial.filters.search ?? '');

	const auth = getAuthState();
	const toast = getToastState();

	let showDeleteModal = $state(false);
	let deletingRow = $state<IntakeRow | null>(null);
	let isDeleting = $state(false);
	let deleteError = $state('');

	const handleDeleteConfirm = async () => {
		if (!deletingRow) return;
		isDeleting = true;
		deleteError = '';
		try {
			const res = await intakes.delete(deletingRow.id);
			if (!res.success) {
				throw new Error(res.message || 'Failed to delete intake form.');
			}
			toast.success('Intake form deleted successfully.');
			showDeleteModal = false;
			deletingRow = null;
			invalidate('app:intakes:list');
			invalidate('app:intakes:stats');
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Failed to delete intake form.';
		} finally {
			isDeleting = false;
		}
	};

	const defaultFilters: IntakeFilters = {
		search: '',
		status: ''
	};

	let filters = $derived.by(() => ({
		...defaultFilters,
		...initial.filters
	}));

	const careOptions: Array<{ key: keyof IntakeRow; label: string; className: string }> = [
		{
			key: 'careProtectedLiving',
			label: m.protected_living(),
			className: 'border border-success/25 bg-success/10 text-success'
		},
		{
			key: 'careAssistedIndependentLiving',
			label: m.assisted_independent_living(),
			className: 'border border-info/25 bg-info/10 text-info'
		},
		{
			key: 'careRoomTrainingCenter',
			label: m.room_training_center(),
			className: 'border border-brand/25 bg-brand/10 text-brand'
		},
		{
			key: 'careAmbulatoryGuidance',
			label: m.ambulatory_guidance(),
			className: 'border border-warning/25 bg-warning/10 text-warning'
		}
	];

	const columns: DataTableColumn[] = [
		{ key: 'client', label: m.client(), headerClass: 'pl-14' },
		{ key: 'intakeDate', label: m.intake_date() },
		{ key: 'intakeStatus', label: m.intake_status() },
		{ key: 'goalAssessment', label: m.goal_assessment() },
		{ key: 'care', label: m.care_type() },
		{ key: 'location', label: m.location() },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	];

	const formatClientName = (row: IntakeRow) =>
		`${row.clientFirstName} ${row.clientLastName}`.trim();

	const formatDate = (value?: string | null) => {
		if (!value) return '—';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const getCareTags = (row: IntakeRow) => careOptions.filter((option) => Boolean(row[option.key]));

	const statusStyles: Record<IntakeRow['intakeStatus'], string> = {
		suitable: 'border-success/25 bg-success/10 text-success',
		unsuitable: 'border-error/25 bg-error/10 text-error',
		further_investigation: 'border-warning/25 bg-warning/10 text-warning',
		possible_palcement_date: 'border-info/25 bg-info/10 text-info',
		other: 'border-border bg-border/30 text-text-muted'
	};

	const statusLabels: Record<IntakeRow['intakeStatus'], string> = {
		suitable: m.suitable(),
		unsuitable: m.unsuitable(),
		further_investigation: m.further_investigation(),
		possible_palcement_date: m.possible_placement_date(),
		other: m.other()
	};

	const statusOptions: Array<{ value: IntakeFilters['status']; label: string }> = [
		{ value: '', label: m.all() },
		{ value: 'suitable', label: m.suitable() },
		{ value: 'unsuitable', label: m.unsuitable() },
		{ value: 'further_investigation', label: m.further_investigation() },
		{ value: 'possible_palcement_date', label: m.possible_placement_date() },
		{ value: 'other', label: m.other() }
	];

	const filterGroups = $derived([
		{
			label: m.status(),
			items: statusOptions
				.filter((o) => o.value !== '')
				.map((o) => ({ key: o.value, label: o.label }))
		}
	]);

	const currentDropdownFilters = $derived.by(() => {
		const state: Record<string, boolean> = {};
		if (filters.status) {
			state[filters.status] = true;
		}
		return state;
	});

	const buildQuery = (pageValue: number, nextFilters: IntakeFilters) => {
		const params = new SvelteURLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));

		if (nextFilters.status) params.set('status', nextFilters.status);
		if (nextFilters.search) params.set('search', nextFilters.search);

		return params.toString();
	};

	const setFilters = (nextFilters: IntakeFilters) => {
		updateQuery(1, nextFilters);
	};

	const updateQuery = (pageValue: number, nextFilters: IntakeFilters) => {
		const nextQuery = buildQuery(pageValue, nextFilters);
		if (page.url.searchParams.toString() === nextQuery) return;
		const nextHref = `${resolve('/(app)/intakes')}?${nextQuery}`;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- route is resolved above; only query params are composed dynamically.
		goto(nextHref, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	const viewIntake = (id: string) => goto(resolve('/(app)/intakes/[id]', { id }));

	const handleFilterUpdate = (newState: Record<string, boolean | string | number | undefined>) => {
		const activeKeys = Object.entries(newState)
			.filter(([, v]) => Boolean(v))
			.map(([k]) => k);

		let newStatus: IntakeFilters['status'] = '';

		if (activeKeys.length === 1) {
			newStatus = activeKeys[0] as IntakeFilters['status'];
		} else if (activeKeys.length > 1) {
			const currentStatus = filters.status;
			const newItem = activeKeys.find((k) => k !== currentStatus);
			newStatus = (newItem || activeKeys[activeKeys.length - 1]) as IntakeFilters['status'];
		}

		setFilters({ ...filters, status: newStatus });
	};

	const applySearch = (value: string) => {
		setFilters({ ...filters, search: value.trim() });
	};
</script>

<svelte:head>
	<title>{m.intake_page_title()}</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder={m.search_intakes_placeholder()}
				value={searchTerm}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				oninput={(e) => (searchTerm = e.currentTarget.value)}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						applySearch((event.currentTarget as HTMLInputElement).value);
					}
				}}
				onblur={(event) => applySearch((event.currentTarget as HTMLInputElement).value)}
			/>
		</div>

		<FilterDropdown
			filters={currentDropdownFilters}
			groups={filterGroups}
			onUpdate={handleFilterUpdate}
			onClear={() => setFilters({ ...filters, status: '' })}
			title={m.filter_by_status()}
			buttonLabel={m.status()}
		/>
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
				{#if row.hasClient}
					<span
						class="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success ring-1 ring-success/20"
					>
						{m.converted()}
					</span>
				{/if}
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
			class="inline-flex items-center rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success"
		>
			<CheckCircle class="mr-1.5 h-3.5 w-3.5" />
			{m.done()}
		</span>
	{:else}
		<span
			class="inline-flex items-center rounded-full border border-warning/25 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning"
		>
			<Clock class="mr-1.5 h-3.5 w-3.5" />
			{m.pending()}
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
	<div class="space-y-1">
		<span class="text-sm font-medium text-text-muted">{row.assignedLocationCity}</span>
		<span class="block text-xs text-text-subtle">{row.assignedLocationAddress}</span>
	</div>
{/snippet}

{#snippet actionsCell(row: IntakeRow)}
	{@const canDelete = auth.hasPermission(PERMISSIONS.INTAKE_FORM.DELETE)}
	{@const hasClient = row.hasClient}
	{@const isDisabled = !canDelete || hasClient}
	{@const deleteTooltip = !canDelete
		? 'You do not have permission to delete intake forms'
		: hasClient
			? 'Cannot delete an intake form that has been promoted to a client'
			: 'Delete intake form'}

	<div class="flex justify-end gap-1">
		<button
			type="button"
			onclick={() => viewIntake(row.id)}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
			aria-label={m.view_intake()}
			title={m.view_intake()}
		>
			<Eye class="h-4 w-4" />
		</button>

		<Tooltip content={deleteTooltip}>
			<button
				type="button"
				data-table-stop-row-click
				disabled={isDisabled}
				onclick={() => {
					if (!isDisabled) {
						deletingRow = row;
						deleteError = '';
						showDeleteModal = true;
					}
				}}
				class="flex h-8 w-8 items-center justify-center rounded-lg transition {isDisabled
					? 'cursor-not-allowed opacity-40 text-text-subtle'
					: 'text-text-subtle hover:bg-error/10 hover:text-error'}"
				aria-label={deleteTooltip}
			>
				<Trash2 class="h-4 w-4" />
			</button>
		</Tooltip>
	</div>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-brand/10 to-info/10 blur-2xl"
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

	{#await intakesDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each [1, 2, 3] as _ (_)}
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
			pagination={{
				mode: 'server',
				page: currentPage,
				pageSize,
				totalCount: 0,
				onPageChange: (nextPage) => updateQuery(nextPage, { ...filters })
			}}
			onRowClick={(row) => viewIntake(row.id)}
			rowKey="id"
			title={m.intake()}
			description={m.intake_management_description()}
			toolbar={tableFilters}
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
	{:then intakesData}
		{#if intakesData.loadError}
			<InlineErrorBanner
				message={intakesData.loadError}
				onRetry={() => invalidate('app:intakes:list')}
			/>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			<StatCard
				label={m.total_matching_intakes()}
				value={intakesData.pagination.count}
				description={m.active_filters_scope()}
				icon={ClipboardList}
			/>

			{#await statsDataPromise}
				<StatCard
					label={m.further_investigation()}
					value="—"
					description={m.global_total_scope()}
					icon={Search}
					color="amber"
				/>
				<StatCard
					label={m.without_goals()}
					value="—"
					description={m.global_total_scope()}
					icon={Clock}
					color="rose"
				/>
			{:then statsData}
				{#if statsData.loadError}
					<div class="sm:col-span-2 xl:col-span-2">
						<InlineErrorBanner
							message={statsData.loadError}
							onRetry={() => invalidate('app:intakes:stats')}
						/>
					</div>
				{/if}
				<StatCard
					label={m.further_investigation()}
					value={statsData.stats.furtherInvestigation}
					description={m.global_total_scope()}
					icon={Search}
					color="amber"
				/>
				<StatCard
					label={m.without_goals()}
					value={statsData.stats.withoutGoals}
					description={m.global_total_scope()}
					icon={Clock}
					color="rose"
				/>
			{/await}
		</div>

		<DataTable
			{columns}
			rows={intakesData.intakes}
			pagination={{
				mode: 'server',
				page: intakesData.pagination.page,
				pageSize: intakesData.pagination.pageSize,
				totalCount: intakesData.pagination.count,
				onPageChange: (nextPage) => updateQuery(nextPage, { ...filters })
			}}
			onRowClick={(row) => viewIntake(row.id)}
			rowKey="id"
			title={m.intake()}
			description={m.intake_management_description()}
			toolbar={tableFilters}
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
	{/await}
</section>

<!-- Delete Confirmation Modal -->
<Modal
	open={showDeleteModal}
	onClose={() => {
		if (!isDeleting) {
			showDeleteModal = false;
			deletingRow = null;
		}
	}}
	title="Delete Intake Form"
>
	<div class="space-y-4">
		<p class="text-sm font-medium text-text-muted">
			Are you sure you want to delete the intake form for
			<strong class="text-text">{deletingRow?.clientFirstName} {deletingRow?.clientLastName}</strong>?
			This action cannot be undone.
		</p>

		{#if deleteError}
			<InlineErrorBanner message={deleteError} />
		{/if}

		<div class="flex justify-end gap-3 pt-2">
			<Button
				variant="ghost"
				disabled={isDeleting}
				onclick={() => {
					showDeleteModal = false;
					deletingRow = null;
				}}
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				isLoading={isDeleting}
				onclick={handleDeleteConfirm}
			>
				Delete
			</Button>
		</div>
	</div>
</Modal>
