<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';
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
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import GoalProgressModal from '$lib/components/clients/GoalProgressModal.svelte';
	import CreateGoalModal from '$lib/components/clients/CreateGoalModal.svelte';
	import UpdateGoalModal from '$lib/components/clients/UpdateGoalModal.svelte';
	import CreateEvaluationForm from '$lib/components/forms/CreateEvaluationForm.svelte';
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
		activeClientId = clientId;
		activeEvaluationId = null;
		activeClientName = data.clientName ?? null;
		showEvaluationForm = true;
	};

	const openDraftEvaluationForm = (clientId: string, evaluationId: string) => {
		activeClientId = clientId;
		activeEvaluationId = evaluationId;
		activeClientName = data.clientName ?? null;
		showEvaluationForm = true;
	};

	const handleEvaluationSaved = async () => {
		await invalidateAll();
	};

	const initial = $derived(data.initial);
	const goalsDataPromise = $derived(data.goalsData);

	const progressBadge: Record<string, string> = {
		no_progress:
			'bg-zinc-500/10 text-zinc-700 border-zinc-500/20 dark:bg-zinc-500/20 dark:text-zinc-300 dark:border-zinc-500/30',
		regression:
			'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
		limited_progress:
			'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
		good_progress:
			'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
		achieved:
			'bg-teal-500/10 text-teal-700 border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/30',
		blocked:
			'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
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
		low: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20 dark:bg-zinc-500/20 dark:text-zinc-300 dark:border-zinc-500/30',
		medium:
			'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30',
		high: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
	};

	const formatDate = (value: string | null) => {
		if (!value) return 'N/A';
		return new Intl.DateTimeFormat('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(value));
	};

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
		const searchParams = new URLSearchParams();
		searchParams.set('page', String(nextPage));
		searchParams.set('page_size', String(nextPageSize));
		return searchParams.toString();
	};

	const updateHistoryPage = (nextPage: number) => {
		const query = buildQuery(nextPage, initial.pageSize);
		if (page.url.searchParams.toString() === query) return;
		const nextUrl = new URL(page.url);
		nextUrl.search = query;
		window.history.replaceState(window.history.state, '', nextUrl);
		void invalidateAll();
	};
</script>

<svelte:head>
	<title>{m.goals_evaluations()} | MaiCare</title>
</svelte:head>

