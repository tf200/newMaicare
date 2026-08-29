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
		getGoalEvaluation,
		submitEvaluationDraft,
		updateEvaluationDraft
	} from '$lib/api/evaluations';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { getToastState } from '$lib/state/toast.svelte';
	import type {
		CreateEvaluationRequest,
		EvaluationBootstrapResponse,
		EvaluationErrorCode,
		EvaluationMutationErrorData,
		GoalEvaluationResponse,
		UpdateEvaluationDraftRequest
	} from '$lib/types/api';
	import {
		EvaluationSchema,
		type EvaluationInput,
		type EvaluationSchemaInput
	} from '$lib/schemas/evaluation';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { ApiClientError } from '$lib/api/client';

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
	const toast = getToastState();

	let bootstrap = $state<EvaluationBootstrapResponse | null>(null);
	let evaluation = $state<GoalEvaluationResponse | null>(null);
	let mode = $state<Mode>('create_new');
	let formError = $state('');
	let isLoading = $state(false);
	let isSubmitting = $state(false);
	let showDiscardConfirmation = $state(false);
	let initialSnapshot = $state('');
	let currentCycleConflict = $state(false);
	let conflictEvaluation = $state<GoalEvaluationResponse | null>(null);
	let showConflictReloadConfirmation = $state(false);
	const formId = 'create-evaluation-form';

	const { form, errors, enhance, reset } = superForm(
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
				const currentEvaluationId = evaluation?.id ?? evaluationId;
				if (form.valid && (clientId || currentEvaluationId) && !isSubmitting) {
					isSubmitting = true;
					formError = '';
					try {
						const draftPayload: UpdateEvaluationDraftRequest = {
							overall_notes: trimToUndefined(form.data.overall_notes) ?? null,
							items: form.data.items.map((item) => ({
								goal_id: item.goal_id,
								progress: item.progress,
								notes: trimToUndefined(item.notes) ?? null
							}))
						};

						let response: Awaited<ReturnType<typeof updateEvaluationDraft>>;
						let savedEvaluationId = currentEvaluationId;
						let currentRevision = evaluation?.updated_at;

						if (savedEvaluationId) {
							if (!currentRevision) {
								formError = m.evaluation_revision_required();
								return;
							}
							response = await updateEvaluationDraft(
								savedEvaluationId,
								currentRevision,
								draftPayload
							);
							currentRevision = response.data.updated_at;
						} else {
							const createPayload: CreateEvaluationRequest = { ...draftPayload, submit: false };
							response = await createEvaluation(clientId!, createPayload);
							savedEvaluationId = response.data.id;
							currentRevision = response.data.updated_at;

							if (form.data.submit) {
								response = await updateEvaluationDraft(
									savedEvaluationId,
									currentRevision,
									draftPayload
								);
								currentRevision = response.data.updated_at;
							}
						}

						if (form.data.submit) {
							response = await submitEvaluationDraft(savedEvaluationId, currentRevision);
						}

						evaluation = response.data;
						mode =
							response.data.status === 'completed' || response.data.status === 'archived'
								? 'view_only'
								: 'edit_draft';

						const updatedData: EvaluationInput = {
							overall_notes: form.data.overall_notes,
							submit: false,
							items: form.data.items.map((item) => ({
								goal_id: item.goal_id,
								progress: item.progress,
								notes: item.notes
							}))
						};
						reset({ data: updatedData });
						initialSnapshot = JSON.stringify(updatedData);
						onSaved?.();

						toast.success(
							response.data.status === 'draft'
								? m.evaluation_draft_saved_success()
								: m.evaluation_submitted_success()
						);

						if (response.data.status === 'completed' || response.data.status === 'archived') {
							closeAndReset();
						}
					} catch (error) {
						handleEvaluationMutationError(error);
					} finally {
						isSubmitting = false;
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

	const isHistoricalDraft = $derived(
		currentCycleConflict ||
			(evaluation?.status === 'draft' &&
				!!bootstrap &&
				(!bootstrap.next_evaluation_date ||
					!isSameEvaluationDate(evaluation.evaluation_date, bootstrap.next_evaluation_date)))
	);
	const isReadOnly = $derived(
		mode === 'view_only' ||
			isHistoricalDraft ||
			evaluation?.status === 'completed' ||
			evaluation?.status === 'archived'
	);
	const showLastEvaluation = $derived(!evaluation || evaluation.status === 'draft');
	const isDirty = $derived(
		!isReadOnly && initialSnapshot !== '' && JSON.stringify($form) !== initialSnapshot
	);

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

	const isEvaluationErrorCode = (code: string | undefined): code is EvaluationErrorCode =>
		code === 'EVALUATION_CLIENT_NOT_IN_CARE' ||
		code === 'EVALUATION_NO_ACTIVE_GOALS' ||
		code === 'EVALUATION_NO_DUE_DATE' ||
		code === 'EVALUATION_NOT_FOUND' ||
		code === 'EVALUATION_NOT_OWNER' ||
		code === 'EVALUATION_DUPLICATE_GOAL' ||
		code === 'EVALUATION_GOAL_NOT_ACTIVE' ||
		code === 'EVALUATION_INVALID_PROGRESS' ||
		code === 'EVALUATION_INCOMPLETE' ||
		code === 'EVALUATION_TOO_EARLY' ||
		code === 'EVALUATION_ALREADY_COMPLETED' ||
		code === 'EVALUATION_NOT_CURRENT_CYCLE' ||
		code === 'EVALUATION_CONFLICT' ||
		code === 'EVALUATION_REVISION_REQUIRED';

	const isEvaluationMutationErrorData = (data: unknown): data is EvaluationMutationErrorData =>
		!!data && typeof data === 'object' && 'draft_saved' in data;

	const localizedEvaluationError = (code: EvaluationErrorCode) => {
		switch (code) {
			case 'EVALUATION_CLIENT_NOT_IN_CARE':
				return m.evaluation_client_not_in_care();
			case 'EVALUATION_NO_ACTIVE_GOALS':
				return m.evaluation_no_active_goals();
			case 'EVALUATION_NO_DUE_DATE':
				return m.evaluation_no_due_date();
			case 'EVALUATION_NOT_FOUND':
				return m.evaluation_not_found();
			case 'EVALUATION_NOT_OWNER':
				return m.evaluation_not_owner();
			case 'EVALUATION_DUPLICATE_GOAL':
				return m.evaluation_duplicate_goal();
			case 'EVALUATION_GOAL_NOT_ACTIVE':
				return m.evaluation_goal_not_active();
			case 'EVALUATION_INVALID_PROGRESS':
				return m.evaluation_invalid_progress();
			case 'EVALUATION_INCOMPLETE':
				return m.evaluation_incomplete();
			case 'EVALUATION_TOO_EARLY':
				return m.evaluation_submit_not_allowed();
			case 'EVALUATION_ALREADY_COMPLETED':
				return m.evaluation_already_completed();
			case 'EVALUATION_NOT_CURRENT_CYCLE':
				return m.evaluation_historical_read_only();
			case 'EVALUATION_CONFLICT':
				return m.evaluation_conflict();
			case 'EVALUATION_REVISION_REQUIRED':
				return m.evaluation_revision_required();
		}
	};

	const handleEvaluationMutationError = (error: unknown) => {
		if (!(error instanceof ApiClientError) || !isEvaluationErrorCode(error.code)) {
			formError = m.failed_save_evaluation();
			return;
		}

		if (isEvaluationMutationErrorData(error.data) && error.data.draft_saved) {
			if (error.data.evaluation) {
				evaluation = error.data.evaluation;
				mode = 'edit_draft';
			}
			onSaved?.();
			formError = `${m.evaluation_draft_saved_submit_blocked()} ${localizedEvaluationError(error.code)}`;
			return;
		}
		if (error.code === 'EVALUATION_CONFLICT') {
			conflictEvaluation = isEvaluationMutationErrorData(error.data)
				? (error.data.evaluation ?? null)
				: null;
			showConflictReloadConfirmation = false;
			formError = localizedEvaluationError(error.code);
			return;
		}

		switch (error.code) {
			case 'EVALUATION_NOT_FOUND':
				toast.error(m.evaluation_not_found());
				closeAndReset();
				return;
			case 'EVALUATION_NOT_OWNER':
				formError = localizedEvaluationError(error.code);
				return;
			case 'EVALUATION_ALREADY_COMPLETED':
				mode = 'view_only';
				formError = localizedEvaluationError(error.code);
				return;
			case 'EVALUATION_NOT_CURRENT_CYCLE':
				currentCycleConflict = true;
				formError = localizedEvaluationError(error.code);
				return;
			default:
				formError = localizedEvaluationError(error.code);
		}
	};

	const localizedEvaluationLoadError = (error: unknown) => {
		if (!(error instanceof ApiClientError) || !isEvaluationErrorCode(error.code)) {
			return m.failed_load_evaluation_form();
		}

		return localizedEvaluationError(error.code);
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

	function isSameEvaluationDate(left: string, right: string) {
		return left.slice(0, 10) === right.slice(0, 10);
	}

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
		initialSnapshot = JSON.stringify(initialData);
	};

	const reloadConflictEvaluation = async () => {
		const id = conflictEvaluation?.id ?? evaluation?.id;
		if (!id || isLoading) return;
		isLoading = true;
		formError = '';
		try {
			await loadByEvaluationId(id);
			conflictEvaluation = null;
			showConflictReloadConfirmation = false;
		} catch (error) {
			formError = localizedEvaluationLoadError(error);
		} finally {
			isLoading = false;
		}
	};

	const openCurrentCycleDraft = async () => {
		const currentDraftId = bootstrap?.existing_draft?.id;
		if (!currentDraftId || currentDraftId === evaluation?.id) return;
		isLoading = true;
		formError = '';
		currentCycleConflict = false;
		conflictEvaluation = null;
		showConflictReloadConfirmation = false;
		try {
			await loadByEvaluationId(currentDraftId);
		} catch (error) {
			formError = localizedEvaluationLoadError(error);
		} finally {
			isLoading = false;
		}
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
			isSameEvaluationDate(
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
		initialSnapshot = JSON.stringify(initialData);
	};

	const resetWorkflow = () => {
		bootstrap = null;
		evaluation = null;
		mode = 'create_new';
		formError = '';
		isLoading = false;
		showDiscardConfirmation = false;
		initialSnapshot = '';
		currentCycleConflict = false;
		reset({
			data: {
				submit: false,
				items: [],
				overall_notes: ''
			}
		});
	};

	const closeAndReset = () => {
		open = false;
		resetWorkflow();
	};

	const requestClose = () => {
		if (isSubmitting) return false;
		if (isDirty) {
			showDiscardConfirmation = true;
			return false;
		}
		return true;
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
					formError = localizedEvaluationLoadError(error);
				} finally {
					isLoading = false;
				}
			})();
		}
	});

	const saveDraft = () => {
		if (isSubmitting) return;
		$form.submit = false;
		const formEl = document.getElementById(formId) as HTMLFormElement | null;
		if (formEl) formEl.requestSubmit();
	};

	const submitEvaluation = () => {
		if (isSubmitting) return;
		$form.submit = true;
		const formEl = document.getElementById(formId) as HTMLFormElement | null;
		if (formEl) formEl.requestSubmit();
	};
