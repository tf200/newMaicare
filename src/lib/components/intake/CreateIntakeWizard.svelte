<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import {
		Activity,
		ArrowRight,
		Calendar,
		Clock,
		FileText,
		Loader2,
		Plus,
		Save,
		User
	} from 'lucide-svelte';
	import CreateSenderForm from '$lib/components/forms/CreateSenderForm.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import TextArea from '$lib/components/ui/Textarea.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import GoalAssessmentForm from './GoalAssessmentForm.svelte';
	import { listSenders } from '$lib/api/senders';
	import { listLocations } from '$lib/api/locations';
	import { intakes } from '$lib/api/intakes';
	import { createIntakeSchema, type IntakeSchemaInput } from '$lib/schemas/intake';
	import { formatFormError } from '$lib/utils/form-errors';
	import type {
		CreateIntakeRequest,
		GetRegistrationFormResponse,
		IntakeCareType,
		IntakeConclusionEnum,
		IntakeGoalTopic,
		IntakeParticipantsEnum,
		OrganizationLocation,
		SenderListItem
	} from '$lib/types/api';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		open?: boolean;
		registration: GetRegistrationFormResponse;
		onCreated?: (id: string) => void;
	}

	type WorkflowPhase = 'details' | 'creating' | 'goals' | 'saving-goals' | 'partial-success';
	type CreateIntent = 'goals' | 'finish';
	type GoalFormHandle = { validate: () => boolean };

	let { open = $bindable(false), registration, onCreated }: Props = $props();

	const schema = createIntakeSchema({
		required: m.intake_validation_required(),
		participantsRequired: m.intake_validation_participant(),
		integer: m.intake_validation_integer(),
		selfSufficiencyRange: m.intake_validation_self_sufficiency(),
		evaluationIntervalRange: m.intake_validation_evaluation_interval(),
		levelRange: m.intake_validation_level()
	});

	const buildInitialData = (): IntakeSchemaInput => ({
		date_of_intake: new Date().toISOString(),
		care_type: 'protected_living',
		intake_participants: [],
		family_situation: '',
		psychological_state: '',
		self_sufficiency: 0,
		evaluation_interval_weeks: 1,
		sender_id: '',
		assigned_location_id: '',
		risk_assessment: registration.risk_additional_notes ?? '',
		intake_conclusion: 'suitable',
		intake_conclusion_notes: '',
		signature: ''
	});

	let phase = $state<WorkflowPhase>('details');
	let errorMessage = $state('');
	let createdIntakeId = $state<string | null>(null);
	let senderName = $state('');
	let showCreateSender = $state(false);
	let goals = $state<IntakeGoalTopic[]>([]);
	let goalForm = $state<GoalFormHandle>();
	let createIntent = $state<CreateIntent | null>(null);
	let createRequested = $state(false);
	let sessionSequence = 0;
	let operationSequence = 0;
	let previousOpen = open;

	const isMutating = $derived(phase === 'creating' || phase === 'saving-goals');
	const showGoals = $derived(
		phase === 'goals' || phase === 'saving-goals' || phase === 'partial-success'
	);

	const { form, errors, enhance, reset } = superForm(
		defaults(buildInitialData(), valibotClient(schema)),
		{
			validators: valibotClient(schema),
			SPA: true,
			dataType: 'json',
			onSubmit: ({ submitter, cancel }) => {
				const intent = submitter?.getAttribute('data-create-intent');
				if (
					(intent !== 'goals' && intent !== 'finish') ||
					createRequested ||
					isMutating ||
					createdIntakeId
				) {
					cancel();
					return;
				}

				createIntent = intent;
				createRequested = true;
				errorMessage = '';
			},
			onUpdate: async ({ form: result }) => {
				if (!result.valid) {
					createRequested = false;
					createIntent = null;
					errorMessage = m.intake_fix_form_errors();
					return;
				}
				if (!createRequested || createdIntakeId || !createIntent) return;
				await createIntake(result.data);
			}
		}
	);

	function resetWorkflow() {
		sessionSequence += 1;
		operationSequence += 1;
		phase = 'details';
		errorMessage = '';
		createdIntakeId = null;
		senderName = '';
		showCreateSender = false;
		goals = [];
		createIntent = null;
		createRequested = false;
		reset({ data: buildInitialData() });
	}

	$effect(() => {
		if (open && !previousOpen) resetWorkflow();
		if (!open && previousOpen) {
			sessionSequence += 1;
			operationSequence += 1;
			createRequested = false;
		}
		previousOpen = open;
	});

	async function createIntake(data: IntakeSchemaInput) {
		if (phase === 'creating' || createdIntakeId || !createIntent) return;
		const intent = createIntent;
		const session = sessionSequence;
		const operation = ++operationSequence;
		phase = 'creating';
		errorMessage = '';

		const payload: CreateIntakeRequest = {
			registration_form_id: registration.id,
			date_of_intake: data.date_of_intake,
			care_type: data.care_type,
			intake_participants: data.intake_participants,
			family_situation: data.family_situation,
			psychological_state: data.psychological_state,
			self_sufficiency: data.self_sufficiency,
			evaluation_interval_weeks: data.evaluation_interval_weeks,
			sender_id: data.sender_id,
			assigned_location_id: data.assigned_location_id,
			risk_assessment: data.risk_assessment,
			intake_conclusion: data.intake_conclusion,
			intake_conclusion_notes: data.intake_conclusion_notes,
			signature: data.signature
		};

		try {
			const response = await intakes.create(payload);
			if (!open || session !== sessionSequence || operation !== operationSequence) return;
			createdIntakeId = response.data.id;
			onCreated?.(response.data.id);
			if (!open || session !== sessionSequence || operation !== operationSequence) return;
			if (intent === 'finish') {
				open = false;
				return;
			}
			phase = 'goals';
		} catch (error) {
			if (!open || session !== sessionSequence || operation !== operationSequence) return;
			console.error('Failed to create intake:', error);
			phase = 'details';
			errorMessage = m.intake_create_error();
		} finally {
			if (session === sessionSequence && operation === operationSequence) {
				createRequested = false;
				createIntent = null;
			}
		}
	}

	async function saveGoals() {
		if (!createdIntakeId || phase === 'saving-goals' || !goalForm?.validate()) return;
		const intakeId = createdIntakeId;
		const session = sessionSequence;
		const operation = ++operationSequence;
		phase = 'saving-goals';
		errorMessage = '';

		try {
			await intakes.updateGoals(intakeId, {
				assessments: goals.map((goal) => ({
					topic_id: goal.topic_id,
					current_level: goal.current_level,
					proposed_goals: goal.proposed_goals.map((item) => ({
						...item,
						title: item.title.trim(),
						description: item.description.trim()
					})),
					notes: goal.notes?.trim() || null
				}))
			});
			if (!open || session !== sessionSequence || operation !== operationSequence) return;
			open = false;
		} catch (error) {
			if (!open || session !== sessionSequence || operation !== operationSequence) return;
			console.error('Failed to save intake goals:', error);
			phase = 'partial-success';
			errorMessage = '';
		}
	}

	function finishLater() {
		if (isMutating || !createdIntakeId) return;
		open = false;
	}

	function handleSenderCreated(sender: SenderListItem) {
		$form.sender_id = sender.id;
		senderName = sender.name;
	}

	const careTypeOptions: { value: IntakeCareType; label: string }[] = [
		{ value: 'protected_living', label: m.protected_living() },
		{ value: 'training_center', label: m.intake_care_training_center() },
		{
			value: 'supported_independent_living',
			label: m.intake_care_supported_independent_living()
		},
		{ value: 'ambulatory_support', label: m.intake_care_ambulatory_support() },
		{ value: 'other', label: m.other() }
	];

	const participantOptions: { value: IntakeParticipantsEnum; label: string }[] = [
		{ value: 'client', label: m.client() },
		{ value: 'referrer', label: m.referrer() },
		{ value: 'parents/guardians', label: m.parents_guardians() },
		{ value: 'care_coordinator', label: m.care_coordinator() },
		{ value: 'other', label: m.other() }
	];

	const conclusionOptions: { value: IntakeConclusionEnum; label: string }[] = [
		{ value: 'suitable', label: m.suitable() },
		{ value: 'unsuitable', label: m.unsuitable() },
		{ value: 'further_investigation', label: m.further_investigation() },
		{ value: 'possible_palcement_date', label: m.possible_placement_date() },
		{ value: 'other', label: m.other() }
	];
