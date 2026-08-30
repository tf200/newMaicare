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
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import CreateEvaluationForm from '$lib/components/forms/CreateEvaluationForm.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { getAuthState } from '$lib/state/auth.svelte';
	import type { PageData } from './$types';
	import {
		loadDraftEvaluationList,
		loadEvaluationStats,
		loadSubmittedEvaluationList,
		loadUpcomingEvaluationList,
		type UpcomingEvaluation,
		type DraftEvaluation,
		type SubmittedEvaluation
	} from './+page';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDateOnly } from '$lib/utils/date';
	import { evaluationPageHref, type EvaluationPageKey } from './pagination';

	let { data } = $props<{ data: PageData }>();
	const auth = getAuthState();
	const canMutateEvaluations = $derived(auth.hasPermission(PERMISSIONS.CLIENT.EVALUATION_CREATE));

	let upcomingRetry = $state<{
		source: typeof data.upcoming;
		promise: typeof data.upcoming;
	} | null>(null);
	let draftsRetry = $state<{ source: typeof data.drafts; promise: typeof data.drafts } | null>(
		null
	);
	let submittedRetry = $state<{
		source: typeof data.submitted;
		promise: typeof data.submitted;
	} | null>(null);
	let statsRetry = $state<{ source: typeof data.stats; promise: typeof data.stats } | null>(null);

	const upcomingPromise = $derived(
		upcomingRetry && upcomingRetry.source === data.upcoming ? upcomingRetry.promise : data.upcoming
	);
	const draftsPromise = $derived(
		draftsRetry && draftsRetry.source === data.drafts ? draftsRetry.promise : data.drafts
	);
	const submittedPromise = $derived(
		submittedRetry && submittedRetry.source === data.submitted
			? submittedRetry.promise
			: data.submitted
	);
	const statsPromise = $derived(
		statsRetry && statsRetry.source === data.stats ? statsRetry.promise : data.stats
	);

	let showEvaluationForm = $state(false);
	let activeClientId = $state<string | null>(null);
	let activeEvaluationId = $state<string | null>(null);
	let activeClientName = $state<string | null>(null);

	const openCreateEvaluationForm = (clientId: string, clientFullName: string) => {
		if (!canMutateEvaluations) return;
		activeClientId = clientId;
		activeEvaluationId = null;
		activeClientName = clientFullName;
		showEvaluationForm = true;
	};

	const openExistingEvaluationForm = (evaluationId: string, clientFullName: string) => {
		activeClientId = null;
		activeEvaluationId = evaluationId;
		activeClientName = clientFullName;
		showEvaluationForm = true;
	};

	const handleEvaluationSaved = async () => {
		await invalidateAll();
	};

	const changeListingPage = (key: EvaluationPageKey, nextPage: number) => {
		const href = evaluationPageHref(page.url, key, nextPage);
		void goto(resolve(href as '/evaluations/'), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	const retryUpcoming = () => {
		upcomingRetry = {
			source: data.upcoming,
			promise: loadUpcomingEvaluationList(data.initial.upcomingPage, data.initial.pageSize)
		};
	};

	const retryDrafts = () => {
		draftsRetry = {
			source: data.drafts,
			promise: loadDraftEvaluationList(data.initial.draftsPage, data.initial.pageSize)
		};
	};

	const retrySubmitted = () => {
		submittedRetry = {
			source: data.submitted,
			promise: loadSubmittedEvaluationList(data.initial.submittedPage, data.initial.pageSize)
		};
	};

	const retryStats = () => {
		statsRetry = { source: data.stats, promise: loadEvaluationStats() };
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

	const formatDate = (dateStr: string) =>
		formatDateOnly(dateStr, getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

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
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand/10 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<ClipboardList class="h-5 w-5" />
					</span>
					<span>{m.care_coordination()}</span>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-text">{m.evaluations()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.evaluations_description()}
				</p>
			</div>
		</div>
	</header>

	<!-- KPI Row -->
	{#await statsPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each [1, 2, 3] as skeleton (skeleton)}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-14 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-3 w-36 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		</div>
	{:then stats}
		{#if stats.loadError}
			<InlineErrorBanner message={stats.loadError} onRetry={retryStats} />
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				<StatCard
					label={m.attention_required()}
					value={stats.attentionRequired}
					description={m.attention_required_description()}
					icon={AlertTriangle}
					color="rose"
				/>
				<StatCard
					label={m.in_progress()}
					value={stats.inProgress}
					description={m.in_progress_description()}
					icon={FileEdit}
					color="blue"
				/>
				<StatCard
					label={m.recently_finalized()}
					value={stats.recentlyFinalized}
					description={m.recently_finalized_description()}
					icon={CheckCircle2}
					color="emerald"
				/>
			</div>
		{/if}
	{:catch}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			<StatCard label={m.attention_required()} value="—" color="neutral" />
			<StatCard label={m.in_progress()} value="—" color="neutral" />
			<StatCard label={m.recently_finalized()} value="—" color="neutral" />
		</div>
	{/await}

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
				class="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-1 ring-1 ring-info/30"
			>
				<Target class="h-3.5 w-3.5 text-info" aria-hidden="true" />
				<span class="text-xs font-bold text-info-strong">
					{row.filledGoalsCount}/{row.totalGoalsCount}
				</span>
			</div>
		{/snippet}

		{#snippet upcomingActions(row: UpcomingEvaluation)}
			<PermissionGuard permission={PERMISSIONS.CLIENT.EVALUATION_CREATE}>
				<div class="flex justify-end">
					<button
						class="flex h-11 w-11 items-center justify-center rounded-xl text-text-subtle transition-colors hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none active:bg-border/70"
						aria-label={m.view_evaluation()}
						onclick={() =>
							openCreateEvaluationForm(
								row.clientId,
								`${row.clientFirstName} ${row.clientLastName}`
							)}
					>
						<ChevronRight class="h-5 w-5" />
					</button>
				</div>
			</PermissionGuard>
		{/snippet}

		{#await upcomingPromise}
			<DataTable
				columns={upcomingColumns}
				rows={[]}
				pagination={false}
				loading
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
		{:then upcoming}
			<DataTable
				columns={upcomingColumns}
				rows={upcoming.rows}
				pagination={{
					mode: 'server',
					page: upcoming.page,
					pageSize: upcoming.pageSize,
					totalCount: upcoming.totalCount,
					onPageChange: (nextPage) => changeListingPage('upcoming_page', nextPage)
				}}
				error={upcoming.loadError ?? undefined}
				onRetry={retryUpcoming}
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
		{:catch}
			<DataTable
				columns={upcomingColumns}
				rows={[]}
				pagination={false}
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
		{/await}
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
				{#snippet viewDraft()}
					<div class="flex justify-end">
						<button
							class="flex h-11 w-11 items-center justify-center rounded-xl text-text-subtle transition-colors hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none active:bg-border/70"
							aria-label={m.view_evaluation()}
							onclick={() =>
								openExistingEvaluationForm(
									row.evaluationId,
									`${row.clientFirstName} ${row.clientLastName}`
								)}
						>
							<Eye class="h-4 w-4" />
						</button>
					</div>
				{/snippet}
				<PermissionGuard permission={PERMISSIONS.CLIENT.EVALUATION_CREATE} fallback={viewDraft}>
					<div class="flex justify-end">
						<button
							class="flex h-11 w-11 items-center justify-center rounded-xl text-text-subtle transition-colors hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none active:bg-border/70"
							aria-label={m.continue_draft()}
							onclick={() =>
								openExistingEvaluationForm(
									row.evaluationId,
									`${row.clientFirstName} ${row.clientLastName}`
								)}
						>
							<ChevronRight class="h-4 w-4" />
						</button>
					</div>
				</PermissionGuard>
			{/snippet}

			{#await draftsPromise}
				<DataTable
					columns={draftColumns}
					rows={[]}
					pagination={false}
					loading
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
			{:then drafts}
				<DataTable
					columns={draftColumns}
					rows={drafts.rows}
					pagination={{
						mode: 'server',
						page: drafts.page,
						pageSize: drafts.pageSize,
						totalCount: drafts.totalCount,
						onPageChange: (nextPage) => changeListingPage('drafts_page', nextPage)
					}}
					error={drafts.loadError ?? undefined}
					onRetry={retryDrafts}
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
			{:catch}
				<DataTable
					columns={draftColumns}
					rows={[]}
					pagination={false}
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
			{/await}
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

			{#snippet submittedActions(row: SubmittedEvaluation)}
				<div class="flex justify-end">
					<button
						class="flex h-11 w-11 items-center justify-center rounded-xl text-text-subtle transition-colors hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none active:bg-border/70"
						aria-label={m.view_evaluation()}
						onclick={() =>
							openExistingEvaluationForm(
								row.evaluationId,
								`${row.clientFirstName} ${row.clientLastName}`
							)}
					>
						<Eye class="h-4 w-4" />
					</button>
				</div>
			{/snippet}

			{#await submittedPromise}
				<DataTable
					columns={submittedColumns}
					rows={[]}
					pagination={false}
					loading
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
			{:then submitted}
				<DataTable
					columns={submittedColumns}
					rows={submitted.rows}
					pagination={{
						mode: 'server',
						page: submitted.page,
						pageSize: submitted.pageSize,
						totalCount: submitted.totalCount,
						onPageChange: (nextPage) => changeListingPage('submitted_page', nextPage)
					}}
					error={submitted.loadError ?? undefined}
					onRetry={retrySubmitted}
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
			{:catch}
				<DataTable
					columns={submittedColumns}
					rows={[]}
					pagination={false}
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
			{/await}
		</div>
	</div>

	<CreateEvaluationForm
		bind:open={showEvaluationForm}
		clientId={activeClientId}
		evaluationId={activeEvaluationId}
		clientName={activeClientName}
		canMutate={canMutateEvaluations}
		onSaved={handleEvaluationSaved}
	/>
</section>