</script>

<Modal
	bind:open
	size="4xl"
	title={modalTitle}
	description={modalDescription}
	closeLabel={m.close()}
	dismissible={!isSubmitting}
	onRequestClose={requestClose}
	onClose={resetWorkflow}
>
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
			{#if isHistoricalDraft}
				<div
					class="rounded-2xl border border-info/40 bg-info/10 p-4 text-sm text-text"
					role="status"
				>
					<p class="font-semibold">{m.read_only()}</p>
					<p class="mt-1 text-text-muted">{m.evaluation_historical_read_only()}</p>
					{#if bootstrap?.existing_draft?.id && bootstrap.existing_draft.id !== evaluation?.id}
						<button
							type="button"
							class="mt-3 font-semibold text-info underline underline-offset-2"
							onclick={openCurrentCycleDraft}
						>
							{m.open_current_evaluation()}
						</button>
					{/if}
				</div>
			{/if}
			{#if conflictEvaluation}
				<div
					class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-text"
					role="alert"
				>
					<p class="font-semibold">{m.evaluation_conflict_title()}</p>
					<p class="mt-1 text-text-muted">{m.evaluation_conflict()}</p>
					<p class="mt-2 text-xs text-text-muted">
						{m.evaluation_server_updated_at({
							date: new Date(conflictEvaluation.updated_at).toLocaleString(resolveLocale())
						})}
					</p>
					{#if showConflictReloadConfirmation}
						<p class="mt-3 font-medium">{m.evaluation_reload_discards_local_changes()}</p>
						<div class="mt-3 flex flex-wrap gap-2">
							<Button variant="ghost" onclick={() => (showConflictReloadConfirmation = false)}>
								{m.keep_editing()}
							</Button>
							<Button variant="destructive" onclick={reloadConflictEvaluation}>
								{m.reload_server_evaluation()}
							</Button>
						</div>
					{:else}
						<div class="mt-3">
							<Button variant="secondary" onclick={() => (showConflictReloadConfirmation = true)}>
								{m.review_server_version()}
							</Button>
						</div>
					{/if}
				</div>
			{:else if formError}
				<div
					class="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error"
					role="alert"
				>
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

				<section class="min-w-0 space-y-5">
					<h4
						class="border-b border-border pb-3 text-xs font-bold tracking-widest text-text-subtle uppercase"
					>
						{m.current_evaluation()}
					</h4>
					<div class="pb-1">
						<Textarea
							label={m.overall_notes()}
							placeholder={m.placeholder_overall_notes()}
							disabled={isReadOnly}
							bind:value={$form.overall_notes}
							error={formatFormError($errors.overall_notes)}
						/>
					</div>

					<div class="divide-y divide-border border-t border-border">
						{#each viewGoals as goal, index (goal.goal_id)}
							<section class="py-5 first:pt-5 last:pb-0">
								<div class="mb-4 flex flex-wrap items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="text-sm font-semibold text-text">{goal.title}</p>
										<p class="mt-0.5 text-xs text-text-muted">
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

								<div class="space-y-4">
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
								</div>

								{#if showLastEvaluation && (goal.last_progress || goal.last_notes)}
									<div class="mt-4 border-l-2 border-info/40 pl-3 text-xs text-text-muted">
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
							</section>
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
				<Button variant="ghost" onclick={closeAndReset}>{m.close()}</Button>
			</div>
		{:else if showDiscardConfirmation}
			<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="min-w-0">
					<p class="text-sm font-semibold text-text">
						{m.discard_evaluation_changes_confirmation()}
					</p>
					<p class="text-xs text-text-muted">{m.evaluation_changes_will_be_lost()}</p>
				</div>
				<div class="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
					<Button variant="ghost" onclick={() => (showDiscardConfirmation = false)}>
						{m.keep_editing()}
					</Button>
					<Button variant="destructive" onclick={closeAndReset}>{m.discard_changes()}</Button>
				</div>
			</div>
		{:else}
			<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="inline-flex items-center gap-2 text-xs text-text-muted">
					<CircleAlert class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
					{m.submit_saves_draft_notice()}
				</div>
				<div class="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
					<Button
						variant="ghost"
						onclick={() => {
							if (requestClose()) closeAndReset();
						}}
						disabled={isSubmitting}>{m.cancel()}</Button
					>
					<Button
						variant="secondary"
						onclick={saveDraft}
						isLoading={isSubmitting && !$form.submit}
						disabled={isSubmitting}>{m.save_draft()}</Button
					>
					<Button
						onclick={submitEvaluation}
						isLoading={isSubmitting && $form.submit}
						disabled={isSubmitting}>{m.submit()}</Button
					>
				</div>
			</div>
		{/if}
	{/snippet}
</Modal>
