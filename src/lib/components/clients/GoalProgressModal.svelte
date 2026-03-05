<script lang="ts">
	import { listGoalEvaluationHistory } from '$lib/api/evaluations';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { GoalEvaluationHistoryEntry } from '$lib/types/api';
	import {
		CalendarClock,
		CheckCircle2,
		CircleDot,
		TrendingDown,
		TrendingUp,
		Minus,
		AlertCircle,
		FileText,
		User,
		Loader2
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	let {
		open = $bindable(false),
		clientId,
		goalId = null,
		goalTitle = m.loading_goal()
	} = $props<{
		open: boolean;
		clientId: string;
		goalId?: string | null;
		goalTitle?: string;
	}>();

	const DEFAULT_PAGE_SIZE = 20;
	let historyItems = $state<GoalEvaluationHistoryEntry[]>([]);
	let currentPage = $state(0);
	let totalCount = $state(0);
	let nextPage = $state<number | null>(null);
	let loading = $state(false);
	let loadError = $state<string | null>(null);

	let timelineScroller = $state<HTMLDivElement | null>(null);
	let timelineSentinel = $state<HTMLDivElement | null>(null);
	let lastLoadKey = '';
	let observer: IntersectionObserver | null = null;

	const progressConfig: Record<
		string,
		{ label: string; bg: string; text: string; border: string; icon: any }
	> = {
		no_progress: {
			label: m.progress_no_progress(),
			bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
			text: 'text-zinc-700 dark:text-zinc-300',
			border: 'border-zinc-500/20 dark:border-zinc-500/30',
			icon: Minus
		},
		regression: {
			label: m.progress_regression(),
			bg: 'bg-rose-500/10 dark:bg-rose-500/20',
			text: 'text-rose-700 dark:text-rose-400',
			border: 'border-rose-500/20 dark:border-rose-500/30',
			icon: TrendingDown
		},
		limited_progress: {
			label: m.progress_limited(),
			bg: 'bg-amber-500/10 dark:bg-amber-500/20',
			text: 'text-amber-700 dark:text-amber-400',
			border: 'border-amber-500/20 dark:border-amber-500/30',
			icon: CircleDot
		},
		good_progress: {
			label: m.progress_good(),
			bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
			text: 'text-emerald-700 dark:text-emerald-400',
			border: 'border-emerald-500/20 dark:border-emerald-500/30',
			icon: TrendingUp
		},
		achieved: {
			label: m.progress_achieved(),
			bg: 'bg-teal-500/10 dark:bg-teal-500/20',
			text: 'text-teal-700 dark:text-teal-400',
			border: 'border-teal-500/20 dark:border-teal-500/30',
			icon: CheckCircle2
		},
		blocked: {
			label: m.progress_blocked(),
			bg: 'bg-rose-500/10 dark:bg-rose-500/20',
			text: 'text-rose-700 dark:text-rose-400',
			border: 'border-rose-500/20 dark:border-rose-500/30',
			icon: AlertCircle
		}
	};

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const formatDate = (value: string | null) => {
		if (!value) return m.not_available_short();
		return new Intl.DateTimeFormat(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(value));
	};

	const isInitialLoading = $derived(loading && historyItems.length === 0);
	const canLoadMore = $derived(nextPage !== null && !loading);

	const parseNextPage = (nextUrl: string | null): number | null => {
		if (!nextUrl) return null;
		try {
			return Number(new URL(nextUrl, window.location.origin).searchParams.get('page')) || null;
		} catch {
			return null;
		}
	};

	const loadPage = async (page: number) => {
		if (!goalId || loading) return;

		loading = true;
		loadError = null;

		try {
			const response = await listGoalEvaluationHistory(clientId, goalId, {
				page,
				pageSize: DEFAULT_PAGE_SIZE
			});
			const results = response.data.results ?? [];

			historyItems = page === 1 ? results : [...historyItems, ...results];
			totalCount = response.data.count;
			currentPage = page;
			nextPage = parseNextPage(response.data.next);
		} catch (error) {
			loadError = error instanceof Error ? error.message : m.failed_load_goal_progress_history();
		} finally {
			loading = false;
		}
	};

	const loadNextPage = async () => {
		if (!canLoadMore || nextPage === null) return;
		await loadPage(nextPage);
	};

	const bindTimelineScroller = (node: HTMLDivElement) => {
		timelineScroller = node;
		return {
			destroy() {
				if (timelineScroller === node) timelineScroller = null;
			}
		};
	};

	const bindTimelineSentinel = (node: HTMLDivElement) => {
		timelineSentinel = node;
		return {
			destroy() {
				if (timelineSentinel === node) timelineSentinel = null;
			}
		};
	};

	$effect(() => {
		const nextKey = open && goalId ? String(goalId) : '';
		if (!nextKey || nextKey === lastLoadKey) return;

		historyItems = [];
		totalCount = 0;
		currentPage = 0;
		nextPage = 1;
		loadError = null;
		lastLoadKey = nextKey;
		void loadPage(1);
	});

	$effect(() => {
		if (!open || !timelineScroller || !timelineSentinel) return;

		observer?.disconnect();
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						void loadNextPage();
					}
				}
			},
			{
				root: timelineScroller,
				rootMargin: '160px 0px'
			}
		);

		observer.observe(timelineSentinel);
		return () => observer?.disconnect();
	});
