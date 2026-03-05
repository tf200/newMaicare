<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { CalendarClock, CircleAlert, FileClock } from 'lucide-svelte';
	import {
		createEvaluation,
		getEvaluationBootstrap,
		getGoalEvaluation
	} from '$lib/api/evaluations';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import type {
		CreateEvaluationRequest,
		EvaluationBootstrapResponse,
		GoalEvaluationResponse
	} from '$lib/types/api';
	import {
		EvaluationSchema,
		type EvaluationInput,
		type EvaluationSchemaInput
	} from '$lib/schemas/evaluation';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';

	type Mode = 'create_new' | 'edit_draft' | 'view_only';

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
	let formError = $state('');
	let isLoading = $state(false);
	const formId = 'create-evaluation-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				submit: false,
				items: [],
				overall_notes: ''
			} as unknown as EvaluationSchemaInput,
			valibotClient(EvaluationSchema)
		),
		{
			validators: valibotClient(EvaluationSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && clientId) {
					try {
						const payload: CreateEvaluationRequest = {
							overall_notes: trimToUndefined(form.data.overall_notes) ?? null,
							submit: form.data.submit,
							items: form.data.items.map((item) => ({
								goal_id: item.goal_id,
								progress: item.progress,
								notes: trimToUndefined(item.notes) ?? null
							}))
						};

						const response = await createEvaluation(clientId, payload);

						evaluation = response.data;
						mode =
							response.data.status === 'completed' || response.data.status === 'archived'
								? 'view_only'
								: 'edit_draft';

						// Update form with fresh data from server
						const updatedData: EvaluationInput = {
							overall_notes: response.data.overall_notes ?? '',
							submit: false,
							items: response.data.items.map((item) => ({
								goal_id: item.goal_id,
								progress: item.progress,
								notes: item.notes ?? ''
							}))
						};
						reset({ data: updatedData });
						onSaved?.();

						if (response.data.status === 'draft' && response.data.submit_error) {
							formError = normalizeErrorMessage(response.data.submit_error);
							return;
						}

						if (response.data.status === 'completed' || response.data.status === 'archived') {
							open = false;
						}
					} catch (error) {
						formError = normalizeErrorMessage(
							error instanceof Error ? error.message : m.failed_save_evaluation()
						);
					}
				}
			}
		}
	);

	const progressOptions = [
		{ value: 'no_progress', label: m.no_progress() },
		{ value: 'regression', label: m.regression() },
		{ value: 'limited_progress', label: m.limited_progress() },
		{ value: 'good_progress', label: m.good_progress() },
		{ value: 'achieved', label: m.achieved() },
		{ value: 'blocked', label: m.blocked() }
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

	const isReadOnly = $derived(
		evaluation?.status === 'completed' || evaluation?.status === 'archived'
	);
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
		if (isReadOnly) return m.evaluation_details();
		return mode === 'edit_draft' ? m.continue_draft() : m.create_evaluation();
	});

	const modalDescription = $derived.by(() => {
		if (isReadOnly) return m.review_saved_evaluation_details();
		return m.review_previous_outcomes();
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
			return m.evaluation_submit_not_allowed();
		}
		return message;
	};

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const progressLabel = (value: string | null | undefined) => {
		switch (value) {
			case 'no_progress':
				return m.no_progress();
			case 'regression':
				return m.regression();
			case 'limited_progress':
				return m.limited_progress();
			case 'good_progress':
				return m.good_progress();
			case 'achieved':
				return m.achieved();
			case 'blocked':
				return m.blocked();
			default:
				return value ? value.replace('_', ' ') : m.not_available_short();
		}
	};

	const priorityLabel = (priority: 'high' | 'medium' | 'low') => {
		if (priority === 'high') return m.high();
		if (priority === 'medium') return m.medium();
		return m.low();
	};

	const isSameTimestamp = (left: string, right: string) =>
		new Date(left).getTime() === new Date(right).getTime();

	const loadByEvaluationId = async (id: string) => {
		const response = await getGoalEvaluation(id);
		evaluation = response.data;

		if (response.data.status === 'draft') {
			mode = 'edit_draft';
			const bootstrapResponse = await getEvaluationBootstrap(response.data.client_id);
			bootstrap = bootstrapResponse.data;
		} else {
			mode = 'view_only';
			bootstrap = null;
		}

		const initialData: EvaluationInput = {
			overall_notes: response.data.overall_notes ?? '',
			submit: false,
			items: response.data.items.map((item) => ({
				goal_id: item.goal_id,
				progress: item.progress,
				notes: item.notes ?? ''
			}))
		};
		reset({ data: initialData });
	};

	const loadBootstrap = async () => {
		if (!clientId || !open) return;
		const response = await getEvaluationBootstrap(clientId);
		bootstrap = response.data;
		evaluation = null;
		mode = 'create_new';

		if (
			response.data.existing_draft?.id &&
			response.data.next_evaluation_date &&
			isSameTimestamp(
				response.data.existing_draft.evaluation_date,
				response.data.next_evaluation_date
			)
		) {
			await loadByEvaluationId(response.data.existing_draft.id);
			return;
		}

		const initialData: EvaluationInput = {
			overall_notes: '',
			submit: false,
			items: response.data.active_goals.map((goal) => ({
				goal_id: goal.goal_id,
				progress: 'no_progress',
				notes: ''
			}))
		};
		reset({ data: initialData });
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
						error instanceof Error ? error.message : m.failed_load_evaluation_form()
					);
				} finally {
					isLoading = false;
				}
			})();
		}
	});

	const saveDraft = () => {
		$form.submit = false;
		const formEl = document.getElementById(formId) as HTMLFormElement | null;
		if (formEl) formEl.requestSubmit();
	};

	const submitEvaluation = () => {
		$form.submit = true;
		const formEl = document.getElementById(formId) as HTMLFormElement | null;
		if (formEl) formEl.requestSubmit();
	};
