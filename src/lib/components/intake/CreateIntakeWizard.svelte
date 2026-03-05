<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import TextArea from '$lib/components/ui/Textarea.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import GoalAssessmentForm from './GoalAssessmentForm.svelte';
	import { listSenders } from '$lib/api/senders';
	import { listLocations } from '$lib/api/locations';
	import { intakes } from '$lib/api/intakes';
	import { m } from '$lib/paraglide/messages';
	import {
		ArrowRight,
		Activity,
		Calendar,
		FileText,
		Loader2,
		User,
		ListChecks,
		Clock,
		Save
	} from 'lucide-svelte';
	import type {
		GetRegistrationFormResponse,
		IntakeCareType,
		IntakeParticipantsEnum,
		IntakeConclusionEnum,
		IntakeGoalTopic
	} from '$lib/types/api';

	interface Props {
		open?: boolean;
		registration: GetRegistrationFormResponse;
		onCreated?: (id: string) => void;
	}

	let { open = $bindable(false), registration, onCreated }: Props = $props();

	let activeStep = $state(0);

	let isLoading = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});
	let createdIntakeId = $state<string | null>(null);

	// Form State
	let dateOfIntake = $state(new Date().toISOString());
	let careType = $state<IntakeCareType>('protected_living');
	let intakeParticipants = $state<IntakeParticipantsEnum[]>([]);
	let familySituation = $state('');
	let psychologicalState = $state('');
	let selfSufficiency = $state(0);
	let evaluationIntervalWeeks = $state(0);
	let senderId = $state('');
	let senderName = $state('');
	let assignedLocationId = $state('');
	let riskAssessment = $state('');
	let intakeConclusion = $state<IntakeConclusionEnum>('suitable');
	let intakeConclusionNotes = $state('');
	let signature = $state('');

	let goals = $state<IntakeGoalTopic[]>([]);

	const careTypeOptions = [
		{ value: 'protected_living', label: 'Protected Living' },
		{ value: 'training_center', label: 'Training Center' },
		{ value: 'supported_independent_living', label: 'Supported Independent Living' },
		{ value: 'ambulatory_support', label: 'Ambulatory Support' },
		{ value: 'other', label: 'Other' }
	];

	const participantOptions = [
		{ value: 'client', label: 'Client' },
		{ value: 'referrer', label: 'Referrer' },
		{ value: 'parents/guardians', label: 'Parents/Guardians' },
		{ value: 'care_coordinator', label: 'Care Coordinator' },
		{ value: 'other', label: 'Other' }
	];

	const conclusionOptions = [
		{ value: 'suitable', label: 'Suitable' },
		{ value: 'unsuitable', label: 'Unsuitable' },
		{ value: 'further_investigation', label: 'Further Investigation' },
		{ value: 'possible_palcement_date', label: 'Possible Placement Date' },
		{ value: 'other', label: 'Other' }
	];

	const defaultRiskAssessment = $derived(registration.risk_additional_notes ?? '');

	$effect.pre(() => {
		if (!open) {
			activeStep = 0;
			error = '';
			isLoading = false;
			fieldErrors = {};
			createdIntakeId = null;
			dateOfIntake = new Date().toISOString();
			careType = 'protected_living';
			intakeParticipants = [];
			familySituation = '';
			psychologicalState = '';
			selfSufficiency = 0;
			evaluationIntervalWeeks = 0;
			senderId = '';
			senderName = '';
			assignedLocationId = '';
			riskAssessment = defaultRiskAssessment;
			intakeConclusion = 'suitable';
			intakeConclusionNotes = '';
			signature = '';
			goals = [];
		}
	});

	const validateStep1 = () => {
		const errors: Record<string, string> = {};
		if (!familySituation) errors.familySituation = 'Family situation is required';
		if (!psychologicalState) errors.psychologicalState = 'Psychological state is required';
		if (selfSufficiency < 0 || selfSufficiency > 100)
			errors.selfSufficiency = 'Must be between 0-100';
		if (evaluationIntervalWeeks <= 0) errors.evaluationIntervalWeeks = 'Must be at least 1 week';
		if (!dateOfIntake) errors.dateOfIntake = 'Date is required';
		if (!careType) errors.careType = 'Care type is required';
		if (intakeParticipants.length === 0)
			errors.intakeParticipants = 'At least one participant is required';
		if (!senderId) errors.senderId = 'Sender is required';
		if (!assignedLocationId) errors.assignedLocationId = 'Location is required';
		if (!riskAssessment) errors.riskAssessment = 'Risk assessment is required';
		if (!intakeConclusion) errors.intakeConclusion = 'Conclusion is required';
		if (!intakeConclusionNotes) errors.intakeConclusionNotes = 'Notes are required';
		if (!signature) errors.signature = 'Signature is required';

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	};

	const createIntake = async () => {
		if (isLoading) return null;
		if (!validateStep1()) {
			error = 'Please fix errors in Step 1.';
			if (activeStep !== 0) activeStep = 0;
			return null;
		}

		isLoading = true;
		error = '';

		try {
			const res = await intakes.create({
				registration_form_id: registration.id,
				date_of_intake: dateOfIntake,
				care_type: careType,
				intake_participants: intakeParticipants,
				family_situation: familySituation,
				psychological_state: psychologicalState,
				self_sufficiency: Number(selfSufficiency),
				evaluation_interval_weeks: Number(evaluationIntervalWeeks),
				sender_id: senderId,
				assigned_location_id: assignedLocationId,
				risk_assessment: riskAssessment,
				intake_conclusion: intakeConclusion,
				intake_conclusion_notes: intakeConclusionNotes,
				signature
			});
			createdIntakeId = res.data.id;
			onCreated?.(res.data.id);
			return res.data.id;
		} catch (e) {
			console.error(e);
			error = e instanceof Error ? e.message : 'Failed to create intake.';
			return null;
		} finally {
			isLoading = false;
		}
	};

	const startAssessments = async () => {
		const intakeId = createdIntakeId ?? (await createIntake());
		if (!intakeId) return;
		activeStep = 1;
	};

	const finishIntake = async () => {
		const intakeId = createdIntakeId ?? (await createIntake());
		if (!intakeId) return;
		open = false;
	};

	const saveGoalsAndFinish = async () => {
		if (!createdIntakeId) return;
		isLoading = true;
		try {
			const requestData = {
				assessments: goals.map((g) => ({
					topic_id: g.topic_id,
					current_level: g.current_level,
					proposed_goals: g.proposed_goals,
					notes: g.notes
				}))
			};
			await intakes.updateGoals(createdIntakeId, requestData);
			open = false;
		} catch (e) {
			console.error(e);
			error = e instanceof Error ? e.message : 'Failed to save goals.';
		} finally {
			isLoading = false;
		}
	};