</script>

{#snippet senderItem(option: SenderListItem)}
	<div class="flex min-w-0 flex-col py-0.5">
		<span class="font-medium break-words text-text">{option.name}</span>
		<div class="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
			{#if option.city}<span>{option.city}</span><span aria-hidden="true">&middot;</span>{/if}
			<span>{option.types?.replace(/_/g, ' ') || m.sender()}</span>
		</div>
	</div>
{/snippet}

{#snippet locationItem(option: OrganizationLocation)}
	<div class="flex min-w-0 flex-col py-0.5">
		<span class="font-medium break-words text-text">{option.name}</span>
		<div class="flex flex-col gap-0.5 text-xs text-text-muted">
			<span class="break-words">{option.street} {option.house_number}, {option.city}</span>
			<span class={option.available > 0 ? 'font-medium text-success' : 'font-medium text-error'}>
				{m.spots_available({ count: option.available })}
			</span>
		</div>
	</div>
{/snippet}

<Modal
	bind:open
	title={m.create_intake()}
	description={m.intake_for_client({
		name: `${registration.client_first_name} ${registration.client_last_name}`.trim()
	})}
	closeLabel={m.close()}
	dismissible={!isMutating}
	size="full"
	class="max-w-full overflow-hidden sm:max-w-7xl"
>
	<div class="space-y-6">
		{#if errorMessage}
			<div
				class="rounded-xl border border-error/30 bg-error/10 p-4 text-sm font-medium text-error"
				role="alert"
			>
				{errorMessage}
			</div>
		{/if}

		{#if phase === 'partial-success'}
			<div class="rounded-2xl border border-warning/40 bg-warning/10 p-4" role="status">
				<h2 class="font-bold text-text">{m.intake_partial_success_title()}</h2>
				<p class="mt-1 text-sm text-text-muted">{m.intake_partial_success_description()}</p>
				<div class="mt-4 flex flex-wrap gap-2">
					<button
						type="button"
						onclick={saveGoals}
						class="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						{m.retry()}
					</button>
					<button
						type="button"
						onclick={finishLater}
						class="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-text hover:bg-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
					>
						{m.intake_finish_later()}
					</button>
				</div>
			</div>
		{/if}

		{#if !showGoals}
			<form method="POST" novalidate use:enhance class="grid gap-6 lg:grid-cols-2">
				<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
					<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
						<div class="rounded-xl bg-brand/10 p-2.5 text-brand">
							<User class="h-6 w-6" aria-hidden="true" />
						</div>
						<div>
							<h2 class="text-xl font-bold text-text">{m.client_situation()}</h2>
							<p class="text-sm text-text-subtle">{m.client_situation_description()}</p>
						</div>
					</div>
					<div class="space-y-5">
						<TextArea
							id="family-situation"
							label={m.family_situation()}
							bind:value={$form.family_situation}
							error={$errors.family_situation?.[0]}
							placeholder={m.family_situation_placeholder()}
							rows={4}
						/>
						<TextArea
							id="psychological-state"
							label={m.psychological_state()}
							bind:value={$form.psychological_state}
							error={$errors.psychological_state?.[0]}
							placeholder={m.psychological_state_placeholder()}
							rows={4}
						/>
						<Input
							id="self-sufficiency"
							type="number"
							label={m.self_sufficiency_score_range()}
							bind:value={$form.self_sufficiency}
							error={$errors.self_sufficiency?.[0]}
							min="0"
							max="100"
							step="1"
						/>
					</div>
				</section>

				<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
					<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
						<div class="rounded-xl bg-info/10 p-2.5 text-info">
							<FileText class="h-6 w-6" aria-hidden="true" />
						</div>
						<div>
							<h2 class="text-xl font-bold text-text">{m.logistics_placement()}</h2>
							<p class="text-sm text-text-subtle">{m.logistics_assignment_description()}</p>
						</div>
					</div>
					<div class="grid gap-5 sm:grid-cols-2">
						<div class="space-y-2">
							<label
								class="flex items-center gap-1.5 text-sm font-semibold text-text-muted"
								for="intake-date"
								><Calendar class="h-3.5 w-3.5" aria-hidden="true" />{m.intake_date()}</label
							>
							<DateTimePicker
								id="intake-date"
								bind:value={$form.date_of_intake}
								error={$errors.date_of_intake?.[0]}
							/>
						</div>
						<Input
							id="intake-signature"
							label={m.signature_full_name()}
							bind:value={$form.signature}
							error={$errors.signature?.[0]}
							placeholder={m.signature_full_name_placeholder()}
						/>
						<div class="space-y-2">
							<label for="care-type" class="text-sm font-semibold text-text-muted"
								>{m.care_type()}</label
							>
							<select
								id="care-type"
								bind:value={$form.care_type}
								aria-invalid={$errors.care_type ? 'true' : undefined}
								aria-describedby={$errors.care_type ? 'care-type-error' : undefined}
								class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
							>
								{#each careTypeOptions as option (option.value)}<option value={option.value}
										>{option.label}</option
									>{/each}
							</select>
							{#if $errors.care_type}<p id="care-type-error" class="text-xs font-medium text-error">
									{$errors.care_type[0]}
								</p>{/if}
						</div>
						<div class="sm:col-span-2">
							<MultiSelect
								id="intake-participants"
								label={m.participants()}
								bind:value={$form.intake_participants}
								options={participantOptions}
								error={formatFormError($errors.intake_participants) || undefined}
								placeholder={m.select_participants_placeholder()}
							/>
						</div>
						<div class="space-y-2">
							<SearchSelect
								label={m.referrer_sender()}
								bind:value={$form.sender_id}
								bind:displayValue={senderName}
								error={$errors.sender_id?.[0]}
								loadOptions={async (query) =>
									(await listSenders({ search: query, pageSize: 50 })).data.results}
								labelFn={(sender: SenderListItem) => sender.name}
								valueFn={(sender: SenderListItem) => sender.id}
								item={senderItem}
								placeholder={m.select_sender_placeholder()}
							/>
							<PermissionGuard permission="SENDER.CREATE">
								<button
									type="button"
									onclick={() => (showCreateSender = true)}
									disabled={createRequested || isMutating}
									class="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-brand transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									<Plus class="h-4 w-4" aria-hidden="true" />
									{m.add_sender()}
								</button>
							</PermissionGuard>
						</div>
						<SearchSelect
							label={m.assigned_location()}
							bind:value={$form.assigned_location_id}
							error={$errors.assigned_location_id?.[0]}
							loadOptions={async (query) =>
								(await listLocations({ search: query, pageSize: 50 })).data.results}
							labelFn={(location: OrganizationLocation) => `${location.name} (${location.city})`}
							valueFn={(location: OrganizationLocation) => location.id}
							item={locationItem}
							placeholder={m.select_location_placeholder()}
						/>
					</div>
				</section>

				<section
					class="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7 lg:col-span-2"
				>
					<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
						<div class="rounded-xl bg-secondary/10 p-2.5 text-secondary">
							<Activity class="h-6 w-6" aria-hidden="true" />
						</div>
						<div>
							<h2 class="text-xl font-bold text-text">{m.initial_assessment()}</h2>
							<p class="text-sm text-text-subtle">{m.initial_assessment_description()}</p>
						</div>
					</div>
					<div class="grid gap-5 md:grid-cols-2">
						<div class="md:col-span-2">
							<TextArea
								id="risk-assessment"
								label={m.risk_assessment()}
								bind:value={$form.risk_assessment}
								error={$errors.risk_assessment?.[0]}
								placeholder={m.risk_assessment_placeholder()}
								rows={4}
							/>
						</div>
						<div class="space-y-2">
							<label for="intake-conclusion" class="text-sm font-semibold text-text-muted"
								>{m.intake_conclusion()}</label
							>
							<select
								id="intake-conclusion"
								bind:value={$form.intake_conclusion}
								aria-invalid={$errors.intake_conclusion ? 'true' : undefined}
								aria-describedby={$errors.intake_conclusion ? 'intake-conclusion-error' : undefined}
								class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
							>
								{#each conclusionOptions as option (option.value)}<option value={option.value}
										>{option.label}</option
									>{/each}
							</select>
							{#if $errors.intake_conclusion}<p
									id="intake-conclusion-error"
									class="text-xs font-medium text-error"
								>
									{$errors.intake_conclusion[0]}
								</p>{/if}
						</div>
						<Input
							id="evaluation-weeks"
							type="number"
							label={m.evaluation_interval_weeks()}
							bind:value={$form.evaluation_interval_weeks}
							error={$errors.evaluation_interval_weeks?.[0]}
							min="1"
							step="1"
							placeholder={m.placeholder_weeks_example()}
						/>
						<div class="md:col-span-2">
							<TextArea
								id="conclusion-notes"
								label={`${m.additional_notes()} (${m.optional()})`}
								bind:value={$form.intake_conclusion_notes}
								error={$errors.intake_conclusion_notes?.[0]}
								placeholder={m.additional_notes_placeholder()}
								rows={3}
							/>
						</div>
					</div>
				</section>

				<section class="rounded-3xl border border-border bg-bg p-5 sm:p-7 lg:col-span-2">
					<div class="mb-4">
						<h2 class="text-xl font-bold text-text">
							{m.goals_assessments()}
							<span class="text-sm font-semibold text-text-subtle">({m.optional()})</span>
						</h2>
						<p class="mt-1 text-sm text-text-subtle">{m.assessments_optional_description()}</p>
					</div>
					<div class="grid gap-3 md:grid-cols-2">
						<button
							type="submit"
							data-create-intent="goals"
							disabled={createRequested || isMutating}
							class="flex min-h-28 items-center gap-4 rounded-2xl border border-brand/30 bg-surface p-5 text-left hover:border-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50"
						>
							<div class="min-w-0 flex-1">
								<span class="font-bold text-text">{m.define_now()}</span>
								<p class="mt-1 text-sm text-text-muted">{m.define_now_description()}</p>
							</div>
							{#if phase === 'creating' && createIntent === 'goals'}<Loader2
									class="h-5 w-5 animate-spin text-brand"
									aria-hidden="true"
								/>{:else}<ArrowRight class="h-5 w-5 text-brand" aria-hidden="true" />{/if}
						</button>
						<button
							type="submit"
							data-create-intent="finish"
							disabled={createRequested || isMutating}
							class="flex min-h-28 items-center gap-4 rounded-2xl border border-border bg-surface p-5 text-left hover:border-text-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50"
						>
							<Clock class="h-6 w-6 shrink-0 text-text-muted" aria-hidden="true" />
							<div class="min-w-0">
								<span class="font-bold text-text">{m.do_later()}</span>
								<p class="mt-1 text-sm text-text-muted">{m.do_later_description()}</p>
							</div>
						</button>
					</div>
				</section>
			</form>
		{:else if createdIntakeId}
			<div class="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
				<aside class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
					<h2 class="font-bold text-text">{m.registration_goals_reference()}</h2>
					{#if registration.client_goals?.length}
						<ul class="mt-4 space-y-2 text-sm text-text-muted">
							{#each registration.client_goals as goal (goal)}<li
									class="rounded-xl bg-bg px-3 py-2 break-words"
								>
									{goal}
								</li>{/each}
						</ul>
					{:else}<p class="mt-3 text-sm text-text-subtle">{m.no_goals_specified()}</p>{/if}
					{#if registration.application_reason}<h3
							class="mt-5 text-xs font-semibold tracking-wide text-text-subtle uppercase"
						>
							{m.reason_for_application()}
						</h3>
						<p class="mt-2 text-sm break-words text-text-muted">
							{registration.application_reason}
						</p>{/if}
				</aside>
				<section class="min-w-0 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
					<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 class="text-xl font-bold text-text">{m.goals_assessments()}</h2>
							<p class="text-sm text-text-subtle">{m.assessment_goals_description()}</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								onclick={finishLater}
								disabled={isMutating}
								class="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text hover:bg-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50"
								>{m.intake_finish_later()}</button
							>
							<button
								type="button"
								onclick={saveGoals}
								disabled={isMutating || goals.length === 0}
								class="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
							>
								{#if phase === 'saving-goals'}<Loader2
										class="h-4 w-4 animate-spin"
										aria-hidden="true"
									/>{:else}<Save class="h-4 w-4" aria-hidden="true" />{/if}{m.save_finish()}
							</button>
						</div>
					</div>
					<GoalAssessmentForm bind:this={goalForm} intakeId={createdIntakeId} bind:goals />
				</section>
			</div>
		{/if}
	</div>
</Modal>

<CreateSenderForm bind:open={showCreateSender} onCreated={handleSenderCreated} />