{#snippet historyEvaluationDateCell(row: HistoryRow)}
	<span class="text-sm font-semibold text-zinc-900 dark:text-white">
		{formatDate(row.evaluation_date)}
	</span>
{/snippet}

{#snippet historyCompletionCell(row: HistoryRow)}
	<span class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
		{row.filled_goals_count}/{row.total_goals_count}
	</span>
{/snippet}

{#snippet historyCreatorCell(row: HistoryRow)}
	<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
		{row.creator_name || 'N/A'}
	</span>
{/snippet}

{#snippet historySubmittedCell(row: HistoryRow)}
	<span class="text-sm font-medium text-zinc-500 dark:text-zinc-400">
		{formatDate(row.submitted_at)}
	</span>
{/snippet}

{#snippet historyActionsCell(row: HistoryRow)}
	<div class="flex justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
			title={m.view_evaluation()}
		>
			<Eye class="h-4 w-4" />
		</button>
	</div>
{/snippet}

{#await goalsDataPromise}
	<div class="space-y-4">
		<div class="h-24 w-full animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800"></div>
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
			<div class="space-y-4 lg:col-span-8">
				<div class="h-48 w-full animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800/50"></div>
				<div class="h-48 w-full animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800/50"></div>
			</div>
			<div class="space-y-4 lg:col-span-4">
				<div class="h-32 w-full animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800/50"></div>
				<div class="h-32 w-full animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800/50"></div>
			</div>
		</div>
	</div>
{:then goalsData}
	{@const lastCompleted = goalsData.history[0] ?? null}

	<section class="space-y-8 pb-12">
		<!-- Standard Header Card -->
		<header
			class="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90"
		>
			<div
				class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-teal-400/20 to-emerald-500/10 blur-2xl"
			></div>

			<div class="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-2">
					<div class="hidden"></div>
					<div
						class="flex items-center gap-3 text-sm font-semibold text-teal-600 dark:text-teal-400"
					>
						<span
							class="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/10"
						>
							<Target class="h-5 w-5" />
						</span>
						<span>{m.client_care_plan()}</span>
					</div>
					<h1 class="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
						{m.goals_evaluations()}
					</h1>
					<p class="max-w-2xl text-sm font-medium text-zinc-500 dark:text-zinc-400">
						{m.goals_evaluations_description()}
					</p>
				</div>

				<div class="flex items-center gap-3">
					<Button
						disabled={!goalsData.can_update_goals}
						onclick={() => (createGoalModalOpen = true)}
						class="gap-2 bg-teal-600 text-white shadow-sm hover:opacity-90 dark:bg-teal-400 dark:text-black"
					>
						<Plus class="h-4 w-4" />
						{m.new_goal()}
					</Button>
				</div>
			</div>
		</header>
		{#if goalsData.loadError}
			<div
				class="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300"
			>
				<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
				<p class="text-sm font-medium">{goalsData.loadError}</p>
			</div>
		{/if}

		{#if !goalsData.can_update_goals}
			<div
				class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
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
			<div class="space-y-12 lg:col-span-8">
				<!-- Active Goals -->
				<div class="space-y-6">
					<div class="flex items-center justify-between px-1">
						<h2 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
							{m.active_goals()}
						</h2>
						<span
							class="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
						>
							{goalsData.active_goals.length}
							{m.goals()}
						</span>
					</div>

					{#if goalsData.active_goals.length === 0}
						<div
							class="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
						>
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
							>
								<Activity class="h-8 w-8" />
							</div>
							<p class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
								{m.no_active_goals()}
							</p>
							<p class="text-sm text-zinc-500 dark:text-zinc-400">
								{m.add_goals_to_track()}
							</p>
						</div>
					{:else}
						<div class="grid gap-4 sm:grid-cols-2">
							{#each goalsData.active_goals as goal (goal.id)}
								<article
									class="group relative flex flex-col justify-between rounded-3xl border border-zinc-100 bg-white p-6 shadow-xs transition-all duration-300 hover:border-teal-500/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-teal-400/30"
								>
									<div class="space-y-4">
										<div class="flex items-start justify-between">
											<span class="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
												{goal.topic_name}
											</span>
											<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
													class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-white"
												>
													<Pencil class="h-3.5 w-3.5" />
												</button>
											</div>
										</div>
										<h3 class="text-lg leading-tight font-bold text-zinc-900 dark:text-white">
											{goal.title}
										</h3>

										<div class="flex flex-wrap items-center gap-2">
											<span
												class="inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {priorityBadge[
													goal.priority
												] || priorityBadge.medium}"
											>
												{goal.priority}
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

										<div class="mt-6 border-t border-zinc-50 pt-4 dark:border-zinc-800/50">
											<Button
												variant="ghost"
												onclick={() => openProgressModal(goal.id, goal.title)}
												class="h-9 w-full justify-between px-3 text-[11px] font-bold text-zinc-500 hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400"
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
					currentPage={goalsData.historyPagination.page}
					pageSize={goalsData.historyPagination.pageSize}
					totalCount={goalsData.historyPagination.count}
					onPageChange={updateHistoryPage}
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
				{#if goalsData.historyLoadError}
					<div
						class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
					>
						<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
						<p class="text-xs font-medium">{goalsData.historyLoadError}</p>
					</div>
				{/if}
			</div>

			<!-- Right Column: Status & Actions -->
			<div class="space-y-6 lg:col-span-4">
				<div class="sticky top-24 space-y-6">
					<!-- Next Evaluation Card -->
					<div
						class="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
					>
						<div
							class="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-teal-500/5 blur-2xl"
						></div>
						<div class="relative space-y-4">
							<div class="flex items-center justify-between">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"
								>
									<CalendarClock class="h-5 w-5" />
								</div>
								<span class="text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
									>{m.evaluation_period()}</span
								>
							</div>
							<div>
								<h3 class="text-sm font-bold text-zinc-500 dark:text-zinc-400">
									{m.next_review_in()}
								</h3>
								<div class="mt-1 flex items-baseline gap-1">
									<span class="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
										{goalsData.days_left ?? 'N/A'}
									</span>
									<span class="text-lg font-medium text-zinc-500 dark:text-zinc-400"
										>{m.days()}</span
									>
								</div>
								<p class="mt-2 text-xs font-medium text-zinc-400">
									{m.due_on({ date: formatDate(goalsData.next_evaluation_date) })}
								</p>
							</div>
						</div>
					</div>

					<!-- Draft / Action Card -->
					{#if goalsData.my_draft_evaluation_id}
						<div
							class="rounded-3xl border border-amber-100 bg-amber-50/50 p-6 shadow-sm dark:border-amber-900/30 dark:bg-amber-900/10"
						>
							<div class="space-y-4">
								<div class="flex items-center gap-2">
									<Clock class="h-5 w-5 text-amber-600 dark:text-amber-500" />
									<h3 class="text-lg font-bold text-amber-900 dark:text-amber-400">
										{m.draft_in_progress_title()}
									</h3>
								</div>
								<p class="text-sm font-medium text-amber-700 dark:text-amber-300">
									{m.draft_in_progress_description()}
								</p>
								<Button
									class="h-12 w-full gap-2 rounded-xl bg-amber-600 font-bold text-white shadow-lg shadow-amber-500/10 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
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
					{:else}
						<div
							class="rounded-3xl border border-teal-100 bg-teal-50/30 p-6 shadow-sm dark:border-teal-900/30 dark:bg-teal-900/5"
						>
							<div class="space-y-4">
								<div class="flex items-center gap-2 text-teal-700 dark:text-teal-400">
									<CheckCircle2 class="h-5 w-5" />
									<h3 class="text-lg font-bold">{m.ready_for_review()}</h3>
								</div>
								<p class="text-sm font-medium text-teal-600 dark:text-teal-400/80">
									{m.start_evaluation_description()}
								</p>
								<Button
									disabled={!goalsData.is_responsible_employee}
									class="h-12 w-full gap-2 rounded-xl bg-teal-600 font-bold text-white shadow-lg shadow-teal-500/10 hover:opacity-90 dark:bg-teal-500 dark:text-black"
									onclick={() => {
										const clientId = page.params.id;
										if (!clientId) return;
										openCreateEvaluationForm(clientId);
									}}
								>
									<Plus class="h-4 w-4" />
									{m.start_evaluation()}
								</Button>
								{#if !goalsData.is_responsible_employee}
									<p class="text-xs font-medium text-teal-700/80 dark:text-teal-400/80">
										{m.only_coordinator_can_start()}
									</p>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Last Evaluation Summary -->
					<div
						class="rounded-3xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
					>
						<h3 class="text-xs font-bold tracking-widest text-zinc-400 uppercase">
							{m.last_completed()}
						</h3>
						<div class="mt-4 space-y-3">
							{#if lastCompleted}
								<div class="flex items-center gap-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
									>
										<CheckCircle2 class="h-4 w-4" />
									</div>
									<div class="flex flex-col">
										<span class="text-sm font-bold text-zinc-900 dark:text-white">
											{formatDate(lastCompleted.evaluation_date)}
										</span>
										<span class="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
											{lastCompleted.creator_name}
										</span>
									</div>
								</div>
								<button
									class="group flex w-full items-center justify-between rounded-xl border border-zinc-100 p-3 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
								>
									{m.view_full_report()}
									<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
								</button>
							{:else}
								<p class="text-sm font-medium text-zinc-400 italic">
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
	onSaved={handleEvaluationSaved}
/>

<CreateGoalModal
	bind:open={createGoalModalOpen}
	clientId={page.params.id ?? ''}
	onSave={async (goal: CreateGoalRequest) => {
		await createClientGoal(page.params.id ?? '', goal);
		await invalidateAll();
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
			await invalidateAll();
		}}
		onCancel={() => (updateGoalModalOpen = false)}
	/>
{/if}
