<script lang="ts">
	import {
		ClipboardList,
		Target,
		AlertTriangle,
		UsersRound,
		CheckCircle2,
		FileEdit,
		ChevronRight,
		Eye
	} from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import CreateEvaluationForm from '$lib/components/forms/CreateEvaluationForm.svelte';
	import type { PageData } from './$types';
	import type { UpcomingEvaluation, DraftEvaluation, SubmittedEvaluation } from './+page';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props<{ data: PageData }>();

	const upcoming = $derived(data.upcoming);
	const submitted = $derived(data.submitted);
	const drafts = $derived(data.drafts);
	const stats = $derived(data.stats);

	let showEvaluationForm = $state(false);
	let activeClientId = $state<string | null>(null);

	const openEvaluationForm = (clientId: string) => {
		activeClientId = clientId;
		showEvaluationForm = true;
	};

	const handleEvaluationSaved = async () => {
		await invalidateAll();
	};

	// Columns for Upcoming Evaluations
	const upcomingColumns: DataTableColumn[] = [
		{ key: 'client', label: m.client(), headerClass: 'pl-14' },
		{ key: 'dueDate', label: m.due_date(), width: '150px' },
		{ key: 'status', label: m.status(), width: '180px' },
		{ key: 'goals', label: m.goals(), width: '120px', align: 'center' },
		{ key: 'actions', label: '', align: 'right', width: '70px' }
	];

	// Columns for Drafts
	const draftColumns: DataTableColumn[] = [
		{ key: 'client', label: m.client() },
		{ key: 'updatedAt', label: m.last_update(), width: '150px' },
		{ key: 'actions', label: '', align: 'right', width: '50px' }
	];

	// Columns for Submitted
	const submittedColumns: DataTableColumn[] = [
		{ key: 'client', label: m.client() },
		{ key: 'submittedAt', label: m.submitted(), width: '150px' },
		{ key: 'actions', label: '', align: 'right', width: '50px' }
	];

	const formatDate = (dateStr: string) => {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString(getLocale() === 'nl' ? 'nl-NL' : 'en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};

	const formatDateTime = (dateStr: string) => {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleString(getLocale() === 'nl' ? 'nl-NL' : 'en-GB', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	};
</script>

<svelte:head>
	<title>{m.evaluations()} | MaiCare</title>
</svelte:head>

<section class="space-y-8">
	<!-- Hero Header -->
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-indigo-100/70 to-violet-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<ClipboardList class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.evaluations()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.evaluations_description()}
				</p>
			</div>
		</div>
	</header>

	<!-- KPI Row -->
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.attention_required()}
				</div>
				<AlertTriangle class="h-4 w-4 text-rose-500" />
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-text">
				{stats.attentionRequired}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.attention_required_description()}</p>
		</div>

		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.in_progress()}
				</div>
				<FileEdit class="h-4 w-4 text-info" />
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-text">
				{stats.inProgress}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.in_progress_description()}</p>
		</div>

		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.recently_finalized()}
				</div>
				<CheckCircle2 class="h-4 w-4 text-success" />
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-text">
				{stats.recentlyFinalized}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">{m.recently_finalized_description()}</p>
		</div>
	</div>

	<!-- Primary Section: Upcoming Evaluations -->
	<div class="space-y-4">
		{#snippet upcomingClient(row: UpcomingEvaluation)}
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20"
				>
					<UsersRound class="h-5 w-5" />
				</div>
				<div>
					<p class="text-sm font-semibold text-text">
						{row.clientFirstName}
						{row.clientLastName}
					</p>
					<div class="flex items-center gap-2">
						{#if row.priority === 'critical'}
							<span
								class="inline-flex items-center gap-1 rounded-full border border-error/60 bg-error px-2 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-error/30"
							>
								{m.critical()}
							</span>
						{/if}
					</div>
				</div>
			</div>
		{/snippet}

		{#snippet upcomingDueDate(row: UpcomingEvaluation)}
			<div class="flex flex-col">
				<span class="text-sm font-semibold text-text">{formatDate(row.dueDate)}</span>
				<span class="text-xs font-medium {row.daysLeft <= 3 ? 'text-error' : 'text-text-muted'}">
					{m.days_left({ days: row.daysLeft })}
				</span>
			</div>
		{/snippet}

		{#snippet upcomingStatus(row: UpcomingEvaluation)}
			{#if row.hasDraft}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-info/60 bg-info px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-info/30"
				>
					<FileEdit class="h-3 w-3" />
					{m.draft_in_progress()}
				</span>
			{:else}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-secondary/70 bg-secondary px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-secondary/30"
				>
					{m.not_started()}
				</span>
			{/if}
		{/snippet}

		{#snippet upcomingGoals(row: UpcomingEvaluation)}
			<div
				class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 ring-1 ring-sky-200"
			>
				<Target class="h-3.5 w-3.5 text-sky-600" />
				<span class="text-xs font-bold text-sky-700">
					{row.filledGoalsCount}/{row.totalGoalsCount}
				</span>
			</div>
		{/snippet}

		{#snippet upcomingActions(row: UpcomingEvaluation)}
			<div class="flex justify-end">
				<button
					class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
					aria-label="View Evaluation"
					onclick={() => openEvaluationForm(row.clientId)}
				>
					<ChevronRight class="h-5 w-5" />
				</button>
			</div>
		{/snippet}

		<DataTable
			columns={upcomingColumns}
			rows={upcoming}
			rowKey="clientId"
			title={m.upcoming_evaluations()}
			description={m.upcoming_evaluations_description()}
			emptyTitle={m.no_evaluations_found()}
			cells={{
				client: upcomingClient,
				dueDate: upcomingDueDate,
				status: upcomingStatus,
				goals: upcomingGoals,
				actions: upcomingActions
			}}
		/>
	</div>

	<!-- Secondary Grid: Drafts and Submitted -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Recent Drafts -->
		<div class="space-y-4">
			{#snippet draftClient(row: DraftEvaluation)}
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-xl border border-info/60 bg-info text-white shadow-sm shadow-info/30"
					>
						<FileEdit class="h-4 w-4" />
					</div>
					<div class="flex flex-col">
						<span class="text-sm font-semibold text-text"
							>{row.clientFirstName} {row.clientLastName}</span
						>
						<span class="text-[10px] font-bold tracking-wider text-text-muted uppercase">
							{m.due({ date: formatDate(row.dueDate) })}
						</span>
					</div>
				</div>
			{/snippet}

			{#snippet draftUpdatedAt(row: DraftEvaluation)}
				<div class="flex flex-col">
					<span class="text-xs font-medium text-text-muted">{formatDateTime(row.updatedAt)}</span>
				</div>
			{/snippet}

			{#snippet draftActions(row: DraftEvaluation)}
				<div class="flex justify-end">
					<button
						class="text-text-subtle transition hover:text-text"
						aria-label="Continue Draft"
						onclick={() => openEvaluationForm(row.clientId)}
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			{/snippet}

			<DataTable
				columns={draftColumns}
				rows={drafts}
				rowKey="evaluationId"
				title={m.recent_drafts()}
				description={m.recent_drafts_description()}
				emptyTitle={m.no_drafts_found()}
				cells={{
					client: draftClient,
					updatedAt: draftUpdatedAt,
					actions: draftActions
				}}
			/>
		</div>

		<!-- Recently Submitted -->
		<div class="space-y-4">
			{#snippet submittedClient(row: SubmittedEvaluation)}
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-xl border border-success/60 bg-success text-white shadow-sm shadow-success/30"
					>
						<CheckCircle2 class="h-4 w-4" />
					</div>
					<div class="flex flex-col">
						<span class="text-sm font-semibold text-text"
							>{row.clientFirstName} {row.clientLastName}</span
						>
						<span class="text-[10px] font-bold tracking-wider text-text-muted uppercase">
							{m.finalized({ date: formatDate(row.evaluationDate) })}
						</span>
					</div>
				</div>
			{/snippet}

			{#snippet submittedAtSnippet(row: SubmittedEvaluation)}
				<div class="flex flex-col">
					<span class="text-xs font-medium text-text-muted">{formatDateTime(row.submittedAt)}</span>
				</div>
			{/snippet}

			{#snippet submittedActions()}
				<div class="flex justify-end">
					<button class="text-text-subtle transition hover:text-text" aria-label="View Evaluation">
						<Eye class="h-4 w-4" />
					</button>
				</div>
			{/snippet}

			<DataTable
				columns={submittedColumns}
				rows={submitted}
				rowKey="evaluationId"
				title={m.recently_submitted()}
				description={m.recently_submitted_description()}
				emptyTitle={m.no_submitted_evaluations_found()}
				cells={{
					client: submittedClient,
					submittedAt: submittedAtSnippet,
					actions: submittedActions
				}}
			/>
		</div>
	</div>

	<CreateEvaluationForm
		bind:open={showEvaluationForm}
		clientId={activeClientId}
		onSaved={handleEvaluationSaved}
	/>
</section>