</script>

{#snippet senderItem(option: any)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex items-center gap-1.5 text-xs text-text-muted">
			{#if option.city}
				<span>{option.city}</span>
				<span>•</span>
			{/if}
			<span class="capitalize">{option.types?.replace(/_/g, ' ') || m.sender()}</span>
		</div>
	</div>
{/snippet}

{#snippet locationItem(option: any)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex flex-col gap-0.5 text-xs text-text-muted">
			<span>{option.street} {option.house_number}, {option.city}</span>
			<span class="{option.available > 0 ? 'text-emerald-600' : 'text-rose-600'} font-medium">
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
	size="full"
	class="max-w-[80vw] overflow-hidden"
>
	{#snippet header()}
		<div>
			<h2 class="text-lg font-bold text-text">{m.create_intake()}</h2>
			<p class="text-sm text-text-muted">
				{m.intake_for_client({
					name: `${registration.client_first_name} ${registration.client_last_name}`.trim()
				})}
			</p>
		</div>
	{/snippet}

	<div class="flex flex-col gap-6">
		<section class="w-full space-y-8">
			{#if error}
				<div
					class="animate-in fade-in slide-in-from-top-2 rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm font-medium text-rose-700 shadow-sm"
				>
					{error}
				</div>
			{/if}

			<div class:hidden={activeStep !== 0} class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<!-- Client Situation Section -->
				<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
					<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
						<div class="rounded-xl bg-brand/10 p-2.5 text-brand">
							<User class="h-6 w-6" />
						</div>
						<div>
							<h2 class="text-xl font-bold text-text">{m.client_situation()}</h2>
							<p class="text-sm text-text-subtle">{m.client_situation_description()}</p>
						</div>
					</div>

					<div class="grid gap-6 lg:grid-cols-2">
						<div class="lg:col-span-2">
							<TextArea
								label={m.family_situation()}
								bind:value={familySituation}
								error={fieldErrors.familySituation}
								placeholder={m.family_situation_placeholder()}
								rows={4}
							/>
						</div>
						<div class="lg:col-span-2">
							<TextArea
								label={m.psychological_state()}
								bind:value={psychologicalState}
								error={fieldErrors.psychologicalState}
								placeholder={m.psychological_state_placeholder()}
								rows={4}
							/>
						</div>
						<div class="lg:col-span-1">
							<Input
								type="number"
								label={m.self_sufficiency_score_range()}
								bind:value={selfSufficiency}
								error={fieldErrors.selfSufficiency}
								min="0"
								max="100"
							/>
						</div>
					</div>
				</div>

				<!-- Intake Details Section -->
				<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
					<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
						<div class="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
							<FileText class="h-6 w-6" />
						</div>
						<div>
							<h2 class="text-xl font-bold text-text">{m.logistics_placement()}</h2>
							<p class="text-sm text-text-subtle">{m.logistics_assignment_description()}</p>
						</div>
					</div>

					<div class="grid gap-6 lg:grid-cols-2">
						<div class="space-y-1.5">
							<label class="flex items-center gap-1.5 text-sm font-semibold text-text-muted">
								<Calendar class="h-3.5 w-3.5" />
								{m.intake_date()}
							</label>
							<DateTimePicker bind:value={dateOfIntake} error={fieldErrors.dateOfIntake} />
						</div>

						<div>
							<Input
								label={m.signature_full_name()}
								bind:value={signature}
								error={fieldErrors.signature}
								placeholder={m.signature_full_name_placeholder()}
							/>
						</div>

						<div class="space-y-1.5">
							<label for="care-type" class="text-sm font-semibold text-text-muted">
								{m.care_type()}
							</label>
							<div class="relative">
								<select
									id="care-type"
									bind:value={careType}
									class="w-full appearance-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text transition-all outline-none hover:bg-surface/80 focus:ring-2 focus:ring-brand/20 {fieldErrors.careType
										? 'border-error'
										: ''}"
								>
									{#each careTypeOptions as option (option.value)}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
								<div
									class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-muted"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
									>
								</div>
							</div>
							{#if fieldErrors.careType}
								<p class="ml-1 text-xs font-medium text-error">{fieldErrors.careType}</p>
							{/if}
						</div>

						<div class="lg:col-span-2">
							<MultiSelect
								label={m.participants()}
								bind:value={intakeParticipants}
								options={participantOptions}
								error={fieldErrors.intakeParticipants}
								placeholder={m.select_participants_placeholder()}
							/>
						</div>

						<SearchSelect
							label={m.referrer_sender()}
							bind:value={senderId}
							bind:displayValue={senderName}
							error={fieldErrors.senderId}
							loadOptions={async (query) => {
								const res = await listSenders({ search: query, pageSize: 50 });
								return res.data.results;
							}}
							labelFn={(s) => s.name}
							valueFn={(s) => s.id}
							item={senderItem}
							placeholder={m.select_sender_placeholder()}
						/>

						<SearchSelect
							label={m.assigned_location()}
							bind:value={assignedLocationId}
							error={fieldErrors.assignedLocationId}
							loadOptions={async (query) => {
								const res = await listLocations({ search: query, pageSize: 50 });
								return res.data.results;
							}}
							labelFn={(loc) => `${loc.name} (${loc.city})`}
							valueFn={(loc) => loc.id}
							item={locationItem}
							placeholder={m.select_location_placeholder()}
						/>
					</div>
				</div>

				<!-- Conclusion + Decision Section -->
				<div class="grid gap-6 lg:col-span-2 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
					<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
						<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
							<div class="rounded-xl bg-purple-500/10 p-2.5 text-purple-600">
								<Activity class="h-6 w-6" />
							</div>
							<div>
								<h2 class="text-xl font-bold text-text">{m.initial_assessment()}</h2>
								<p class="text-sm text-text-subtle">{m.initial_assessment_description()}</p>
							</div>
						</div>

						<div class="space-y-6">
							<TextArea
								label={m.risk_assessment()}
								bind:value={riskAssessment}
								error={fieldErrors.riskAssessment}
								placeholder={m.risk_assessment_placeholder()}
								rows={4}
							/>

							<div class="grid gap-6 md:grid-cols-2">
								<div class="space-y-1.5">
									<label for="intake-conclusion" class="text-sm font-semibold text-text-muted"
										>{m.intake_conclusion()}</label
									>
									<div class="relative">
										<select
											id="intake-conclusion"
											bind:value={intakeConclusion}
											class="w-full appearance-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text transition-all outline-none hover:bg-surface/80 focus:ring-2 focus:ring-brand/20 {fieldErrors.intakeConclusion
												? 'border-error'
												: ''}"
										>
											{#each conclusionOptions as option (option.value)}
												<option value={option.value}>{option.label}</option>
											{/each}
										</select>
										<div
											class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-muted"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
											>
										</div>
									</div>
									{#if fieldErrors.intakeConclusion}
										<p class="ml-1 text-xs font-medium text-error">
											{fieldErrors.intakeConclusion}
										</p>
									{/if}
								</div>
								<div>
									<Input
										type="number"
										label={m.evaluation_interval_weeks()}
										bind:value={evaluationIntervalWeeks}
										error={fieldErrors.evaluationIntervalWeeks}
										min="1"
										placeholder={m.placeholder_weeks_example()}
									/>
								</div>
								<div class="md:col-span-2">
									<TextArea
										label={m.additional_notes()}
										bind:value={intakeConclusionNotes}
										error={fieldErrors.intakeConclusionNotes}
										placeholder={m.additional_notes_placeholder()}
										rows={3}
									/>
								</div>
							</div>
						</div>
					</div>

					<section class="space-y-5">
						<div class="space-y-2 px-1">
							<div class="flex items-center justify-between">
								<h2 class="text-xl font-bold text-text">{m.goals_assessments()}</h2>
								<span
									class="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary"
								>
									{m.optional()}
								</span>
							</div>
							<p class="text-base text-text-subtle">
								{m.assessments_optional_description()}
							</p>
						</div>

						<div class="grid auto-rows-fr gap-4">
							<!-- Option A: Define Now (Primary) -->
							<button
								onclick={() => {
									startAssessments();
								}}
								disabled={isLoading}
								class="group relative flex min-h-[180px] items-center gap-4 rounded-3xl border-2 border-emerald-500/10 bg-surface p-6 text-left shadow-sm transition-all hover:border-emerald-500 hover:bg-emerald-50/30 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
							>
								<div
									class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/50 text-emerald-700 ring-1 ring-emerald-500/20 transition-all group-hover:bg-emerald-600 group-hover:text-white group-hover:ring-emerald-600"
								>
									<ListChecks class="h-7 w-7" />
								</div>

								<div class="flex-1">
									<div class="flex items-center gap-2">
										<span class="text-lg font-bold text-text group-hover:text-emerald-900">
											{m.define_now()}
										</span>
										<span
											class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 opacity-0 transition-opacity group-hover:opacity-100"
										>
											{m.recommended()}
										</span>
									</div>
									<p
										class="mt-1 text-sm font-medium text-text-muted group-hover:text-emerald-700/80"
									>
										{m.define_now_description()}
									</p>
								</div>

								<div
									class="opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100"
								>
									<ArrowRight class="h-5 w-5 text-emerald-600" />
								</div>
							</button>

							<!-- Option B: Do Later (Secondary) -->
							<button
								onclick={() => {
									finishIntake();
								}}
								disabled={isLoading}
								class="group relative flex min-h-[180px] items-center gap-4 rounded-3xl border border-border bg-zinc-50/50 p-6 text-left transition-all hover:border-zinc-400 hover:bg-white hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
							>
								<div
									class="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-200/50 text-zinc-600 ring-1 ring-zinc-500/10 transition-all group-hover:bg-zinc-800 group-hover:text-white group-hover:ring-zinc-800"
								>
									<Clock class="h-7 w-7" />
								</div>

								<div class="flex-1">
									<span class="text-lg font-bold text-text group-hover:text-zinc-900">
										{m.do_later()}
									</span>
									<p class="mt-1 text-sm font-medium text-text-muted group-hover:text-zinc-700">
										{m.do_later_description()}
									</p>
								</div>
							</button>
						</div>
					</section>
				</div>
			</div>

			<div class:hidden={activeStep === 0} class="grid gap-6 lg:grid-cols-[320px_1fr]">
				<aside class="space-y-6">
					<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-base font-bold text-text">{m.registration_goals_reference()}</h3>
							<span class="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
								{m.read_only()}
							</span>
						</div>
						{#if registration.client_goals && registration.client_goals.length > 0}
							<ul class="space-y-2 text-sm text-text-muted">
								{#each registration.client_goals as goal (goal)}
									<li class="rounded-xl border border-border/60 bg-zinc-50/60 px-3 py-2">
										{goal}
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm text-text-subtle">{m.no_goals_specified()}</p>
						{/if}
						{#if registration.application_reason}
							<div class="mt-4 border-t border-border/60 pt-4">
								<p class="text-xs font-semibold tracking-wide text-text-subtle uppercase">
									{m.reason_for_application()}
								</p>
								<p class="mt-2 text-sm text-text-muted">
									{registration.application_reason}
								</p>
							</div>
						{/if}
					</div>
				</aside>

				<div class="space-y-6">
					<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
						<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 class="text-xl font-bold text-text">{m.goals_assessments()}</h2>
								<p class="text-sm text-text-subtle">{m.assessment_goals_description()}</p>
							</div>
							<button
								onclick={saveGoalsAndFinish}
								disabled={isLoading || goals.length === 0}
								class="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-strong active:scale-95 disabled:opacity-50"
							>
								{#if isLoading}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<Save class="h-4 w-4" />
								{/if}
								{m.save_finish()}
							</button>
						</div>

						<GoalAssessmentForm bind:goals onGoalsChange={(g) => (goals = g)} />
					</div>
				</div>
			</div>
		</section>
	</div>
</Modal>
