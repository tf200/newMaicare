<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { CalendarClock, CircleAlert, FileClock } from 'lucide-svelte';
	import {
		createEvaluation,
		getEvaluationBootstrap,
		getGoalEvaluation,
		submitEvaluationDraft,
		updateEvaluationDraft
	} from '$lib/api/evaluations';
	import type {
		EvaluationBootstrapResponse,
		EvaluationItemInput,
		EvaluationProgress,
		GoalEvaluationResponse
	} from '$lib/types/api';

	type Mode = 'create_new' | 'edit_draft';

	let {
		open = $bindable(false),
		clientId = null,
		evaluationId = null,
		clientName = null,
		onSaved
	} = $props<{
		open?: boolean;
		clientId?: string | null;
		evaluationId?: string | null;
		clientName?: string | null;
		onSaved?: () => void;
	}>();

	let bootstrap = $state<EvaluationBootstrapResponse | null>(null);
	let evaluation = $state<GoalEvaluationResponse | null>(null);
	let mode = $state<Mode>('create_new');
	let draftId = $state<string | null>(null);
	let overallNotes = $state('');
	let goalItems = $state<Record<string, { progress: EvaluationProgress; notes: string }>>({});
	let progressErrors = $state<Record<string, string>>({});
	let formError = $state('');
	let isLoading = $state(false);
	let isSaving = $state(false);
	let isSubmitting = $state(false);

	const progressOptions = [
		{ value: 'no_progress', label: 'No progress' },
		{ value: 'limited_progress', label: 'Limited progress' },
		{ value: 'good_progress', label: 'Good progress' }
	];

	const sortedGoals = $derived.by(() =>
		(bootstrap?.active_goals ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)
	);

	const activeGoalsById = $derived.by(() => {
		const next: Record<string, (typeof sortedGoals)[number]> = {};
		for (const goal of sortedGoals) {
			next[goal.goal_id] = goal;
		}
		return next;
	});

	const isReadOnly = $derived(evaluation?.status === 'completed');
	const showLastEvaluation = $derived(!evaluation || evaluation.status === 'draft');

	const viewGoals = $derived.by(() => {
		if (evaluation?.items?.length) {
			return evaluation.items.map((item) => {
				const activeGoal = activeGoalsById[item.goal_id];
				return {
					goal_id: item.goal_id,
					title: item.goal_title,
					topic_name_snapshot: item.topic_name_snapshot,
					priority: activeGoal?.priority,
					last_progress: activeGoal?.last_progress ?? null,
					last_notes: activeGoal?.last_notes ?? null
				};
			});
		}

		return sortedGoals.map((goal) => ({
			goal_id: goal.goal_id,
			title: goal.title,
			topic_name_snapshot: goal.topic_name_snapshot,
			priority: goal.priority,
			last_progress: goal.last_progress,
			last_notes: goal.last_notes
		}));
	});

	const modalTitle = $derived.by(() => {
		if (isReadOnly) return 'Evaluation Details';
		return mode === 'edit_draft' ? 'Continue Draft' : 'Create Evaluation';
	});

	const modalDescription = $derived.by(() => {
		if (isReadOnly) return 'Review saved evaluation details.';
		return 'Review previous outcomes and complete this evaluation.';
	});

	const priorityTone = (priority: 'high' | 'medium' | 'low') => {
		if (priority === 'high') return 'bg-error text-white border border-error/60';
		if (priority === 'medium') return 'bg-secondary text-white border border-secondary/70';
		return 'bg-info text-white border border-info/60';
	};

	const normalizeErrorMessage = (message: string) => {
		const lower = message.toLowerCase();
		if (
			lower.includes('cannot submit yet') ||
			lower.includes('outside allowed window') ||
			(lower.includes('allowed') && lower.includes('before due'))
		) {
			return 'This evaluation cannot be submitted yet (allowed only within 14 days before due date).';
		}
		return message;
	};

	const trimOrNull = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	};

	const buildItemsPayload = (): EvaluationItemInput[] =>
		viewGoals.map((goal) => ({
			goal_id: goal.goal_id,
			progress: goalItems[goal.goal_id]?.progress ?? 'no_progress',
			notes: trimOrNull(goalItems[goal.goal_id]?.notes ?? '')
		}));

	const initGoalItems = (payload: EvaluationBootstrapResponse) => {
		const next: Record<string, { progress: EvaluationProgress; notes: string }> = {};
		for (const goal of payload.active_goals) {
			next[goal.goal_id] = {
				progress: 'no_progress',
				notes: ''
			};
		}
		goalItems = next;
	};

	const initGoalItemsFromEvaluation = (payload: GoalEvaluationResponse) => {
		const next: Record<string, { progress: EvaluationProgress; notes: string }> = {};
		for (const item of payload.items) {
			next[item.goal_id] = {
				progress: item.progress,
				notes: item.notes ?? ''
			};
		}
		goalItems = next;
	};

	const loadByEvaluationId = async (id: string) => {
		const response = await getGoalEvaluation(id);
		evaluation = response.data;
		draftId = response.data.id;
		overallNotes = response.data.overall_notes ?? '';
		progressErrors = {};
		initGoalItemsFromEvaluation(response.data);

		if (response.data.status === 'draft') {
			mode = 'edit_draft';
			const bootstrapResponse = await getEvaluationBootstrap(response.data.client_id);
			bootstrap = bootstrapResponse.data;
		} else {
			mode = 'edit_draft';
			bootstrap = null;
		}
	};

	const loadBootstrap = async () => {
		if (!clientId || !open) return;
		const response = await getEvaluationBootstrap(clientId);
		bootstrap = response.data;

		if (response.data.existing_draft?.id) {
			await loadByEvaluationId(response.data.existing_draft.id);
			return;
		}

		evaluation = null;
		mode = 'create_new';
		draftId = null;
		overallNotes = '';
		progressErrors = {};
		initGoalItems(response.data);
	};

	$effect(() => {
		if (open && (clientId || evaluationId)) {
			isLoading = true;
			formError = '';

			(async () => {
				try {
					if (evaluationId) {
						await loadByEvaluationId(evaluationId);
					} else {
						await loadBootstrap();
					}
				} catch (error) {
					formError = normalizeErrorMessage(
						error instanceof Error ? error.message : 'Failed to load evaluation form.'
					);
				} finally {
					isLoading = false;
				}
			})();
		}
	});

	const validateSubmit = () => {
		const nextErrors: Record<string, string> = {};
		for (const goal of viewGoals) {
			const progress = goalItems[goal.goal_id]?.progress ?? 'no_progress';
			if (progress === 'no_progress') {
				nextErrors[goal.goal_id] = 'Select progress before submitting';
			}
		}
		progressErrors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	};

	const saveDraft = async () => {
		if (isReadOnly || isSaving || isSubmitting) return;
		isSaving = true;
		formError = '';
		try {
			if (mode === 'edit_draft' && draftId) {
				await updateEvaluationDraft(draftId, {
					overall_notes: trimOrNull(overallNotes) ?? undefined,
					items: buildItemsPayload()
				});
			} else if (clientId) {
				const response = await createEvaluation(clientId, {
					overall_notes: trimOrNull(overallNotes) ?? undefined,
					submit: false,
					items: buildItemsPayload()
				});
				mode = 'edit_draft';
				draftId = response.data.id;
			} else {
				throw new Error('Missing client for draft creation.');
			}
			onSaved?.();
		} catch (error) {
			formError = normalizeErrorMessage(
				error instanceof Error ? error.message : 'Failed to save evaluation draft.'
			);
		} finally {
			isSaving = false;
		}
	};

	const submitEvaluation = async () => {
		if (isReadOnly || isSaving || isSubmitting) return;
		if (!validateSubmit()) return;

		isSubmitting = true;
		formError = '';
		try {
			if (mode === 'edit_draft' && draftId) {
				await updateEvaluationDraft(draftId, {
					overall_notes: trimOrNull(overallNotes) ?? undefined,
					items: buildItemsPayload()
				});
				await submitEvaluationDraft(draftId);
			} else if (clientId) {
				await createEvaluation(clientId, {
					overall_notes: trimOrNull(overallNotes) ?? undefined,
					submit: true,
					items: buildItemsPayload()
				});
			} else {
				throw new Error('Missing client for submission.');
			}
			onSaved?.();
			open = false;
		} catch (error) {
			formError = normalizeErrorMessage(
				error instanceof Error ? error.message : 'Failed to submit evaluation.'
			);
		} finally {
			isSubmitting = false;
		}
	};