</script>

<Modal bind:open size="4xl" title={modalTitle} description={modalDescription}>
	{#if isLoading}
		<div class="rounded-2xl border border-border bg-bg/50 p-6 text-sm text-text-muted">
			{m.loading_evaluation_form()}
		</div>
	{:else if !bootstrap && !evaluation}
		<div class="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
			{m.unable_load_evaluation_data()}
		</div>
	{:else}
		<form id={formId} use:enhance class="space-y-5">
			{#if formError}
				<div class="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
					{formError}
				</div>
			{/if}

			<header class="rounded-2xl border border-border bg-bg/40 p-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-xs font-bold tracking-widest text-text-subtle uppercase">{m.client()}</p>
						<h3 class="text-lg font-bold text-text">
							{clientName ??
								(bootstrap
									? `${bootstrap.client_first_name} ${bootstrap.client_last_name}`
									: m.client())}
						</h3>
					</div>
					{#if bootstrap}
						<div class="flex items-center gap-2 text-sm font-semibold text-text-muted">
							<CalendarClock class="h-4 w-4" />
							{#if bootstrap.next_evaluation_date}
								{m.days_left({ days: bootstrap.days_left })}
							{:else}
								{m.no_due_date_scheduled()}
							{/if}
						</div>
					{/if}
				</div>
				{#if mode === 'edit_draft' && !isReadOnly && (evaluation || bootstrap?.existing_draft)}
					<div
						class="mt-3 inline-flex items-center gap-2 rounded-full border border-info/60 bg-info px-3 py-1 text-xs font-semibold text-white"
					>
						<FileClock class="h-3.5 w-3.5" />
						{m.continuing_draft_from({
							date: new Date(
								evaluation?.updated_at ?? bootstrap?.existing_draft?.updated_at ?? Date.now()
							).toLocaleDateString(resolveLocale())
						})}
					</div>
				{/if}
			</header>

			<div class="grid grid-cols-1 gap-6 {showLastEvaluation ? 'xl:grid-cols-2' : ''}">
				{#if showLastEvaluation}
					<section class="space-y-4 rounded-2xl border border-border bg-surface p-4">
						<h4 class="text-xs font-bold tracking-widest text-text-subtle uppercase">
							{m.last_evaluation()}
						</h4>
						{#if bootstrap?.last_completed_evaluation}
							<div class="space-y-3 text-sm text-text-muted">
								<p>
									<span class="font-semibold text-text">{m.evaluation_date()}:</span>
									{new Date(bootstrap.last_completed_evaluation.evaluation_date).toLocaleDateString(
										resolveLocale()
									)}
								</p>
								<p>
									<span class="font-semibold text-text">{m.submitted()}:</span>
									{new Date(bootstrap.last_completed_evaluation.submitted_at).toLocaleString(
										resolveLocale()
									)}
								</p>
								<p>
									<span class="font-semibold text-text">{m.created_by()}:</span>
									{bootstrap.last_completed_evaluation.creator_name ?? m.not_available_short()}
								</p>
								<div class="rounded-xl border border-border bg-bg/40 p-3">
									<p class="mb-1 text-xs font-bold tracking-wide text-text-subtle uppercase">
										{m.notes_label()}
									</p>
									<p class="text-sm text-text">
										{bootstrap.last_completed_evaluation.overall_notes ?? m.no_notes_available()}
									</p>
								</div>
							</div>
						{:else}
							<div class="rounded-xl border border-border bg-bg/40 p-3 text-sm text-text-muted">
								{m.no_previous_evaluation_found()}
							</div>
						{/if}
					</section>
				{/if}

				<section class="space-y-4 rounded-2xl border border-border bg-surface p-4">
					<h4 class="text-xs font-bold tracking-widest text-text-subtle uppercase">
						{m.current_evaluation()}
					</h4>
					<Textarea
						label={m.overall_notes()}
						placeholder={m.placeholder_overall_notes()}
						disabled={isReadOnly}
						bind:value={$form.overall_notes}
					/>

					<div class="space-y-3">
						{#each viewGoals as goal, index (goal.goal_id)}
							<div class="rounded-xl border border-border p-3">
								<div class="mb-3 flex flex-wrap items-start justify-between gap-2">
									<div>
										<p class="text-sm font-semibold text-text">{goal.title}</p>
										<p class="text-xs text-text-muted">
											{goal.topic_name_snapshot ?? m.not_available_short()}
										</p>
									</div>
									{#if goal.priority}
										<span
											class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase {priorityTone(
												goal.priority
											)}"
										>
											{priorityLabel(goal.priority)}
										</span>
									{/if}
								</div>

								{#if isReadOnly}
									<div class="mb-3">
										<p class="mb-1 text-xs font-bold tracking-wide text-text-subtle uppercase">
											{m.progress()}
										</p>
										<p class="text-sm text-text">
											{progressLabel($form.items[index]?.progress ?? 'no_progress')}
										</p>
									</div>
									<Textarea
										label={m.notes_label()}
										disabled={true}
										value={$form.items[index]?.notes ?? ''}
									/>
								{:else if $form.items[index]}
									<Select
										label={m.progress()}
										options={progressOptions}
										bind:value={$form.items[index].progress}
										error={formatFormError($errors.items?.[index]?.progress)}
									/>
									<Textarea
										label={m.notes_label()}
										placeholder={m.placeholder_goal_notes()}
										bind:value={$form.items[index].notes}
										error={formatFormError($errors.items?.[index]?.notes)}
									/>
								{/if}

								{#if showLastEvaluation && (goal.last_progress || goal.last_notes)}
									<div
										class="mt-2 rounded-lg border border-border bg-bg/40 p-2 text-xs text-text-muted"
									>
										<p class="font-semibold text-text">{m.last_evaluation_context()}</p>
										{#if goal.last_progress}
											<p>
												{m.progress()}: {progressLabel(goal.last_progress)}
											</p>
										{/if}
										{#if goal.last_notes}
											<p>{m.notes_label()}: {goal.last_notes}</p>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			</div>
			<button type="submit" class="hidden" aria-hidden="true"></button>
		</form>
	{/if}

	{#snippet footer()}
		{#if isReadOnly}
			<div class="flex justify-end">
				<Button variant="ghost" onclick={() => (open = false)}>{m.close()}</Button>
			</div>
		{:else}
			<div class="flex items-center justify-between gap-3">
				<div class="inline-flex items-center gap-2 text-xs text-text-muted">
					<CircleAlert class="h-3.5 w-3.5" />
					{m.submit_saves_draft_notice()}
				</div>
				<div class="flex gap-2">
					<Button variant="ghost" onclick={() => (open = false)} disabled={$delayed}
						>{m.cancel()}</Button
					>
					<Button
						variant="secondary"
						onclick={saveDraft}
						isLoading={$delayed && !$form.submit}
						disabled={$delayed && $form.submit}>{m.save_draft()}</Button
					>
					<Button
						onclick={submitEvaluation}
						isLoading={$delayed && $form.submit}
						disabled={$delayed && !$form.submit}>{m.submit()}</Button
					>
				</div>
			</div>
		{/if}
	{/snippet}
</Modal>
