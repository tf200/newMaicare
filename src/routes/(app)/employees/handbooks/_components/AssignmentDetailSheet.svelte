<script lang="ts">
	import {
		User,
		Building2,
		RefreshCw,
		Ban,
		MoreHorizontal,
		CircleCheck,
		Clock,
		CircleAlert,
		CalendarClock,
		Play,
		Check,
		Plus,
		BookOpen,
		ListChecks,
		Activity,
		ChevronDown,
		Hash,
		Sparkles
	} from 'lucide-svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dropdown from '$lib/components/ui/Dropdown.svelte';
	import DropdownItem from '$lib/components/ui/DropdownItem.svelte';
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

	const detailTabs: Array<{ id: DetailTab; label: string; icon: typeof ListChecks; accentClass: string }> = [
		{ id: 'steps', label: 'Steps', icon: ListChecks, accentClass: 'text-info' },
		{ id: 'timeline', label: 'Timeline', icon: Activity, accentClass: 'text-secondary' }
	];
	const detailTabOrder: DetailTab[] = ['steps', 'timeline'];
	const moreMetaSectionId = 'assignment-detail-more-meta';

	let expandedMetaAssignmentId = $state<string | null>(null);

	const stepStatusConfig: Record<
		HandbookStepProgressStatus,
		{ label: string; circleClass: string; labelClass: string; cardBorder: string; cardBg: string }
	> = {
		completed: {
			label: 'Completed',
			circleClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
			labelClass: 'text-emerald-700/80 dark:text-emerald-300/85',
			cardBorder: 'border-emerald-500/15',
			cardBg: 'bg-emerald-500/[0.03]'
		},
		in_progress: {
			label: 'In Progress',
			circleClass: 'border-info/40 bg-info/10 text-info',
			labelClass: 'text-info/80',
			cardBorder: 'border-info/15',
			cardBg: 'bg-info/[0.03]'
		},
		pending: {
			label: 'Pending',
			circleClass: 'border-border/80 bg-surface text-text-subtle',
			labelClass: 'text-text-muted',
			cardBorder: 'border-border/60',
			cardBg: 'bg-surface'
		}
	};

	const historyEventMeta: Record<
		HandbookHistoryEvent,
		{ label: string; icon: typeof Plus; dotClass: string; iconClass: string; bgClass: string }
	> = {
		assigned: {
			label: 'Handbook assigned',
			icon: Plus,
			dotClass: 'border-info/25 bg-info/8',
			iconClass: 'text-info/80',
			bgClass: 'bg-info/[0.03] border-info/12'
		},
		reassigned: {
			label: 'Handbook reassigned',
			icon: RefreshCw,
			dotClass: 'border-secondary/25 bg-secondary/8',
			iconClass: 'text-secondary/80',
			bgClass: 'bg-secondary/[0.03] border-secondary/12'
		},
		waived: {
			label: 'Handbook waived',
			icon: Ban,
			dotClass: 'border-warning/25 bg-warning/8',
			iconClass: 'text-warning/80',
			bgClass: 'bg-warning/[0.03] border-warning/12'
		},
		started: {
			label: 'Handbook started',
			icon: Play,
			dotClass: 'border-brand/25 bg-brand/8',
			iconClass: 'text-brand/80',
			bgClass: 'bg-brand/[0.03] border-brand/12'
		},
		completed: {
			label: 'Handbook completed',
			icon: Check,
			dotClass: 'border-success/25 bg-success/8',
			iconClass: 'text-success/80',
			bgClass: 'bg-success/[0.03] border-success/12'
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

	const primaryActionForStatus = (status: HandbookStatus) => {
		if (status === 'completed' || status === 'waived' || status === 'unassigned') {
			return { tab: 'timeline' as DetailTab, label: 'Review timeline' };
		}
		return { tab: 'steps' as DetailTab, label: 'Review steps' };
	};

	const tabId = (tab: DetailTab) => `assignment-detail-tab-${tab}`;
	const tabPanelId = (tab: DetailTab) => `assignment-detail-panel-${tab}`;
	const formatEventCountLabel = (count: number) => `${count} ${count === 1 ? 'event' : 'events'}`;
	const toggleMetaDetails = (assignmentId: string) => {
		expandedMetaAssignmentId =
			expandedMetaAssignmentId === assignmentId ? null : assignmentId;
	};

	const focusTab = (tab: DetailTab) => {
		if (typeof document === 'undefined') return;
		document.getElementById(tabId(tab))?.focus();
	};

	const handleTabKeydown = (event: KeyboardEvent, currentTab: DetailTab) => {
		const currentIndex = detailTabOrder.indexOf(currentTab);
		if (currentIndex < 0) return;

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			const nextTab = detailTabOrder[(currentIndex + 1) % detailTabOrder.length];
			onTabChange(nextTab);
			requestAnimationFrame(() => focusTab(nextTab));
			return;
		}

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			const prevTab = detailTabOrder[(currentIndex - 1 + detailTabOrder.length) % detailTabOrder.length];
			onTabChange(prevTab);
			requestAnimationFrame(() => focusTab(prevTab));
			return;
		}

		if (event.key === 'Home') {
			event.preventDefault();
			onTabChange(detailTabOrder[0]);
			requestAnimationFrame(() => focusTab(detailTabOrder[0]));
			return;
		}

		if (event.key === 'End') {
			event.preventDefault();
			const lastTab = detailTabOrder[detailTabOrder.length - 1];
			onTabChange(lastTab);
			requestAnimationFrame(() => focusTab(lastTab));
		}
	};
