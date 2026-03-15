<script lang="ts">
	import {
		User,
		Building2,
		RefreshCw,
		Ban,
		CircleCheck,
		Clock,
		CircleAlert,
		CalendarClock,
		Play,
		Check,
		Plus,
		BookOpen,
		ListChecks,
		Activity
	} from 'lucide-svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { formatDate, formatDateTime, formatRelativeTime } from '$lib/utils/date';
	import { handbookStatusConfig } from '$lib/config/handbook-status';
	import type {
		EmployeeHandbookAssignment,
		EmployeeHandbookAssignmentDetail,
		HandbookAssignmentHistoryEntry,
		HandbookHistoryEvent,
		HandbookStatus,
		HandbookStepProgressStatus
	} from '../+page';

	type DetailTab = 'steps' | 'timeline';

	type Props = {
		open?: boolean;
		selectedAssignment: EmployeeHandbookAssignment | null;
		assignmentDetail: EmployeeHandbookAssignmentDetail | null;
		assignmentHistory: HandbookAssignmentHistoryEntry[];
		assignmentDetailLoadError: string | null;
		assignmentHistoryLoadError: string | null;
		waiveErrorMessage: string | null;
		isLoadingAssignmentDetail: boolean;
		isLoadingAssignmentHistory: boolean;
		isWaiving: boolean;
		activeDetailTab: DetailTab;
		onTabChange: (tab: DetailTab) => void;
		onReassign: () => void;
		onWaiveRequest: () => void;
	};

	let {
		open = $bindable(false),
		selectedAssignment,
		assignmentDetail,
		assignmentHistory,
		assignmentDetailLoadError,
		assignmentHistoryLoadError,
		waiveErrorMessage,
		isLoadingAssignmentDetail,
		isLoadingAssignmentHistory,
		isWaiving,
		activeDetailTab,
		onTabChange,
		onReassign,
		onWaiveRequest
	}: Props = $props();

	const detailTabs: Array<{ id: DetailTab; label: string; icon: typeof ListChecks }> = [
		{ id: 'steps', label: 'Steps', icon: ListChecks },
		{ id: 'timeline', label: 'Timeline', icon: Activity }
	];


	const stepStatusConfig: Record<
		HandbookStepProgressStatus,
		{ label: string; circleClass: string; labelClass: string }
	> = {
		completed: {
			label: 'Completed',
			circleClass: 'border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/30 shadow-sm',
			labelClass: 'text-emerald-600 dark:text-emerald-400'
		},
		in_progress: {
			label: 'In Progress',
			circleClass: 'border-blue-500 bg-blue-500/10 text-blue-500',
			labelClass: 'text-blue-600 dark:text-blue-400'
		},
		pending: {
			label: 'Pending',
			circleClass: 'border-border bg-surface-alt/60 text-text-subtle',
			labelClass: 'text-text-muted'
		}
	};

	const historyEventMeta: Record<
		HandbookHistoryEvent,
		{ label: string; icon: typeof Plus; dotClass: string; iconClass: string; bgClass: string }
	> = {
		assigned: {
			label: 'Handbook assigned',
			icon: Plus,
			dotClass: 'border-blue-500/30 bg-blue-500/10',
			iconClass: 'text-blue-600 dark:text-blue-300',
			bgClass: 'bg-blue-500/5 border-blue-500/10'
		},
		reassigned: {
			label: 'Handbook reassigned',
			icon: RefreshCw,
			dotClass: 'border-amber-500/30 bg-amber-500/10',
			iconClass: 'text-amber-600 dark:text-amber-300',
			bgClass: 'bg-amber-500/5 border-amber-500/10'
		},
		waived: {
			label: 'Handbook waived',
			icon: Ban,
			dotClass: 'border-orange-500/30 bg-orange-500/10',
			iconClass: 'text-orange-600 dark:text-orange-300',
			bgClass: 'bg-orange-500/5 border-orange-500/10'
		},
		started: {
			label: 'Handbook started',
			icon: Play,
			dotClass: 'border-emerald-500/30 bg-emerald-500/10',
			iconClass: 'text-emerald-600 dark:text-emerald-300',
			bgClass: 'bg-emerald-500/5 border-emerald-500/10'
		},
		completed: {
			label: 'Handbook completed',
			icon: Check,
			dotClass: 'border-emerald-500/40 bg-emerald-500/15',
			iconClass: 'text-emerald-700 dark:text-emerald-200',
			bgClass: 'bg-emerald-500/5 border-emerald-500/15'
		}
	};

	const getHistoryActorLabel = (entry: HandbookAssignmentHistoryEntry) =>
		entry.actor_employee_id ? `Employee ${entry.actor_employee_id.slice(0, 8)}` : 'System';

	const formatHistoryMetadata = (metadata: HandbookAssignmentHistoryEntry['metadata']) => {
		if (!metadata) return [] as string[];
		if (typeof metadata === 'string') return [metadata];
		return Object.entries(metadata).map(([key, value]) => {
			const label = key.replace(/_/g, ' ');
			return `${label}: ${typeof value === 'string' ? value : JSON.stringify(value)}`;
		});
	};


	const detailRequiredStepTotals = (detail: EmployeeHandbookAssignmentDetail | null) => {
		if (!detail) return { total: 0, completed: 0 };
		const requiredSteps = detail.steps.filter((step) => step.is_required);
		const completedRequiredSteps = requiredSteps.filter((step) => step.status === 'completed').length;
		return {
			total: requiredSteps.length,
			completed: completedRequiredSteps
		};
	};

	const detailProgressPercent = (detail: EmployeeHandbookAssignmentDetail | null) => {
		const totals = detailRequiredStepTotals(detail);
		if (totals.total === 0) return 0;
		return Math.round((totals.completed / totals.total) * 100);
	};

	const summaryProgressPercent = (assignment: EmployeeHandbookAssignment) => {
		if (assignment.total_steps <= 0) return 0;
		return Math.round((assignment.completed_steps / assignment.total_steps) * 100);
	};

	// SVG circle ring helpers
	const RING_R = 30;
	const RING_CIRC = 2 * Math.PI * RING_R;
	const ringDash = (pct: number) => (pct / 100) * RING_CIRC;

