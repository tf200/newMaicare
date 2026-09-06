<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import {
		Target,
		CalendarClock,
		Activity,
		Plus,
		Eye,
		Pencil,
		AlertCircle,
		Play,
		CheckCircle2,
		Clock,
		ArrowRight,
		TrendingUp
	} from 'lucide-svelte';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import { getToastState } from '$lib/state/toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import GoalProgressModal from '$lib/components/clients/GoalProgressModal.svelte';
	import CreateGoalModal from '$lib/components/clients/CreateGoalModal.svelte';
	import UpdateGoalModal from '$lib/components/clients/UpdateGoalModal.svelte';
	import CreateEvaluationForm from '$lib/components/forms/CreateEvaluationForm.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { formatDateOnly } from '$lib/utils/date';
	import type { GoalsOverviewLoadResult } from './+page';
	import {
		createClientGoal,
		generateClientGoalSuggestion,
		updateClientGoal
	} from '$lib/api/clients';
	import type { CreateGoalRequest, UpdateClientGoalRequest } from '$lib/types/api';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
			};
			goalsData: Promise<GoalsOverviewLoadResult>;
			clientName?: string;
		};
	}>();
	const toast = getToastState();
	const auth = getAuthState();
	const canMutateEvaluations = $derived(auth.hasPermission(PERMISSIONS.CLIENT.EVALUATION_CREATE));

	let progressModalOpen = $state(false);
	let createGoalModalOpen = $state(false);
	let updateGoalModalOpen = $state(false);

	type GoalToEdit = {
		id: string;
		title: string;
		description: string | null;
		priority: 'high' | 'medium' | 'low';
		topic_id: string | null;
	};
	let selectedGoalToEdit = $state<GoalToEdit | null>(null);

	const breadcrumbs = getBreadcrumbsState();
	$effect(() => {
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: '/dashboard' },
			{ label: m.clients(), href: '/clients' },
			{
				label: data.clientName ?? m.breadcrumb_client_detail(),
				href: `/clients/${page.params.id}`
			},
			{ label: m.goals() }
		];
		return () => {
			breadcrumbs.items = [];
		};
	});

	let selectedGoalTitle = $state('');
	let selectedGoalId = $state<string | null>(null);

	let showEvaluationForm = $state(false);
	let activeClientId = $state<string | null>(null);
	let activeEvaluationId = $state<string | null>(null);
	let activeClientName = $state<string | null>(null);

	const openProgressModal = (goalId: string, title: string) => {
		selectedGoalId = goalId;
		selectedGoalTitle = title;
		progressModalOpen = true;
	};

	const openCreateEvaluationForm = (clientId: string) => {
		if (!canMutateEvaluations) return;
		activeClientId = clientId;
		activeEvaluationId = null;
		activeClientName = data.clientName ?? null;
		showEvaluationForm = true;
	};

	const openDraftEvaluationForm = (clientId: string, evaluationId: string) => {
		if (!canMutateEvaluations) return;
		openExistingEvaluationForm(clientId, evaluationId);
	};

	const openExistingEvaluationForm = (clientId: string, evaluationId: string) => {
		activeClientId = clientId;
		activeEvaluationId = evaluationId;
		activeClientName = data.clientName ?? null;
		showEvaluationForm = true;
	};

	const handleEvaluationSaved = async () => {
		await Promise.all([
			invalidate(`app:client:${page.params.id}:goals`),
			invalidate(`app:client:${page.params.id}:evaluation-history`),
			invalidate(`app:client:${page.params.id}:detail`)
		]);
	};

	const initial = $derived(data.initial);
	const goalsDataPromise = $derived(data.goalsData);

	const progressBadge: Record<string, string> = {
		no_progress: 'border-border bg-bg text-text-muted',
		regression: 'border-error/30 bg-error/10 text-error-strong',
		limited_progress: 'border-warning/30 bg-warning/10 text-warning-strong',
		good_progress: 'border-success/30 bg-success/10 text-success-strong',
		achieved: 'border-brand/30 bg-brand/10 text-brand-strong',
		blocked: 'border-error/30 bg-error/10 text-error-strong'
	};

	const progressLabel: Record<string, () => string> = {
		no_progress: m.no_progress,
		regression: m.regression,
		limited_progress: m.limited_progress,
		good_progress: m.good_progress,
		achieved: m.achieved,
		blocked: m.blocked
	};

	const priorityBadge: Record<string, string> = {
		low: 'border-border bg-bg text-text-muted',
		medium: 'border-info/30 bg-info/10 text-info-strong',
		high: 'border-warning/30 bg-warning/10 text-warning-strong'
	};
	const priorityLabel = (priority: GoalToEdit['priority']) => {
		if (priority === 'high') return m.high();
		if (priority === 'medium') return m.medium();
		return m.low();
	};

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');
	const formatEvaluationDate = (value: string | null) =>
		formatDateOnly(value, resolveLocale(), m.not_available_short());

	const formatSubmittedDate = (value: string) =>
		new Intl.DateTimeFormat(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(value));

	// Types for history table
	type HistoryRow = GoalsOverviewLoadResult['history'][0];

	const historyColumns: DataTableColumn[] = [
		{ key: 'evaluationDate', label: m.evaluation_date(), width: '180px' },
		{ key: 'completion', label: m.completion(), width: '140px', align: 'center' },
		{ key: 'creator', label: m.evaluator(), width: '180px' },
		{ key: 'submitted', label: m.submitted(), width: '150px' },
		{ key: 'actions', label: '', align: 'right', width: '80px' }
	];

	const buildQuery = (nextPage: number, nextPageSize: number) => {
		const searchParams = new SvelteURLSearchParams();
		searchParams.set('page', String(nextPage));
		searchParams.set('page_size', String(nextPageSize));
		return searchParams.toString();
	};

	const updateHistoryPage = (nextPage: number) => {
		const query = buildQuery(nextPage, initial.pageSize);
		if (page.url.searchParams.toString() === query) return;
		// The query string is constructed separately so pagination remains in the URL.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(resolve('/(app)/clients/[id]/goals', { id: page.params.id ?? '' }) + `?${query}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};
</script>

<svelte:head>
	<title>{m.goals_evaluations()} | MaiCare</title>
</svelte:head>

{#snippet historyEvaluationDateCell(row: HistoryRow)}
	<span class="text-sm font-semibold text-text">
		{formatEvaluationDate(row.evaluation_date)}
	</span>
{/snippet}

{#snippet historyCompletionCell(row: HistoryRow)}
	<span class="text-sm font-semibold text-text">
		{row.filled_goals_count}/{row.total_goals_count}
	</span>
{/snippet}

{#snippet historyCreatorCell(row: HistoryRow)}
	<span class="text-sm font-medium text-text">
		{row.creator_name || m.not_available_short()}
	</span>
{/snippet}

{#snippet historySubmittedCell(row: HistoryRow)}
	<span class="text-sm font-medium text-text-muted">
		{formatSubmittedDate(row.submitted_at)}
	</span>
{/snippet}

{#snippet historyActionsCell(row: HistoryRow)}
	<div class="flex justify-end gap-1">
		<button
			class="flex h-10 w-10 items-center justify-center rounded-xl text-text-subtle transition hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
			title={m.view_evaluation()}
			aria-label={m.view_evaluation()}
			onclick={() => openExistingEvaluationForm(page.params.id ?? '', row.evaluation_id)}
		>
			<Eye class="h-4 w-4" />
		</button>
	</div>
{/snippet}

{#await goalsDataPromise}
	<div class="space-y-4">
		<div class="h-40 w-full animate-pulse rounded-3xl border border-border bg-surface"></div>
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
			<div class="space-y-4 lg:col-span-8">
				<div class="h-48 w-full animate-pulse rounded-3xl border border-border bg-surface"></div>
				<div class="h-64 w-full animate-pulse rounded-3xl border border-border bg-surface"></div>
			</div>
			<div class="space-y-4 lg:col-span-4">
				<div class="h-40 w-full animate-pulse rounded-3xl border border-border bg-surface"></div>
				<div class="h-40 w-full animate-pulse rounded-3xl border border-border bg-surface"></div>
			</div>
		</div>
	</div>
{:then goalsData}
	{@const lastCompleted = goalsData.history[0] ?? null}

	<section class="space-y-8 pb-12">
		<header
			class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
		>
			<div class="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-2">
					<div class="flex items-center gap-3 text-sm font-semibold text-brand">
						<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
							<Target class="h-5 w-5" />
						</span>
						<span>{m.client_care_plan()}</span>
					</div>
					<h1 class="text-2xl font-bold tracking-tight text-text">
						{m.goals_evaluations()}
					</h1>
					<p class="max-w-2xl text-sm font-medium text-text-muted">
						{m.goals_evaluations_description()}
					</p>
				</div>

				<div class="flex items-center gap-3">
					<Button
						disabled={!goalsData.can_update_goals}
						onclick={() => (createGoalModalOpen = true)}
						class="gap-2"
					>
						<Plus class="h-4 w-4" />
						{m.new_goal()}
					</Button>
				</div>
			</div>
		</header>
		{#if goalsData.loadError}
			<InlineErrorBanner
				message={goalsData.loadError}
				onRetry={() => invalidate(`app:client:${page.params.id}:goals`)}
			/>
		{/if}

		{#if !goalsData.can_update_goals}
			<div
				class="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-warning-strong"
			>
				<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
				<div class="space-y-1">
					<p class="text-sm font-semibold">{m.goals_update_blocked()}</p>
					<p class="text-xs font-medium">
						{goalsData.goal_update_block_reason || m.goals_blocked_tooltip()}
					</p>
				</div>
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
			<!-- Left Column: Active Goals & History -->
			<div class="space-y-8 lg:col-span-8">
				<!-- Active Goals -->
				<div class="space-y-6">
					<div class="flex items-center justify-between px-1">
						<h2 class="text-lg font-semibold tracking-tight text-text">
							{m.active_goals()}
						</h2>
						<span
							class="rounded-full border border-border bg-bg px-3 py-1 text-xs font-bold text-text-muted"
						>
							{goalsData.active_goals.length}
							{m.goals()}
						</span>
					</div>

					{#if goalsData.active_goals.length === 0}
						<div
							class="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-surface shadow-sm"
						>
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full bg-bg text-text-muted"
							>
								<Activity class="h-8 w-8" />
							</div>
							<p class="text-lg font-semibold tracking-tight text-text">
								{m.no_active_goals()}
							</p>
							<p class="text-sm text-text-muted">
								{m.add_goals_to_track()}
							</p>
						</div>
					{:else}
						<div class="grid gap-4 sm:grid-cols-2">
							{#each goalsData.active_goals as goal (goal.id)}
								<article
									class="group relative flex flex-col justify-between rounded-3xl border border-border bg-surface p-6 shadow-sm transition-colors hover:border-brand/30"
								>
									<div class="space-y-4">
										<div class="flex items-start justify-between">
											<span class="text-xs font-semibold tracking-wide text-text-subtle uppercase">
												{goal.topic_name}
											</span>
											<div
												class="flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
											>
												<button
													disabled={!goalsData.can_update_goals}
													onclick={() => {
														selectedGoalToEdit = {
															id: goal.id,
															title: goal.title,
															description: goal.description,
															priority: goal.priority,
															topic_id: goal.topic_id
														};
														updateGoalModalOpen = true;
													}}
													class="flex h-10 w-10 items-center justify-center rounded-xl text-text-subtle hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30"
													aria-label={m.edit_goals()}
												>
													<Pencil class="h-3.5 w-3.5" />
												</button>
											</div>
										</div>
										<h3 class="text-lg leading-tight font-semibold text-text">
											{goal.title}
										</h3>

										<div class="flex flex-wrap items-center gap-2">
											<span
												class="inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {priorityBadge[
													goal.priority
												] || priorityBadge.medium}"
											>
												{priorityLabel(goal.priority)}
											</span>
											{#if goal.last_evaluation_progress}
												<span
													class="inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {progressBadge[
														goal.last_evaluation_progress
													] || progressBadge.no_progress}"
												>
													{(
														progressLabel[goal.last_evaluation_progress] ||
														(() => goal.last_evaluation_progress)
													)()}
												</span>
											{/if}
										</div>

										<div class="mt-6 border-t border-border pt-4">
											<Button
												variant="ghost"
												onclick={() => openProgressModal(goal.id, goal.title)}
												class="h-10 w-full justify-between px-3 text-xs font-bold text-text-muted hover:text-brand"
											>
												{m.view_progress_history()}
												<TrendingUp class="h-3.5 w-3.5" />
											</Button>
										</div>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Evaluation History -->
				<DataTable
					columns={historyColumns}
					rows={goalsData.history}
					pagination={{
						mode: 'server',
						page: goalsData.historyPagination.page,
						pageSize: goalsData.historyPagination.pageSize,
						totalCount: goalsData.historyPagination.count,
						onPageChange: updateHistoryPage
					}}
					error={goalsData.historyLoadError ?? undefined}
					onRetry={() => invalidate(`app:client:${page.params.id}:evaluation-history`)}
					title={m.evaluation_history()}
					description={m.evaluation_history_description()}
					emptyTitle={m.no_history_found()}
					emptyDescription={m.completed_evaluations_listed()}
					cells={{
						evaluationDate: historyEvaluationDateCell,
						completion: historyCompletionCell,
						creator: historyCreatorCell,
						submitted: historySubmittedCell,
						actions: historyActionsCell
					}}
				/>
			</div>

			<!-- Right Column: Status & Actions -->
			<div class="space-y-6 lg:col-span-4">
				<div class="sticky top-24 space-y-6">
					<!-- Next Evaluation Card -->
					<div
						class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm"
					>
						<div class="relative space-y-4">
							<div class="flex items-center justify-between">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
								>
									<CalendarClock class="h-5 w-5" />
								</div>
								<span class="text-xs font-semibold tracking-wide text-text-subtle uppercase"
									>{m.evaluation_period()}</span
								>
							</div>
							<div>
								<h3 class="text-sm font-semibold text-text-muted">
									{m.next_review_in()}
								</h3>
								<div class="mt-1 flex items-baseline gap-1">
									<span class="text-4xl font-bold tracking-tight text-text">
										{goalsData.days_left ?? m.not_available_short()}
									</span>
									<span class="text-lg font-medium text-text-muted">{m.days()}</span>
								</div>
								<p class="mt-2 text-xs font-medium text-text-subtle">
									{m.due_on({ date: formatEvaluationDate(goalsData.next_evaluation_date) })}
								</p>
							</div>
						</div>
					</div>

					<!-- Draft / Action Card -->
					<PermissionGuard permission={PERMISSIONS.CLIENT.EVALUATION_CREATE}>
						{#if goalsData.my_draft_evaluation_id}
							<div class="rounded-3xl border border-warning/30 bg-warning/10 p-6 shadow-sm">
								<div class="space-y-4">
									<div class="flex items-center gap-2">
										<Clock class="h-5 w-5 text-warning-strong" />
										<h3 class="text-lg font-semibold text-warning-strong">
											{m.draft_in_progress_title()}
										</h3>
									</div>
									<p class="text-sm font-medium text-text-muted">
										{m.draft_in_progress_description()}
									</p>
									<Button
										class="h-12 w-full gap-2"
										onclick={() => {
											const clientId = page.params.id;
											if (!clientId || !goalsData.my_draft_evaluation_id) return;
											openDraftEvaluationForm(clientId, goalsData.my_draft_evaluation_id);
										}}
									>
										<Play class="h-4 w-4" fill="currentColor" />
										{m.continue_evaluation()}
									</Button>
								</div>
							</div>
						{:else if goalsData.is_responsible_employee}
							<div class="rounded-3xl border border-brand/30 bg-brand/10 p-6 shadow-sm">
								<div class="space-y-4">
									<div class="flex items-center gap-2 text-brand-strong">
										<CheckCircle2 class="h-5 w-5" />
										<h3 class="text-lg font-semibold">{m.ready_for_review()}</h3>
									</div>
									<p class="text-sm font-medium text-text-muted">
										{m.start_evaluation_description()}
									</p>
									<Button
										class="h-12 w-full gap-2"
										onclick={() => {
											const clientId = page.params.id;
											if (!clientId) return;
											openCreateEvaluationForm(clientId);
										}}
									>
										<Plus class="h-4 w-4" />
										{m.start_evaluation()}
									</Button>
								</div>
							</div>
						{/if}
					</PermissionGuard>

					<!-- Last Evaluation Summary -->
					<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
						<h3 class="text-xs font-semibold tracking-wide text-text-subtle uppercase">
							{m.last_completed()}
						</h3>
						<div class="mt-4 space-y-3">
							{#if lastCompleted}
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-text-muted"
									>
										<CheckCircle2 class="h-4 w-4" />
									</div>
									<div class="flex flex-col">
										<span class="text-sm font-bold text-text">
											{formatEvaluationDate(lastCompleted.evaluation_date)}
										</span>
										<span class="text-xs font-medium text-text-muted">
											{lastCompleted.creator_name}
										</span>
									</div>
								</div>
								<button
									class="group flex min-h-11 w-full items-center justify-between rounded-xl border border-border p-3 text-xs font-bold text-text-muted transition-colors hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
									onclick={() =>
										openExistingEvaluationForm(page.params.id ?? '', lastCompleted.evaluation_id)}
								>
									{m.view_full_report()}
									<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
								</button>
							{:else}
								<p class="text-sm font-medium text-text-subtle italic">
									{m.no_past_evaluations()}
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{/await}

<GoalProgressModal
	bind:open={progressModalOpen}
	clientId={page.params.id ?? ''}
	goalId={selectedGoalId}
	goalTitle={selectedGoalTitle}
/>

<CreateEvaluationForm
	bind:open={showEvaluationForm}
	clientId={activeClientId}
	evaluationId={activeEvaluationId}
	clientName={activeClientName}
	canMutate={canMutateEvaluations}
	onSaved={handleEvaluationSaved}
/>

<CreateGoalModal
	bind:open={createGoalModalOpen}
	clientId={page.params.id ?? ''}
	onSave={async (goal: CreateGoalRequest) => {
		await createClientGoal(page.params.id ?? '', goal);
		toast.success(m.goal_created_success());
		try {
			await Promise.all([
				invalidate(`app:client:${page.params.id}:goals`),
				invalidate(`app:client:${page.params.id}:detail`)
			]);
		} catch (error) {
			console.error('Failed to refresh after creating goal:', error);
		}
	}}
	onGenerate={async (topicId: string) => {
		const res = await generateClientGoalSuggestion(page.params.id ?? '', topicId);
		return res.data;
	}}
	onCancel={() => (createGoalModalOpen = false)}
/>

{#if selectedGoalToEdit}
	<UpdateGoalModal
		bind:open={updateGoalModalOpen}
		goal={selectedGoalToEdit}
		onSave={async (goalId: string, data: UpdateClientGoalRequest) => {
			await updateClientGoal(page.params.id ?? '', goalId, data);
			toast.success(m.goal_updated_success());
			try {
				await Promise.all([
					invalidate(`app:client:${page.params.id}:goals`),
					invalidate(`app:client:${page.params.id}:detail`)
				]);
			} catch (error) {
				console.error('Failed to refresh after updating goal:', error);
			}
		}}
		onCancel={() => (updateGoalModalOpen = false)}
	/>
{/if}