</script>

<Modal
	bind:open
	size="lg"
	title={m.goal_progress_history_title()}
	description={m.goal_progress_history_description()}
>
	<div class="space-y-6">
		<div class="mb-8 border-b border-zinc-100 pb-4 dark:border-zinc-800">
			<h3 class="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{m.goal()}</h3>
			<p class="mt-1 text-lg font-bold text-zinc-900 dark:text-white">{goalTitle}</p>
		</div>

		<div use:bindTimelineScroller class="max-h-[62vh] overflow-y-auto pr-1">
			<div class="relative pl-4 sm:pl-6">
				<div
					class="absolute top-4 bottom-4 left-4 w-px bg-zinc-200 sm:left-6 dark:bg-zinc-800"
				></div>

				<div class="space-y-8">
					{#if isInitialLoading}
						{#each Array.from({ length: 3 }) as _, index (`goal-history-skeleton-${index}`)}
							<div class="relative flex items-start gap-4 sm:gap-6">
								<div class="relative z-10 mt-1.5 -ml-[11px] sm:-ml-[15px]">
									<div
										class="h-10 w-10 animate-pulse rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
									></div>
								</div>
								<div
									class="h-28 flex-1 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/60"
								></div>
							</div>
						{/each}
					{:else if historyItems.length === 0}
						<div
							class="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"
						>
							{m.no_completed_goal_evaluations()}
						</div>
					{:else}
						{#each historyItems as record (record.evaluation_id)}
							{@const config = progressConfig[record.progress] || progressConfig.no_progress}
							{@const Icon = config.icon}

							<div class="relative flex items-start gap-4 sm:gap-6">
								<div
									class="relative z-10 mt-1.5 -ml-[11px] flex shrink-0 items-center justify-center sm:-ml-[15px]"
								>
									<div class="rounded-full bg-white p-1 dark:bg-zinc-900">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full border-2 {config.bg} {config.border} {config.text}"
										>
											<Icon class="h-4 w-4" />
										</div>
									</div>
								</div>

								<div
									class="flex-1 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/50"
								>
									<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div class="space-y-1">
											<div class="flex items-center gap-2">
												<span
													class="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold {config.bg} {config.text} {config.border}"
												>
													{config.label}
												</span>
												<span class="text-sm font-medium text-zinc-500 dark:text-zinc-400">
													{formatDate(record.evaluation_date)}
												</span>
											</div>
											<div class="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
												<CalendarClock class="h-3.5 w-3.5" />
												<span>
													{m.period_range({
														start: formatDate(record.period_start),
														end: formatDate(record.period_end)
													})}
												</span>
											</div>
										</div>

										<div
											class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"
										>
											<User class="h-3.5 w-3.5" />
											<span>{record.creator_name || m.not_available_short()}</span>
										</div>
									</div>

									{#if record.notes}
										<div
											class="mt-4 rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800/80 dark:bg-zinc-900"
										>
											<div class="flex gap-3">
												<FileText
													class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
												/>
												<p class="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
													{record.notes}
												</p>
											</div>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<div use:bindTimelineSentinel class="h-6"></div>

				{#if loading && historyItems.length > 0}
					<div class="mt-2 flex items-center justify-center gap-2 text-xs text-zinc-500">
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						{m.loading_more_entries()}
					</div>
				{:else if !canLoadMore && historyItems.length > 0}
					<div class="mt-2 text-center text-xs text-zinc-400">
						{m.showing_of_entries({ shown: historyItems.length, total: totalCount })}
					</div>
				{/if}
			</div>
		</div>

		{#if loadError}
			<div
				class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
			>
				{loadError}
			</div>
		{/if}
	</div>
</Modal>