</script>

<Sheet bind:open size="lg">
	{#snippet header()}
		<div class="flex items-center gap-3">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
				<BookOpen class="h-4.5 w-4.5" />
			</div>
			<div>
				<h2 class="text-base font-bold text-text">Assignment Detail</h2>
				<p class="text-xs font-medium text-text-muted">Handbook progress & lifecycle</p>
			</div>
		</div>
	{/snippet}

	{#if selectedAssignment}
		{@const detail = assignmentDetail}
		{@const status = detail?.status ?? selectedAssignment.status}
		{@const cfg = handbookStatusConfig[status]}
		{@const progressPct = detail
			? detailProgressPercent(detail)
			: summaryProgressPercent(selectedAssignment)}
		{@const requiredStepTotals = detailRequiredStepTotals(detail)}
		{@const totalSteps = detail ? requiredStepTotals.total : selectedAssignment.total_steps}
		{@const doneSteps = detail ? requiredStepTotals.completed : selectedAssignment.completed_steps}
		{@const canWaive = status === 'not_started' || status === 'in_progress'}

		<div class="flex flex-col gap-0">
			{#if waiveErrorMessage}
				<div class="mb-4">
					<InlineErrorBanner message={waiveErrorMessage} />
				</div>
			{/if}

			<!-- ══════════════════════════════════════════
					 HERO HEADER
			══════════════════════════════════════════ -->
			<div class="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
				<!-- Gradient accent band -->
				<div
					class="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
					style="background: linear-gradient(90deg, var(--color-brand) 0%, oklch(from var(--color-brand) l c calc(h + 30)) 100%); opacity: 0.7"
				></div>

				<div class="flex items-start gap-5 p-5 pt-6">
					<!-- Avatar -->
					<div
						class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand shadow-sm"
					>
						<User class="h-7 w-7" />
					</div>

					<!-- Name + meta -->
					<div class="min-w-0 flex-1 space-y-2">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="space-y-1.5">
								<h3 class="text-lg leading-tight font-bold text-text">
									{detail?.employee_name ?? selectedAssignment.employee_name}
								</h3>
								<div class="flex flex-wrap items-center gap-2">
									<span
										class="bg-surface-alt/60 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text-muted"
									>
										<Building2 class="h-3 w-3" />
										{detail?.department_name ?? selectedAssignment.department_name}
									</span>
									<span
										class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold {cfg.badgeClass}"
									>
										<span class="h-1.5 w-1.5 rounded-full {cfg.dotClass}"></span>
										{cfg.label}
									</span>
								</div>
							</div>

							<!-- Progress ring -->
							{#if status !== 'unassigned' && status !== 'waived'}
								<div class="flex flex-col items-center gap-1">
									<svg width="72" height="72" viewBox="0 0 72 72" class="-rotate-90">
										<!-- Track -->
										<circle
											cx="36"
											cy="36"
											r={RING_R}
											fill="none"
											stroke="currentColor"
											stroke-width="5"
											class="text-border/60"
										/>
										<!-- Fill -->
										<circle
											cx="36"
											cy="36"
											r={RING_R}
											fill="none"
											stroke-width="5"
											stroke-linecap="round"
											stroke-dasharray="{ringDash(progressPct)} {RING_CIRC}"
											class={progressPct >= 100
												? 'text-emerald-500'
												: progressPct > 0
													? 'text-blue-500'
													: 'text-zinc-300 dark:text-zinc-600'}
											stroke="currentColor"
										/>
									</svg>
									<span class="text-xs font-bold text-text-muted">{progressPct}%</span>
								</div>
							{/if}
						</div>

						<!-- Action buttons -->
						<div class="flex flex-wrap gap-2 pt-1">
							<Button variant="secondary" class="h-8 gap-1.5 px-3 text-xs" onclick={onReassign}>
								<RefreshCw class="h-3.5 w-3.5" />
								Reassign
							</Button>
							{#if canWaive}
								<Button
									variant="ghost"
									class="h-8 gap-1.5 px-3 text-xs text-orange-600 hover:bg-orange-500/10 hover:text-orange-600"
									onclick={onWaiveRequest}
									isLoading={isWaiving}
									disabled={isWaiving}
								>
									<Ban class="h-3.5 w-3.5" />
									Waive handbook
								</Button>
							{/if}
						</div>
					</div>
				</div>

				<!-- ── Metadata strip ─────────────────────── -->
				<div class="grid grid-cols-4 divide-x divide-border/50 border-t border-border/60">
					{#each [
						{
							label: 'Template',
							value:
								(detail?.template_title ?? selectedAssignment.template_title) ||
								'No template',
							sub: `v${detail?.template_version ?? selectedAssignment.template_version ?? '—'}`
						},
						{
							label: 'Assigned',
							value: formatDate(detail?.assigned_at ?? selectedAssignment.assigned_at),
							sub: null
						},
						{
							label: 'Started',
							value: formatDate(detail?.started_at ?? selectedAssignment.started_at),
							sub: null
						},
						{
							label: 'Completed',
							value: formatDate(
								detail?.completed_at ?? selectedAssignment.completed_at
							),
							sub: null
						}
					] as meta (meta.label)}
						<div class="flex flex-col gap-0.5 px-4 py-3">
							<span class="text-[10px] font-bold tracking-widest text-text-muted uppercase">
								{meta.label}
							</span>
							<span class="truncate text-sm font-semibold text-text">{meta.value}</span>
							{#if meta.sub}
								<span class="text-[11px] font-medium text-text-muted">{meta.sub}</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- ══════════════════════════════════════════
				 PROGRESS BAR (only when relevant)
			══════════════════════════════════════════ -->
			{#if status !== 'unassigned' && status !== 'waived' && totalSteps > 0}
				<div class="mt-4 rounded-xl border border-border bg-surface px-4 py-3">
					<div class="mb-2 flex items-center justify-between gap-2">
						<span class="text-xs font-semibold text-text"
							>{doneSteps} of {totalSteps} steps completed</span
						>
						<span class="text-[11px] font-bold text-text-muted">{progressPct}%</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-border/40">
						<div
							class="h-full rounded-full transition-all duration-700 ease-out {progressPct >= 100
								? 'bg-emerald-500'
								: 'bg-blue-500'}"
							style="width: {progressPct}%"
						></div>
					</div>
				</div>
			{/if}

			<!-- ══════════════════════════════════════════
				 TABS
			══════════════════════════════════════════ -->
			<div class="mt-5">
				<!-- Tab bar -->
				<div class="bg-surface-alt/40 flex gap-1 rounded-xl border border-border p-1">
					{#each detailTabs as tab (tab.id)}
						{@const TabIcon = tab.icon}
						<button
							type="button"
							onclick={() => onTabChange(tab.id)}
							class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 {activeDetailTab ===
							tab.id
								? 'bg-surface text-text shadow-sm'
								: 'text-text-muted hover:text-text'}"
						>
							<TabIcon class="h-4 w-4" />
							{tab.label}
						</button>
					{/each}
				</div>

				<!-- Tab content -->
				<div class="mt-4">
					<!-- ─── Error banners ─── -->
					{#if assignmentDetailLoadError && activeDetailTab === 'steps'}
						<InlineErrorBanner message={assignmentDetailLoadError} />
					{:else if assignmentHistoryLoadError && activeDetailTab === 'timeline'}
						<InlineErrorBanner message={assignmentHistoryLoadError} />
					{/if}

					<!-- ════════════════════════════════════
						 STEPS TAB
					════════════════════════════════════ -->
					{#if activeDetailTab === 'steps'}
						<div class="space-y-1.5">
							{#if isLoadingAssignmentDetail}
								<!-- Skeleton -->
								{#each Array.from( { length: Math.max(3, selectedAssignment.total_steps || 3) } ) as _, i (`skel-step-${i}`)}
									<div
										class="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
										aria-busy="true"
									>
										<div class="mt-0.5 h-6 w-6 animate-pulse rounded-full bg-border/60"></div>
										<div class="flex-1 space-y-2">
											<div class="h-4 w-2/3 animate-pulse rounded-md bg-border/60"></div>
											<div class="h-3 w-1/3 animate-pulse rounded-md bg-border/50"></div>
										</div>
									</div>
								{/each}
							{:else if detail?.steps.length}
								{#each detail.steps as step, i (step.step_id)}
									{@const sCfg = stepStatusConfig[step.status] ?? stepStatusConfig['pending']}
									<div class="relative flex items-stretch gap-0">
										<!-- Vertical connector column -->
										<div class="flex w-10 shrink-0 flex-col items-center">
											<!-- Circle indicator -->
											<div
												class="z-10 mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 {sCfg.circleClass}"
											>
												{#if step.status === 'completed'}
													<Check class="h-3.5 w-3.5" />
												{:else if step.status === 'in_progress'}
													<div class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
												{:else}
													<span class="text-[9px] leading-none font-bold">{i + 1}</span>
												{/if}
											</div>
											<!-- Line below (except last) -->
											{#if i < detail.steps.length - 1}
												<div class="mt-1 flex-1 border-l-2 border-dashed border-border/50"></div>
											{/if}
										</div>

										<!-- Step card -->
										<div
											class="mb-2 min-w-0 flex-1 rounded-xl border {step.status === 'completed'
												? 'border-emerald-500/15 bg-emerald-500/5'
												: step.status === 'in_progress'
													? 'border-blue-500/15 bg-blue-500/5'
													: 'border-border bg-surface'} p-3.5 transition-colors"
										>
											<div class="flex flex-wrap items-start justify-between gap-2">
												<p
													class="text-sm font-semibold {step.status === 'completed'
														? 'text-text-muted line-through'
														: 'text-text'}"
												>
													{step.title}
												</p>
												<span
													class="text-[10px] font-bold tracking-wider uppercase {sCfg.labelClass}"
												>
													{sCfg.label}
												</span>
											</div>

											{#if step.body}
												<p class="mt-1.5 text-xs leading-relaxed text-text-muted">{step.body}</p>
											{/if}

											<div class="mt-2.5 flex flex-wrap items-center gap-1.5">
												<span
													class="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-text-muted"
												>
													{step.is_required ? 'Required' : 'Optional'}
												</span>
												{#if step.started_at}
													<span
														class="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-text-muted"
													>
														<Clock class="h-3 w-3" />
														Started {formatDate(step.started_at)}
													</span>
												{/if}
												{#if step.completed_at}
													<span
														class="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
													>
														<CircleCheck class="h-3 w-3" />
														Done {formatDate(step.completed_at)}
													</span>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							{:else if !assignmentDetailLoadError}
								<div
									class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center"
								>
									<CircleAlert class="h-8 w-8 text-text-subtle" />
									<p class="text-sm font-semibold text-text-muted">No step data yet</p>
									<p class="text-xs text-text-subtle">
										Step progress will appear once the employee has started the handbook.
									</p>
								</div>
							{/if}
						</div>

						<!-- ════════════════════════════════════
						 TIMELINE TAB
					════════════════════════════════════ -->
					{:else}
						<div class="space-y-1">
							<!-- Header -->
							<div class="mb-4 flex items-center justify-between">
								<div>
									<h4 class="text-sm font-bold text-text">Lifecycle Timeline</h4>
									<p class="text-xs text-text-muted">Newest activity shown first.</p>
								</div>
								<span
									class="bg-surface-alt/60 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-text-muted"
								>
									<CalendarClock class="h-3.5 w-3.5" />
									{assignmentHistory.length} events
								</span>
							</div>

							{#if isLoadingAssignmentHistory}
								<!-- Skeleton -->
								<div class="space-y-3">
									{#each Array.from({ length: 4 }) as _, i (`skel-tl-${i}`)}
										<div class="flex items-start gap-3">
											<div
												class="mt-1 h-7 w-7 shrink-0 animate-pulse rounded-full bg-border/60"
											></div>
											<div
												class="flex-1 space-y-2 rounded-xl border border-border bg-surface p-3.5"
											>
												<div class="h-4 w-48 animate-pulse rounded-md bg-border/60"></div>
												<div class="h-3 w-28 animate-pulse rounded-md bg-border/50"></div>
											</div>
										</div>
									{/each}
								</div>
							{:else if assignmentHistory.length > 0}
								<div class="space-y-0">
									{#each assignmentHistory as entry, idx (entry.id)}
										{@const meta = historyEventMeta[entry.event]}
										{@const EventIcon = meta.icon}
										{@const metaItems = formatHistoryMetadata(entry.metadata)}

										<div class="relative flex items-stretch gap-3">
											<!-- Icon + line column -->
											<div class="flex w-7 shrink-0 flex-col items-center">
												<div
													class="z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border {meta.dotClass}"
												>
													<EventIcon class="h-3.5 w-3.5 {meta.iconClass}" />
												</div>
												{#if idx < assignmentHistory.length - 1}
													<div
														class="mt-1 flex-1 border-l border-dashed border-border/50 pb-2"
													></div>
												{/if}
											</div>

											<!-- Event card -->
											<div class="mb-3 flex-1 rounded-xl border {meta.bgClass} p-3.5">
												<div class="flex flex-wrap items-start justify-between gap-2">
													<div>
														<p class="text-sm font-semibold text-text">{meta.label}</p>
														<p class="mt-0.5 text-xs font-medium text-text-muted">
															By {getHistoryActorLabel(entry)}
														</p>
													</div>
													<div class="text-right">
														<p class="text-[11px] font-semibold text-text-muted">
															{formatRelativeTime(entry.created_at)}
														</p>
														<p class="text-[10px] font-medium text-text-subtle">
															{formatDateTime(entry.created_at)}
														</p>
													</div>
												</div>

												<!-- Tags row -->
												<div class="mt-2.5 flex flex-wrap gap-1.5">
													<span
														class="inline-flex items-center rounded-md border border-border/60 px-2 py-0.5 text-[10px] font-medium text-text-muted"
													>
														v{entry.template_version}
													</span>
													{#if entry.employee_handbook_id}
														<span
															class="inline-flex items-center rounded-md border border-border/60 px-2 py-0.5 text-[10px] font-medium text-text-muted"
														>
															Assignment linked
														</span>
													{/if}
												</div>

												<!-- Extra metadata -->
												{#if metaItems.length > 0}
													<div
														class="mt-2.5 rounded-lg border border-border/40 bg-surface/50 px-3 py-2"
													>
														{#each metaItems as item (item)}
															<p class="text-[11px] font-medium text-text-muted">{item}</p>
														{/each}
													</div>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{:else if !assignmentHistoryLoadError}
								<div
									class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center"
								>
									<CalendarClock class="h-8 w-8 text-text-subtle" />
									<p class="text-sm font-semibold text-text-muted">No events yet</p>
									<p class="text-xs text-text-subtle">
										Lifecycle events will be recorded as the handbook progresses.
									</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- Empty / closed state -->
		<div class="flex flex-col items-center justify-center gap-3 py-20 text-center">
			<div class="bg-surface-alt/70 flex h-14 w-14 items-center justify-center rounded-2xl">
				<BookOpen class="h-7 w-7 text-text-subtle" />
			</div>
			<p class="text-sm font-semibold text-text-muted">No assignment selected</p>
		</div>
	{/if}
</Sheet>
