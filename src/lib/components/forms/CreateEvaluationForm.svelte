<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import * as v from 'valibot';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { CalendarClock, CircleAlert, FileClock, History, PanelLeftOpen, X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
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
	import { trimToUndefined } from '$lib/utils/form-values';
	import { formatDateOnly, isSameDateOnly } from '$lib/utils/date';
	import { ApiClientError } from '$lib/api/client';
	import { evaluationFormData, evaluationFormSnapshot } from './evaluation-form-state';

	type Mode = 'create_new' | 'edit_draft' | 'view_only';

	let {
		open = $bindable(false),
		clientId = null,
		evaluationId = null,
		clientName = null,
		canMutate = false,
		onSaved
	} = $props<{
		open?: boolean;
		clientId?: string | null;
		evaluationId?: string | null;
		clientName?: string | null;
		canMutate?: boolean;
		onSaved?: (evaluation: GoalEvaluationResponse) => void | Promise<void>;
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
	let submissionIntent = $state<'draft' | 'submit' | null>(null);
	let showContext = $state(true);
	let contextInitializedForSession = $state(false);
	let loadController: AbortController | null = null;
	let loadSequence = 0;

	const emptyEvaluationInput: EvaluationSchemaInput = {
		submit: false,
		items: [],
		overall_notes: ''
	};

	const notifySaved = async (savedEvaluation: GoalEvaluationResponse) => {
		try {
			await onSaved?.(savedEvaluation);
			return true;
		} catch {
			return false;
		}
	};

	const { form, reset } = superForm(
		defaults(emptyEvaluationInput, valibotClient(EvaluationSchema)),
		{ SPA: true }
	);

	const saveEvaluation = async (shouldSubmit: boolean) => {
		const currentEvaluationId = evaluation?.id ?? evaluationId;
		if (!canMutate || (!clientId && !currentEvaluationId) || isLoading || isSubmitting) return;

		const parsed = v.safeParse(EvaluationSchema, { ...$form, submit: shouldSubmit });
		if (!parsed.success) {
			formError = m.failed_save_evaluation();
			return;
		}
		if (shouldSubmit && parsed.output.items.some((item) => item.progress === 'not_evaluated')) {
			formError = m.evaluation_incomplete();
			return;
		}

		isSubmitting = true;
		submissionIntent = shouldSubmit ? 'submit' : 'draft';
		formError = '';
		try {
			const draftPayload: UpdateEvaluationDraftRequest = {
				overall_notes: trimToUndefined(parsed.output.overall_notes) ?? null,
				items: parsed.output.items.map((item) => ({
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
				response = await updateEvaluationDraft(savedEvaluationId, currentRevision, draftPayload);
				currentRevision = response.data.updated_at;
			} else {
				const createPayload: CreateEvaluationRequest = { ...draftPayload, submit: false };
				response = await createEvaluation(clientId!, createPayload);
				savedEvaluationId = response.data.id;
				currentRevision = response.data.updated_at;
			}

			if (shouldSubmit) {
				response = await submitEvaluationDraft(savedEvaluationId, currentRevision);
			}

			const savedEvaluation = response.data;
			const updatedData = evaluationFormData(savedEvaluation, parsed.output.items);
			evaluation = savedEvaluation;
			reset({ data: updatedData });
			initialSnapshot = evaluationFormSnapshot(updatedData);
			closeAndReset();
			toast.success(
				savedEvaluation.status === 'draft'
					? m.evaluation_draft_saved_success()
					: m.evaluation_submitted_success()
			);
			if (!(await notifySaved(savedEvaluation))) {
				toast.warning(m.evaluation_saved_refresh_failed());
			}
		} catch (error) {
			await handleEvaluationMutationError(error);
		} finally {
			isSubmitting = false;
			submissionIntent = null;
		}
	};

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
	const evaluationItemsByGoalId = $derived.by(() => {
		const next: Record<string, GoalEvaluationResponse['items'][number]> = {};
		for (const item of evaluation?.items ?? []) next[item.goal_id] = item;
		return next;
	});

	const isHistoricalDraft = $derived(
		currentCycleConflict ||
			(evaluation?.status === 'draft' &&
				!!bootstrap &&
				(!bootstrap.next_evaluation_date ||
					!isSameDateOnly(evaluation.evaluation_date, bootstrap.next_evaluation_date)))
	);
	const isReadOnly = $derived(
		!canMutate ||
			mode === 'view_only' ||
			isHistoricalDraft ||
			evaluation?.status === 'completed' ||
			evaluation?.status === 'archived'
	);
	const showLastEvaluation = $derived(!evaluation || evaluation.status === 'draft');
	const isDirty = $derived(
		!isReadOnly && initialSnapshot !== '' && evaluationFormSnapshot($form) !== initialSnapshot
	);

	const viewGoals = $derived.by(() => {
		return $form.items.map((formItem, formIndex) => {
			const savedItem = evaluationItemsByGoalId[formItem.goal_id];
			const activeGoal = activeGoalsById[formItem.goal_id];
			return {
				goal_id: formItem.goal_id,
				formIndex,
				title: savedItem?.goal_title ?? activeGoal?.title ?? m.not_available_short(),
				topic_name_snapshot:
					savedItem?.topic_name_snapshot ?? activeGoal?.topic_name_snapshot ?? null,
				priority: activeGoal?.priority,
				last_progress: activeGoal?.last_progress ?? null,
				last_notes: activeGoal?.last_notes ?? null
			};
		});
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
		if (priority === 'high') return 'bg-error/10 text-error-strong border border-error/20';
		if (priority === 'medium') return 'bg-warning/15 text-warning-strong border border-warning/25';
		return 'bg-info/10 text-info-strong border border-info/20';
	};

	const priorityBar = (priority: 'high' | 'medium' | 'low' | undefined) => {
		if (priority === 'high') return 'bg-error/70';
		if (priority === 'medium') return 'bg-warning/80';
		if (priority === 'low') return 'bg-info/60';
		return 'bg-border';
	};

	const progressTone = (value: string | null | undefined) => {
		switch (value) {
			case 'achieved':
				return 'bg-success/10 text-success-strong border-success/20';
			case 'good_progress':
				return 'bg-brand/10 text-brand-strong border-brand/20';
			case 'limited_progress':
				return 'bg-warning/15 text-warning-strong border-warning/25';
			case 'blocked':
				return 'bg-secondary/10 text-secondary-strong border-secondary/20';
			case 'regression':
				return 'bg-error/10 text-error-strong border-error/20';
			case 'no_progress':
				return 'bg-bg text-text-muted border-border';
			default:
				return 'bg-bg text-text-subtle border-border';
		}
	};

	const progressDot = (value: string | null | undefined) => {
		switch (value) {
			case 'achieved':
				return 'bg-success';
			case 'good_progress':
				return 'bg-brand';
			case 'limited_progress':
				return 'bg-warning';
			case 'blocked':
				return 'bg-secondary';
			case 'regression':
				return 'bg-error';
			case 'no_progress':
				return 'bg-text-subtle';
			default:
				return 'bg-border';
		}
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

	const handleEvaluationMutationError = async (error: unknown) => {
		if (!(error instanceof ApiClientError) || !isEvaluationErrorCode(error.code)) {
			formError = m.failed_save_evaluation();
			return;
		}

		if (isEvaluationMutationErrorData(error.data) && error.data.draft_saved) {
			if (error.data.evaluation) {
				evaluation = error.data.evaluation;
				mode = 'edit_draft';
				const savedData = evaluationFormData(error.data.evaluation, $form.items);
				reset({ data: savedData });
				initialSnapshot = evaluationFormSnapshot(savedData);
			}
			if (error.data.evaluation) {
				const refreshed = await notifySaved(error.data.evaluation);
				if (!refreshed) toast.warning(m.evaluation_saved_refresh_failed());
			}
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
				return m.not_available_short();
		}
	};

	const priorityLabel = (priority: 'high' | 'medium' | 'low') => {
		if (priority === 'high') return m.high();
		if (priority === 'medium') return m.medium();
		return m.low();
	};

	const isCurrentLoad = (sequence: number, controller: AbortController) =>
		sequence === loadSequence && loadController === controller && !controller.signal.aborted;

	const cancelEvaluationLoad = () => {
		loadController?.abort();
		loadController = null;
		loadSequence += 1;
	};

	const loadByEvaluationId = async (id: string, sequence: number, controller: AbortController) => {
		const response = await getGoalEvaluation(id, { signal: controller.signal });
		let nextBootstrap: EvaluationBootstrapResponse | null = null;
		const nextMode: Mode = response.data.status === 'draft' ? 'edit_draft' : 'view_only';

		if (response.data.status === 'draft') {
			const bootstrapResponse = await getEvaluationBootstrap(response.data.client_id, {
				signal: controller.signal
			});
			nextBootstrap = bootstrapResponse.data;
		}

		if (!isCurrentLoad(sequence, controller)) return false;
		evaluation = response.data;
		bootstrap = nextBootstrap;
		mode = nextMode;

		const preferredItems = (nextBootstrap?.active_goals ?? []).map((goal) => ({
			goal_id: goal.goal_id,
			progress: 'not_evaluated' as const,
			notes: ''
		}));
		const initialData = evaluationFormData(response.data, preferredItems);
		reset({ data: initialData });
		initialSnapshot = evaluationFormSnapshot(initialData);
		return true;
	};

	const loadBootstrap = async (
		requestedClientId: string,
		sequence: number,
		controller: AbortController
	) => {
		const response = await getEvaluationBootstrap(requestedClientId, {
			signal: controller.signal
		});
		if (!isCurrentLoad(sequence, controller)) return false;

		if (
			response.data.existing_draft?.id &&
			response.data.next_evaluation_date &&
			isSameDateOnly(
				response.data.existing_draft.evaluation_date,
				response.data.next_evaluation_date
			)
		) {
			return loadByEvaluationId(response.data.existing_draft.id, sequence, controller);
		}

		bootstrap = response.data;
		evaluation = null;
		mode = 'create_new';
		const initialData: EvaluationInput = {
			overall_notes: '',
			submit: false,
			items: response.data.active_goals.map((goal) => ({
				goal_id: goal.goal_id,
				progress: 'not_evaluated',
				notes: ''
			}))
		};
		reset({ data: initialData });
		initialSnapshot = evaluationFormSnapshot(initialData);
		return true;
	};

	const runEvaluationLoad = async (
		requestedEvaluationId: string | null,
		requestedClientId: string | null
	) => {
		cancelEvaluationLoad();
		const controller = new AbortController();
		const sequence = loadSequence;
		loadController = controller;
		isLoading = true;
		formError = '';

		try {
			if (requestedEvaluationId) {
				return await loadByEvaluationId(requestedEvaluationId, sequence, controller);
			}
			if (requestedClientId) {
				return await loadBootstrap(requestedClientId, sequence, controller);
			}
			return false;
		} catch (error) {
			if (isCurrentLoad(sequence, controller)) {
				formError = localizedEvaluationLoadError(error);
			}
			return false;
		} finally {
			if (isCurrentLoad(sequence, controller)) {
				isLoading = false;
				loadController = null;
			}
		}
	};

	const reloadConflictEvaluation = async () => {
		const id = conflictEvaluation?.id ?? evaluation?.id;
		if (!id || isLoading) return;
		const loaded = await runEvaluationLoad(id, null);
		if (!loaded) return;
		conflictEvaluation = null;
		showConflictReloadConfirmation = false;
	};

	const openCurrentCycleDraft = async () => {
		const currentDraftId = bootstrap?.existing_draft?.id;
		if (!currentDraftId || currentDraftId === evaluation?.id) return;
		currentCycleConflict = false;
		conflictEvaluation = null;
		showConflictReloadConfirmation = false;
		await runEvaluationLoad(currentDraftId, null);
	};

	const resetWorkflow = () => {
		cancelEvaluationLoad();
		bootstrap = null;
		evaluation = null;
		mode = 'create_new';
		formError = '';
		isLoading = false;
		isSubmitting = false;
		submissionIntent = null;
		showDiscardConfirmation = false;
		initialSnapshot = '';
		currentCycleConflict = false;
		conflictEvaluation = null;
		showConflictReloadConfirmation = false;
		contextInitializedForSession = false;
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
			if (!contextInitializedForSession && typeof window !== 'undefined') {
				showContext = window.matchMedia('(min-width: 1280px)').matches;
				contextInitializedForSession = true;
			}
			void runEvaluationLoad(evaluationId, clientId);
		}
		return cancelEvaluationLoad;
	});
</script>

<Modal
	bind:open
	size="4xl"
	title={modalTitle}
	description={modalDescription}
	closeLabel={m.close()}
	loading={isLoading}
	loadingLabel={m.loading_evaluation_form()}
	dismissible={!isSubmitting}
	onRequestClose={requestClose}
	onClose={resetWorkflow}
>
	{#if !bootstrap && !evaluation}
		<div class="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error" role="alert">
			{m.unable_load_evaluation_data()}
		</div>
	{:else}
		<form onsubmit={(event) => event.preventDefault()} class="space-y-5">
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

			<!-- Identity strip: subtle professional color, no heavy card -->
			<div
				class="relative overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/[0.09] via-secondary/[0.06] to-transparent px-5 py-4"
			>
				<div
					class="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-secondary/15 blur-2xl"
				></div>
				<div class="relative flex flex-wrap items-center justify-between gap-3">
					<div class="flex min-w-0 items-center gap-3">
						<span
							class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-sm"
						>
							{(
								clientName ??
								(bootstrap ? `${bootstrap.client_first_name} ${bootstrap.client_last_name}` : '?')
							)
								.trim()
								.charAt(0)
								.toUpperCase()}
						</span>
						<div class="min-w-0">
							<p class="text-[11px] font-bold tracking-widest text-brand-strong uppercase">
								{m.client()}
							</p>
							<h3 class="truncate text-lg font-bold tracking-tight text-text">
								{clientName ??
									(bootstrap
										? `${bootstrap.client_first_name} ${bootstrap.client_last_name}`
										: m.client())}
							</h3>
						</div>
					</div>
					{#if bootstrap}
						<div
							class="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-semibold text-text-muted"
						>
							<CalendarClock class="h-3.5 w-3.5 text-brand" />
							{#if bootstrap.next_evaluation_date}
								{m.days_left({ days: bootstrap.days_left ?? 0 })}
							{:else}
								{m.no_due_date_scheduled()}
							{/if}
						</div>
					{/if}
				</div>
				{#if mode === 'edit_draft' && !isReadOnly && (evaluation || bootstrap?.existing_draft)}
					<div
						class="relative mt-3 inline-flex items-center gap-2 rounded-full border border-info/20 bg-info/10 px-3 py-1 text-xs font-semibold text-info-strong"
					>
						<FileClock class="h-3.5 w-3.5" />
						{m.continuing_draft_from({
							date: new Date(
								evaluation?.updated_at ?? bootstrap?.existing_draft?.updated_at ?? Date.now()
							).toLocaleDateString(resolveLocale())
						})}
					</div>
				{/if}
			</div>

			{#snippet contextBody()}
				{#if bootstrap?.last_completed_evaluation}
					<dl class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
						<div>
							<dt class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">
								{m.evaluation_date()}
							</dt>
							<dd class="mt-0.5 font-semibold text-text">
								{formatDateOnly(
									bootstrap.last_completed_evaluation.evaluation_date,
									resolveLocale(),
									m.not_available_short()
								)}
							</dd>
						</div>
						<div>
							<dt class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">
								{m.created_by()}
							</dt>
							<dd class="mt-0.5 font-semibold text-text">
								{bootstrap.last_completed_evaluation.creator_name ?? m.not_available_short()}
							</dd>
						</div>
					</dl>
					<p class="mt-1 text-xs text-text-subtle">
						{new Date(bootstrap.last_completed_evaluation.submitted_at).toLocaleString(
							resolveLocale()
						)}
					</p>

					<blockquote
						class="mt-4 border-l-2 border-brand/40 pl-3 text-sm leading-relaxed text-text"
					>
						{bootstrap.last_completed_evaluation.overall_notes ?? m.no_notes_available()}
					</blockquote>

					<div class="mt-5 space-y-5 border-t border-dashed border-border pt-5">
						{#each viewGoals as goal (goal.goal_id)}
							<article>
								<div class="flex items-start justify-between gap-3">
									<p class="text-[13px] leading-snug font-semibold text-text">{goal.title}</p>
									<span
										class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold {progressTone(
											goal.last_progress
										)}"
									>
										<span class="h-1.5 w-1.5 rounded-full {progressDot(goal.last_progress)}"></span>
										{progressLabel(goal.last_progress)}
									</span>
								</div>
								<p class="mt-1 text-xs text-text-subtle">
									{goal.topic_name_snapshot ?? m.not_available_short()}
								</p>
								<p class="mt-2 text-[13px] leading-relaxed text-text-muted">
									{goal.last_notes ?? m.no_notes_available()}
								</p>
							</article>
						{/each}
					</div>
				{:else}
					<div
						class="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-text-muted"
					>
						{m.no_previous_evaluation_found()}
					</div>
				{/if}
			{/snippet}

			{#if showLastEvaluation}
				<div class="xl:hidden">
					<button
						type="button"
						onclick={() => (showContext = true)}
						aria-haspopup="dialog"
						aria-expanded={showContext}
						class="flex w-full items-center gap-3 rounded-2xl bg-bg/60 px-4 py-3 text-left ring-1 ring-border/60 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
					>
						<span
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary-strong"
						>
							<History class="h-4 w-4" />
						</span>
						<span class="min-w-0 flex-1">
							<span class="block text-xs font-bold tracking-widest text-text-muted uppercase">
								{m.last_evaluation()}
							</span>
							<span class="mt-0.5 block truncate text-[13px] text-text-subtle">
								{m.last_evaluation_context()}
							</span>
						</span>
						<span
							class="inline-flex shrink-0 items-center rounded-full border border-border bg-surface px-2 py-1 text-[11px] font-bold text-text-muted"
						>
							{viewGoals.length}
						</span>
						<PanelLeftOpen class="h-4 w-4 shrink-0 text-text-subtle" />
					</button>
				</div>
			{/if}

			<div
				class="grid grid-cols-1 items-start gap-8 {showLastEvaluation && showContext
					? 'xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'
					: ''}"
			>
				{#if showLastEvaluation && showContext}
					<!-- Desktop reference rail: inline sidebar, collapses left-to-right -->
					<aside
						class="hidden rounded-2xl bg-bg/60 px-5 py-5 ring-1 ring-border/60 xl:sticky xl:top-0 xl:block"
					>
						<div class="flex items-center gap-2">
							<span class="h-5 w-1 rounded-full bg-secondary/70"></span>
							<p class="text-xs font-bold tracking-widest text-text-muted uppercase">
								{m.last_evaluation()}
							</p>
							<span
								class="ml-auto inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-bold text-text-muted"
							>
								{viewGoals.length}
							</span>
						</div>
						<p class="mt-1.5 text-[13px] leading-relaxed text-text-subtle">
							{m.last_evaluation_context()}
						</p>
						{@render contextBody()}
					</aside>
				{/if}

				<!-- Writing surface: document-like, goals separated by hairlines -->
				<section class="min-w-0">
					<div class="flex items-center gap-2">
						<span class="h-5 w-1 rounded-full bg-brand/70"></span>
						<h4 class="text-xs font-bold tracking-widest text-text-muted uppercase">
							{m.current_evaluation()}
						</h4>
						{#if showLastEvaluation}
							<button
								type="button"
								onclick={() => (showContext = !showContext)}
								aria-pressed={showContext}
								class="ml-auto hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-bold text-text-muted transition-colors hover:text-text xl:inline-flex"
							>
								<PanelLeftOpen class="h-3.5 w-3.5" />
								{m.last_evaluation()}
							</button>
						{/if}
					</div>
					<div class="mt-3">
						<Textarea
							label={m.overall_notes()}
							placeholder={m.placeholder_overall_notes()}
							disabled={isReadOnly}
							bind:value={$form.overall_notes}
						/>
					</div>

					<div class="mt-2 divide-y divide-dashed divide-border">
						{#each viewGoals as goal, i (goal.goal_id)}
							<section class="relative py-6 pl-4 first:pt-4 last:pb-0">
								<span
									class="absolute top-6 bottom-6 left-0 w-[3px] rounded-full {priorityBar(
										goal.priority
									)}"
								></span>
								<div class="mb-3 flex flex-wrap items-center gap-2">
									<span
										class="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/10 text-[11px] font-bold text-brand-strong"
									>
										{i + 1}
									</span>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-semibold text-text">{goal.title}</p>
										<p class="text-xs text-text-subtle">
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
										<div>
											<p class="mb-1.5 text-xs font-bold tracking-wide text-text-subtle uppercase">
												{m.progress()}
											</p>
											<span
												class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold {progressTone(
													$form.items[goal.formIndex]?.progress
												)}"
											>
												<span
													class="h-1.5 w-1.5 rounded-full {progressDot(
														$form.items[goal.formIndex]?.progress
													)}"
												></span>
												{progressLabel($form.items[goal.formIndex]?.progress ?? 'no_progress')}
											</span>
										</div>
										<Textarea
											label={m.notes_label()}
											disabled={true}
											value={$form.items[goal.formIndex]?.notes ?? ''}
										/>
									{:else if $form.items[goal.formIndex]}
										<Select
											label={m.progress()}
											options={progressOptions}
											placeholder={m.select_progress()}
											bind:value={$form.items[goal.formIndex].progress}
										/>
										<Textarea
											label={m.notes_label()}
											placeholder={m.placeholder_goal_notes()}
											bind:value={$form.items[goal.formIndex].notes}
										/>
									{/if}
								</div>
							</section>
						{/each}
					</div>
				</section>
			</div>

			{#if showLastEvaluation && showContext}
				<!-- Mobile drawer: slides in from the left, form keeps full width underneath -->
				<div class="xl:hidden">
					<button
						type="button"
						tabindex="-1"
						aria-label={m.close()}
						class="fixed inset-0 z-[69] bg-text/40 backdrop-blur-[2px]"
						transition:fade={{ duration: 200 }}
						onclick={() => (showContext = false)}
					></button>
					<div
						role="dialog"
						aria-modal="false"
						aria-label={m.last_evaluation()}
						class="fixed inset-y-0 left-0 z-[70] flex w-[88vw] max-w-sm flex-col bg-surface shadow-2xl ring-1 ring-border"
						transition:fly={{ x: -320, duration: 250 }}
					>
						<div class="flex items-center gap-3 border-b border-border px-5 py-4">
							<span class="h-5 w-1 shrink-0 rounded-full bg-secondary/70"></span>
							<span class="min-w-0 flex-1">
								<span class="block text-xs font-bold tracking-widest text-text-muted uppercase">
									{m.last_evaluation()}
								</span>
								<span class="mt-0.5 block truncate text-[13px] text-text-subtle">
									{m.last_evaluation_context()}
								</span>
							</span>
							<button
								type="button"
								onclick={() => (showContext = false)}
								aria-label={m.close()}
								class="rounded-full p-2 text-text-subtle transition-colors hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
							>
								<X class="h-5 w-5" />
							</button>
						</div>
						<div class="flex-1 overflow-y-auto px-5 py-5">
							{@render contextBody()}
						</div>
					</div>
				</div>
			{/if}
		</form>
	{/if}

	{#snippet footer()}
		{#if !bootstrap && !evaluation}
			<div class="flex justify-end">
				<Button variant="ghost" onclick={closeAndReset}>{m.close()}</Button>
			</div>
		{:else if isReadOnly}
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
						variant="ghost"
						class="border border-secondary/40 bg-secondary/10 text-secondary hover:bg-secondary/20"
						onclick={() => saveEvaluation(false)}
						isLoading={isSubmitting && submissionIntent === 'draft'}
						disabled={isSubmitting}>{m.save_draft()}</Button
					>
					<Button
						onclick={() => saveEvaluation(true)}
						isLoading={isSubmitting && submissionIntent === 'submit'}
						disabled={isSubmitting}>{m.submit()}</Button
					>
				</div>
			</div>
		{/if}
	{/snippet}
</Modal>