</script>

<Sheet bind:open size="lg">
	{#snippet header()}
		<div class="flex items-center gap-3">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-info/20 to-brand/20 text-info"
			>
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
		{@const primaryAction = primaryActionForStatus(status)}
		{@const isMetaExpanded = expandedMetaAssignmentId === selectedAssignment.id}

		<div class="flex flex-col gap-5">
			{#if waiveErrorMessage}
				<InlineErrorBanner message={waiveErrorMessage} />
			{/if}

			<!-- ─── Hero Card ─── -->
			<div class="relative overflow-hidden rounded-2xl border border-border/60 bg-surface">
				<!-- Gradient blobs: two-tone for flavor -->
				<div
					aria-hidden="true"
					class="pointer-events-none absolute -top-20 -left-20 h-48 w-48 rounded-full bg-info/8 blur-3xl"
				></div>
				<div
					aria-hidden="true"
					class="pointer-events-none absolute -right-16 -bottom-16 h-44 w-44 rounded-full bg-secondary/6 blur-3xl"
				></div>

				<div class="relative flex items-start gap-4 p-5">
					<!-- Avatar -->
					<div
						class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/15 to-info/15 ring-1 ring-brand/10"
					>
						<User class="h-5 w-5 text-brand" />
					</div>

					<!-- Name, badges, actions -->
					<div class="min-w-0 flex-1">
						<h3 class="text-lg leading-tight font-semibold text-text">
							{detail?.employee_name ?? selectedAssignment.employee_name}
						</h3>

						<div class="mt-2 flex flex-wrap items-center gap-1.5">
							<span
								class="inline-flex items-center gap-1.5 rounded-full border border-info/15 bg-info/8 px-2.5 py-0.5 text-[11px] font-semibold text-info"
							>
								<Building2 class="h-3 w-3" />
								{detail?.department_name ?? selectedAssignment.department_name}
							</span>
							<span
								class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold {cfg.badgeClass}"
							>
								<span class="h-1.5 w-1.5 rounded-full {cfg.dotClass}"></span>
								{cfg.label}
							</span>
						</div>

						<!-- Actions row -->
						<div class="mt-3 flex flex-wrap items-center gap-2">
							<Button
								variant="primary"
								class="h-8 gap-1.5 px-3.5 text-xs"
								onclick={() => onTabChange(primaryAction.tab)}
							>
								{#if primaryAction.tab === 'steps'}
									<ListChecks class="h-3.5 w-3.5" />
								{:else}
									<Activity class="h-3.5 w-3.5" />
								{/if}
								{primaryAction.label}
							</Button>
							<Button variant="ghost" class="h-8 gap-1.5 px-3 text-xs" onclick={onReassign}>
								<RefreshCw class="h-3.5 w-3.5" />
								Reassign
							</Button>
							{#if canWaive}
								<Dropdown align="right" width="w-52">
									{#snippet trigger()}
										<Button variant="ghost" class="h-8 gap-1.5 px-3 text-xs" aria-label="Actions">
											<MoreHorizontal class="h-4 w-4" />
											Actions
										</Button>
									{/snippet}
									{#snippet content()}
										<DropdownItem
											label={isWaiving ? 'Waiving handbook...' : 'Waive handbook'}
											icon={Ban}
											variant="destructive"
											class={isWaiving ? 'pointer-events-none opacity-60' : ''}
											onclick={() => {
												if (!isWaiving) onWaiveRequest();
											}}
										/>
									{/snippet}
								</Dropdown>
							{/if}
						</div>
					</div>
				</div>

				<!-- Metadata strip -->
				<div class="border-t border-border/40 px-5 py-3">
					<div class="grid grid-cols-2 gap-x-4 gap-y-2">
						{#each [
							{
								label: 'Assigned',
								icon: CalendarClock,
								value: formatDate(detail?.assigned_at ?? selectedAssignment.assigned_at),
								color: 'text-brand'
							},
							{
								label: 'Last activity',
								icon: Clock,
								value: formatDate(
									detail?.completed_at ??
										detail?.started_at ??
										selectedAssignment.completed_at ??
										selectedAssignment.started_at ??
										selectedAssignment.assigned_at
								),
								color: 'text-secondary'
							}
						] as meta (meta.label)}
							{@const MetaIcon = meta.icon}
							<div class="flex items-center gap-2 min-w-0">
								<MetaIcon class="h-3.5 w-3.5 shrink-0 {meta.color}" />
								<div class="min-w-0">
									<p class="text-[10px] font-semibold uppercase tracking-wider {meta.color}">
										{meta.label}
									</p>
									<p class="truncate text-sm leading-tight text-text" title={meta.value}>
										{meta.value}
									</p>
								</div>
							</div>
						{/each}
					</div>

					{#if isMetaExpanded}
						<div
							id={moreMetaSectionId}
							class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/30 pt-3"
						>
							{#each [
								{
									label: 'Template',
									icon: BookOpen,
									value:
										(detail?.template_title ?? selectedAssignment.template_title) || 'No template',
									color: 'text-info'
								},
								{
									label: 'Started',
									icon: Play,
									value: detail?.started_at
										? formatDate(detail.started_at)
										: selectedAssignment.started_at
											? formatDate(selectedAssignment.started_at)
											: 'Not started',
									color: 'text-success'
								}
							] as meta (meta.label)}
								{@const MetaIcon = meta.icon}
								<div class="flex items-center gap-2 min-w-0">
									<MetaIcon class="h-3.5 w-3.5 shrink-0 {meta.color}" />
									<div class="min-w-0">
										<p class="text-[10px] font-semibold uppercase tracking-wider {meta.color}">
											{meta.label}
										</p>
										<p class="truncate text-sm leading-tight text-text" title={meta.value}>
											{meta.value}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<div class="mt-2 flex justify-end">
						<button
							type="button"
							class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-text-muted transition-colors hover:text-text hover:bg-border/30"
							aria-expanded={isMetaExpanded}
							aria-controls={moreMetaSectionId}
							onclick={() => {
								toggleMetaDetails(selectedAssignment.id);
							}}
						>
							{isMetaExpanded ? 'Less' : 'More details'}
							<ChevronDown class="h-3 w-3 transition-transform {isMetaExpanded ? 'rotate-180' : ''}" />
						</button>
					</div>
				</div>
			</div>

			<!-- ─── Progress Bar ─── -->
			{#if status !== 'unassigned' && status !== 'waived' && totalSteps > 0}
				<div class="rounded-xl border border-border/60 bg-surface px-4 py-3">
					<div class="mb-2 flex items-end justify-between gap-2">
						<div class="flex items-baseline gap-1.5">
							<span class="text-xl font-bold tabular-nums {progressPct >= 100 ? 'text-success' : 'text-text'}">
								{progressPct}%
							</span>
							<span class="text-xs text-text-muted">complete</span>
						</div>
						<span class="text-[11px] font-medium text-text-muted tabular-nums">
							{doneSteps}/{totalSteps} steps
						</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-border/30">
						<div
							class="h-full rounded-full transition-all duration-700 ease-out motion-reduce:transition-none {progressPct >= 100
								? 'bg-gradient-to-r from-success to-brand'
								: progressPct > 50
									? 'bg-gradient-to-r from-brand to-info'
									: 'bg-gradient-to-r from-info to-info/70'}"
							style="width: {progressPct}%"
						></div>
					</div>
				</div>
			{/if}

			<!-- ─── Tab Bar ─── -->
			<div>
				<div
					class="flex gap-1 rounded-xl border border-border/60 bg-surface p-1"
					role="tablist"
					aria-label="Assignment detail sections"
				>
					{#each detailTabs as tab (tab.id)}
						{@const TabIcon = tab.icon}
						<button
							type="button"
							id={tabId(tab.id)}
							role="tab"
							aria-selected={activeDetailTab === tab.id}
							aria-controls={tabPanelId(tab.id)}
							tabindex={activeDetailTab === tab.id ? 0 : -1}
							onclick={() => onTabChange(tab.id)}
							onkeydown={(event) => handleTabKeydown(event, tab.id)}
							class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 motion-reduce:transition-none {activeDetailTab ===
							tab.id
								? 'bg-surface shadow-sm ring-1 ring-border/60 text-text'
								: 'text-text-muted hover:text-text hover:bg-surface/60'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1"
						>
							<TabIcon class="h-4 w-4 {activeDetailTab === tab.id ? tab.accentClass : ''}" />
							{tab.label}
						</button>
					{/each}
				</div>

				<!-- Tab Panels -->
				<div
					class="mt-4"
					role="tabpanel"
					id={tabPanelId(activeDetailTab)}
					aria-labelledby={tabId(activeDetailTab)}
					tabindex="0"
				>
					{#if assignmentDetailLoadError && activeDetailTab === 'steps'}
						<InlineErrorBanner message={assignmentDetailLoadError} />
					{:else if assignmentHistoryLoadError && activeDetailTab === 'timeline'}
						<InlineErrorBanner message={assignmentHistoryLoadError} />
					{/if}

					{#if activeDetailTab === 'steps'}
						<!-- ─── Steps Panel ─── -->
						<div class="space-y-2">
							{#if isLoadingAssignmentDetail}
								{#each Array.from({ length: Math.max(3, selectedAssignment.total_steps || 3) }) as _, i (`skel-step-${i}`)}
									<div
										class="flex items-start gap-3 rounded-xl border border-border/50 bg-surface p-4"
										aria-busy="true"
									>
										<div class="mt-0.5 h-6 w-6 animate-pulse rounded-full bg-border/50"></div>
										<div class="flex-1 space-y-2">
											<div class="h-4 w-2/3 animate-pulse rounded-md bg-border/50"></div>
											<div class="h-3 w-1/3 animate-pulse rounded-md bg-border/40"></div>
										</div>
									</div>
								{/each}
							{:else if detail?.steps.length}
								{#each detail.steps as step, i (step.step_id)}
									{@const sCfg = stepStatusConfig[step.status] ?? stepStatusConfig['pending']}
									<div class="relative flex items-stretch gap-0">
										<!-- Vertical connector -->
										<div class="flex w-10 shrink-0 flex-col items-center">
											<div
												class="z-10 mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 {sCfg.circleClass}"
											>
												{#if step.status === 'completed'}
													<Check class="h-3.5 w-3.5" />
												{:else if step.status === 'in_progress'}
													<div class="h-2 w-2 animate-pulse rounded-full bg-info"></div>
												{:else}
													<span class="text-[9px] leading-none font-bold">{i + 1}</span>
												{/if}
											</div>
											{#if i < detail.steps.length - 1}
												<div class="mt-1 flex-1 border-l border-dashed border-border/40"></div>
											{/if}
										</div>

										<!-- Step card -->
										<div
											class="mb-2 min-w-0 flex-1 rounded-xl border {sCfg.cardBorder} {sCfg.cardBg} p-3.5 transition-colors"
										>
											<div class="flex flex-wrap items-start justify-between gap-2">
												<p
													class="text-sm font-semibold {step.status === 'completed'
														? 'text-text-muted line-through decoration-success/40'
														: 'text-text'}"
												>
													{step.title}
												</p>
												<span class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold {sCfg.labelClass}">
													{sCfg.label}
												</span>
											</div>

											{#if step.body}
												<p class="mt-1.5 text-xs leading-relaxed text-text-muted">{step.body}</p>
											{/if}

											<div class="mt-2.5 flex flex-wrap items-center gap-1.5">
												<span
													class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium {step.is_required
														? 'border-warning/20 bg-warning/8 text-warning'
														: 'border-border/60 text-text-muted'}"
												>
													{step.is_required ? 'Required' : 'Optional'}
												</span>
												{#if step.started_at}
													<span
														class="inline-flex items-center gap-1 rounded-md border border-info/15 bg-info/[0.04] px-2 py-0.5 text-[11px] font-medium text-info"
													>
														<Clock class="h-3 w-3" />
														Started {formatDate(step.started_at)}
													</span>
												{/if}
												{#if step.completed_at}
													<span
														class="inline-flex items-center gap-1 rounded-md border border-success/15 bg-success/[0.04] px-2 py-0.5 text-[11px] font-medium text-success"
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
									class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 px-6 py-10 text-center"
								>
									<div class="rounded-full bg-info/8 p-3">
										<CircleAlert class="h-6 w-6 text-info/60" />
									</div>
									<div>
										<p class="text-sm font-semibold text-text-muted">No step data yet</p>
										<p class="mt-0.5 text-xs text-text-subtle">
											Step progress will appear once the employee has started the handbook.
										</p>
									</div>
								</div>
							{/if}
						</div>

					{:else}
						<!-- ─── Timeline Panel ─── -->
						<div class="space-y-1">
							<div class="mb-4 flex items-center justify-between">
								<div>
									<h4 class="text-sm font-semibold text-text">Lifecycle Timeline</h4>
									<p class="text-xs text-text-muted">Newest activity shown first.</p>
								</div>
								<span
									class="inline-flex items-center gap-1.5 rounded-full border border-secondary/15 bg-secondary/8 px-2.5 py-1 text-[11px] font-semibold text-secondary"
								>
									<CalendarClock class="h-3.5 w-3.5" />
									{formatEventCountLabel(assignmentHistory.length)}
								</span>
							</div>

							{#if isLoadingAssignmentHistory}
								<div class="space-y-3">
									{#each Array.from({ length: 4 }) as _, i (`skel-tl-${i}`)}
										<div class="flex items-start gap-3">
											<div
												class="mt-1 h-7 w-7 shrink-0 animate-pulse rounded-full bg-border/50"
											></div>
											<div
												class="flex-1 space-y-2 rounded-xl border border-border/50 bg-surface p-3.5"
											>
												<div class="h-4 w-48 animate-pulse rounded-md bg-border/50"></div>
												<div class="h-3 w-28 animate-pulse rounded-md bg-border/40"></div>
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
											<div class="flex w-7 shrink-0 flex-col items-center">
												<div
													class="z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border {meta.dotClass}"
												>
													<EventIcon class="h-3.5 w-3.5 {meta.iconClass}" />
												</div>
												{#if idx < assignmentHistory.length - 1}
													<div
														class="mt-1 flex-1 border-l border-dashed border-border/40 pb-2"
													></div>
												{/if}
											</div>

											<div class="mb-3 flex-1 rounded-xl border {meta.bgClass} p-3.5">
												<div class="flex flex-wrap items-start justify-between gap-2">
													<div>
														<p class="text-sm font-semibold text-text">{meta.label}</p>
														<p class="mt-0.5 text-xs font-medium text-text-muted">
															By {getHistoryActorLabel(entry)}
														</p>
													</div>
													<div class="text-right">
														<p class="text-[11px] font-medium text-text-muted">
															{formatRelativeTime(entry.created_at)}
														</p>
														<p class="text-[10px] font-medium text-text-subtle">
															{formatDateTime(entry.created_at)}
														</p>
													</div>
												</div>

												<div class="mt-2.5 flex flex-wrap gap-1.5">
													<span
														class="inline-flex items-center gap-1 rounded-md border border-info/15 bg-info/[0.05] px-2 py-0.5 text-[10px] font-semibold text-info"
													>
														<Hash class="h-2.5 w-2.5" />
														v{entry.template_version}
													</span>
													{#if entry.employee_handbook_id}
														<span
															class="inline-flex items-center rounded-md border border-success/15 bg-success/[0.05] px-2 py-0.5 text-[10px] font-semibold text-success"
														>
															Assignment linked
														</span>
													{/if}
												</div>

												{#if metaItems.length > 0}
													<div
														class="mt-2.5 rounded-lg border border-border/30 bg-surface/50 px-3 py-2"
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
									class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 px-6 py-10 text-center"
								>
									<div class="rounded-full bg-secondary/8 p-3">
										<CalendarClock class="h-6 w-6 text-secondary/60" />
									</div>
									<div>
										<p class="text-sm font-semibold text-text-muted">No events yet</p>
										<p class="mt-0.5 text-xs text-text-subtle">
											Lifecycle events will be recorded as the handbook progresses.
										</p>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center gap-3 py-20 text-center">
			<div class="rounded-2xl bg-info/8 p-4">
				<BookOpen class="h-7 w-7 text-info/50" />
			</div>
			<p class="text-sm font-semibold text-text-muted">No assignment selected</p>
		</div>
	{/if}
</Sheet>