</script>

<Modal bind:open size="4xl" title={modalTitle} description={modalDescription}>
	{#if isLoading}
		<div class="rounded-2xl border border-border bg-bg/50 p-6 text-sm text-text-muted">
			Loading evaluation form...
		</div>
	{:else if !bootstrap && !evaluation}
		<div class="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
			Unable to load evaluation data.
		</div>
	{:else}
		<div class="space-y-5">
			{#if formError}
				<div class="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
					{formError}
				</div>
			{/if}

			<header class="rounded-2xl border border-border bg-bg/40 p-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-xs font-bold tracking-widest text-text-subtle uppercase">Client</p>
						<h3 class="text-lg font-bold text-text">
							{clientName ??
								(bootstrap
									? `${bootstrap.client_first_name} ${bootstrap.client_last_name}`
									: 'Client')}
						</h3>
					</div>
					{#if bootstrap}
						<div class="flex items-center gap-2 text-sm font-semibold text-text-muted">
							<CalendarClock class="h-4 w-4" />
							{bootstrap.days_left} days left
						</div>
					{/if}
				</div>
				{#if mode === 'edit_draft' && !isReadOnly && (evaluation || bootstrap?.existing_draft)}
					<div
						class="mt-3 inline-flex items-center gap-2 rounded-full border border-info/60 bg-info px-3 py-1 text-xs font-semibold text-white"
					>
						<FileClock class="h-3.5 w-3.5" />
						Continuing draft from {new Date(
							evaluation?.updated_at ?? bootstrap?.existing_draft?.updated_at ?? Date.now()
						).toLocaleDateString('en-GB')}
					</div>
				{/if}
			</header>

			<div class="grid grid-cols-1 gap-6 {showLastEvaluation ? 'xl:grid-cols-2' : ''}">
				{#if showLastEvaluation}
					<section class="space-y-4 rounded-2xl border border-border bg-surface p-4">
						<h4 class="text-xs font-bold tracking-widest text-text-subtle uppercase">
							Last Evaluation
						</h4>
						{#if bootstrap?.last_completed_evaluation}
							<div class="space-y-3 text-sm text-text-muted">
								<p>
									<span class="font-semibold text-text">Evaluation date:</span>
									{new Date(bootstrap.last_completed_evaluation.evaluation_date).toLocaleDateString(
										'en-GB'
									)}
								</p>
								<p>
									<span class="font-semibold text-text">Submitted:</span>
									{new Date(bootstrap.last_completed_evaluation.submitted_at).toLocaleString(
										'en-GB'
									)}
								</p>
								<p>
									<span class="font-semibold text-text">Created by:</span>
									{bootstrap.last_completed_evaluation.creator_name ?? '—'}
								</p>
								<div class="rounded-xl border border-border bg-bg/40 p-3">
									<p class="mb-1 text-xs font-bold tracking-wide text-text-subtle uppercase">
										Notes
									</p>
									<p class="text-sm text-text">
										{bootstrap.last_completed_evaluation.overall_notes ?? 'No notes available.'}
									</p>
								</div>
							</div>
						{:else}
							<div class="rounded-xl border border-border bg-bg/40 p-3 text-sm text-text-muted">
								No previous evaluation found.
							</div>
						{/if}
					</section>
				{/if}

				<section class="space-y-4 rounded-2xl border border-border bg-surface p-4">
					<h4 class="text-xs font-bold tracking-widest text-text-subtle uppercase">
						Current Evaluation
					</h4>
					<Textarea
						label="Overall notes"
						placeholder="Add summary notes for this evaluation..."
						disabled={isReadOnly}
						bind:value={overallNotes}
					/>

					<div class="space-y-3">
						{#each viewGoals as goal (goal.goal_id)}
							<div class="rounded-xl border border-border p-3">
								<div class="mb-3 flex flex-wrap items-start justify-between gap-2">
									<div>
										<p class="text-sm font-semibold text-text">{goal.title}</p>
										<p class="text-xs text-text-muted">{goal.topic_name_snapshot}</p>
									</div>
									{#if goal.priority}
										<span
											class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase {priorityTone(
												goal.priority
											)}"
										>
											{goal.priority}
										</span>
									{/if}
								</div>

								{#if isReadOnly}
									<div class="mb-3">
										<p class="mb-1 text-xs font-bold tracking-wide text-text-subtle uppercase">
											Progress
										</p>
										<p class="text-sm text-text">
											{(goalItems[goal.goal_id]?.progress ?? 'no_progress').replace('_', ' ')}
										</p>
									</div>
									<Textarea
										label="Notes"
										disabled={true}
										bind:value={goalItems[goal.goal_id].notes}
									/>
								{:else}
									<Select
										label="Progress"
										options={progressOptions}
										bind:value={goalItems[goal.goal_id].progress}
										error={progressErrors[goal.goal_id]}
									/>
									<Textarea
										label="Notes"
										placeholder="Optional notes for this goal..."
										bind:value={goalItems[goal.goal_id].notes}
									/>
								{/if}

								{#if showLastEvaluation && (goal.last_progress || goal.last_notes)}
									<div
										class="mt-2 rounded-lg border border-border bg-bg/40 p-2 text-xs text-text-muted"
									>
										<p class="font-semibold text-text">Last evaluation context</p>
										{#if goal.last_progress}
											<p>Progress: {goal.last_progress.replace('_', ' ')}</p>
										{/if}
										{#if goal.last_notes}
											<p>Notes: {goal.last_notes}</p>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			</div>
		</div>
	{/if}

	{#snippet footer()}
		{#if isReadOnly}
			<div class="flex justify-end">
				<Button variant="ghost" onclick={() => (open = false)}>Close</Button>
			</div>
		{:else}
			<div class="flex items-center justify-between gap-3">
				<div class="inline-flex items-center gap-2 text-xs text-text-muted">
					<CircleAlert class="h-3.5 w-3.5" />
					Submit requires progress on every goal.
				</div>
				<div class="flex gap-2">
					<Button variant="ghost" onclick={() => (open = false)} disabled={isSaving || isSubmitting}
						>Cancel</Button
					>
					<Button
						variant="secondary"
						onclick={saveDraft}
						isLoading={isSaving}
						disabled={isSubmitting}>Save Draft</Button
					>
					<Button onclick={submitEvaluation} isLoading={isSubmitting} disabled={isSaving}
						>Submit</Button
					>
				</div>
			</div>
		{/if}
	{/snippet}
</Modal>
