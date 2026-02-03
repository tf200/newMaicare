<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import TextArea from '$lib/components/ui/Textarea.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import { listSenders } from '$lib/api/senders';
	import { listLocations } from '$lib/api/locations';
	import { intakes } from '$lib/api/intakes';
	import { listMaturityMatrixTopics } from '$lib/api/maturityMatrix';
	import {
		ArrowRight,
		Activity,
		Calendar,
		FileText,
		Loader2,
		Sparkles,
		User,
		X,
		ListChecks,
		Clock
	} from 'lucide-svelte';
	import type {
		GetRegistrationFormResponse,
		IntakeCareType,
		IntakeParticipantsEnum,
		IntakeConclusionEnum,
		ListCarePlanTopics,
		MaturityMatrixLevelDescription
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

	interface LevelDescription {
		level: number;
		name: string;
		description: string;
	}

	interface CarePlanTopic {
		id: string;
		topicName: string;
		levelDescriptions: LevelDescription[];
	}

	interface Goal {
		title: string;
		description: string;
		priority: 'low' | 'medium' | 'high';
	}

	let selectedTopics = $state<string[]>([]);
	let topicLevels = $state<Record<string, number>>({});
	let topicGoals = $state<Record<string, Goal[]>>({});
	let topicDescriptions = $state<Record<string, string>>({}); // User context for AI
	let assessmentContext = $state(''); // Keeping for now if needed, but UI will move
	let assessmentNotes = $state('');
	let generatingFor = $state<string | null>(null);
	let maturityTopics = $state<CarePlanTopic[]>([]);
	let maturityLoading = $state(false);
	let maturityError = $state('');
	const defaultRiskAssessment = $derived(registration.risk_additional_notes ?? '');
	const leftTopics = $derived(maturityTopics.filter((_, i) => i % 2 === 0));
	const rightTopics = $derived(maturityTopics.filter((_, i) => i % 2 === 1));

	const mapTopic = (topic: ListCarePlanTopics): CarePlanTopic => {
		return {
			id: topic.id,
			topicName: topic.topic_name,
			levelDescriptions: topic.level_descriptions.map((level: MaturityMatrixLevelDescription) => ({
				level: level.level,
				name: level.name,
				description: level.description
			}))
		};
	};

	const toggleTopic = (topicId: string) => {
		if (selectedTopics.includes(topicId)) {
			selectedTopics = selectedTopics.filter((id) => id !== topicId);
			const { [topicId]: _level, ...restLevels } = topicLevels;
			const { [topicId]: _goals, ...restGoals } = topicGoals;
			const { [topicId]: _desc, ...restDescs } = topicDescriptions;
			topicLevels = restLevels;
			topicGoals = restGoals;
			topicDescriptions = restDescs;
			return;
		}
		selectedTopics = [...selectedTopics, topicId];
		topicLevels = { ...topicLevels, [topicId]: topicLevels[topicId] ?? 3 };
		topicGoals = {
			...topicGoals,
			[topicId]: topicGoals[topicId] ?? [{ title: '', description: '', priority: 'medium' }]
		};
	};

	const generateGoals = async (topicId: string) => {
		generatingFor = topicId;
		// Simulated delay
		await new Promise((resolve) => setTimeout(resolve, 1500));

		const currentDesc = topicDescriptions[topicId] || '';
		const currentLevel = topicLevels[topicId];

		// Local generation logic (AI endpoint integration pending)
		const newGoals: Goal[] = [
			{
				title: `Improve ${topicId} stability`,
				description: `Generated based on level ${currentLevel}: ${currentDesc || 'General improvement needed'}`,
				priority: 'high'
			},
			{
				title: 'Maintain current progress',
				description: 'Ensure consistent engagement with support systems.',
				priority: 'medium'
			}
		];

		const existing = topicGoals[topicId] ?? [];
		topicGoals = { ...topicGoals, [topicId]: [...existing, ...newGoals] };
		generatingFor = null;
	};

	const addGoal = (topicId: string) => {
		const goals = topicGoals[topicId] ?? [];
		topicGoals = {
			...topicGoals,
			[topicId]: [...goals, { title: '', description: '', priority: 'medium' }]
		};
	};

	const updateGoal = (topicId: string, index: number, updates: Partial<Goal>) => {
		const goals = topicGoals[topicId] ?? [];
		const next = goals.map((goal, i) => (i === index ? { ...goal, ...updates } : goal));
		topicGoals = { ...topicGoals, [topicId]: next };
	};

	const removeGoal = (topicId: string, index: number) => {
		const goals = topicGoals[topicId] ?? [];
		const next = goals.filter((_, i) => i !== index);
		topicGoals = { ...topicGoals, [topicId]: next };
	};

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
		}
	});

	$effect.pre(() => {
		if (open && maturityTopics.length === 0 && !maturityLoading && !maturityError) {
			maturityLoading = true;
			maturityError = '';
			listMaturityMatrixTopics()
				.then((res) => {
					maturityTopics = res.data.map(mapTopic);
				})
				.catch((e) => {
					console.error(e);
					maturityError = e instanceof Error ? e.message : 'Failed to load maturity topics.';
				})
				.finally(() => {
					maturityLoading = false;
				});
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
</script>

{#snippet senderItem(option: any)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex items-center gap-1.5 text-xs text-text-muted">
			{#if option.city}
				<span>{option.city}</span>
				<span>•</span>
			{/if}
			<span class="capitalize">{option.types?.replace(/_/g, ' ') || 'Sender'}</span>
		</div>
	</div>
{/snippet}

{#snippet locationItem(option: any)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex flex-col gap-0.5 text-xs text-text-muted">
			<span>{option.street} {option.house_number}, {option.city}</span>
			<span class="{option.available > 0 ? 'text-emerald-600' : 'text-rose-600'} font-medium">
				{option.available} spots available
			</span>
		</div>
	</div>
{/snippet}

{#snippet topicCard(topic: CarePlanTopic)}
	{@const isSelected = selectedTopics.includes(topic.id)}
	<div
		class="mb-4 inline-block w-full break-inside-avoid rounded-2xl border border-border/70 bg-zinc-50/60 p-4 align-top transition-all hover:border-brand/30 dark:bg-zinc-900/40"
	>
		<div class="flex items-center justify-between gap-3">
			<div>
				<h3 class="text-base font-bold text-text">{topic.topicName}</h3>
				<p class="text-xs text-text-subtle">
					{isSelected ? 'Configure levels and goals below.' : 'Select to assess.'}
				</p>
			</div>
			<button
				onclick={() => toggleTopic(topic.id)}
				class="rounded-full border px-3 py-1 text-xs font-semibold transition-all {isSelected
					? 'border-brand bg-brand text-white'
					: 'border-border bg-surface text-text-subtle hover:text-text'}"
			>
				{isSelected ? 'Selected' : 'Select'}
			</button>
		</div>

		{#if isSelected}
			<div class="mt-4 space-y-4">
				<!-- Compact Level Selector -->
				<div class="space-y-3 rounded-xl border border-border/60 bg-surface p-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold tracking-wide text-text-subtle uppercase">Level</span
						>
						<span class="text-xs font-bold text-brand">
							{topicLevels[topic.id] ? `Level ${topicLevels[topic.id]}` : 'Not set'}
						</span>
					</div>
					<div class="flex gap-1">
						{#each topic.levelDescriptions as level (level.level)}
							{@const isLevelSelected = topicLevels[topic.id] === level.level}
							<button
								onclick={() => (topicLevels = { ...topicLevels, [topic.id]: level.level })}
								class="h-8 flex-1 rounded-lg border text-xs font-bold transition-all {isLevelSelected
									? 'border-brand bg-brand text-white shadow-sm'
									: 'border-border bg-zinc-50 text-text-muted hover:border-brand/30 hover:bg-white hover:text-text'}"
							>
								{level.level}
							</button>
						{/each}
					</div>
					{#if topicLevels[topic.id]}
						{@const currentLevel = topic.levelDescriptions.find(
							(l) => l.level === topicLevels[topic.id]
						)}
						<div class="animate-in fade-in slide-in-from-top-1 rounded-lg bg-brand/5 p-3 text-sm">
							<p class="text-brand-dark font-semibold">{currentLevel?.name}</p>
							<p class="mt-1 text-xs text-text-muted">{currentLevel?.description}</p>
						</div>
					{/if}
				</div>

				<!-- AI Assist & Goals -->
				<div class="rounded-xl border border-border/60 bg-surface p-3">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="text-xs font-semibold tracking-wide text-text-subtle uppercase">Goals</p>
							<div class="flex items-center gap-2">
								<button
									onclick={() => generateGoals(topic.id)}
									disabled={generatingFor === topic.id}
									class="flex items-center gap-1.5 rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:opacity-50"
								>
									{#if generatingFor === topic.id}
										<Loader2 class="h-3.5 w-3.5 animate-spin" />
									{:else}
										<Sparkles class="h-3.5 w-3.5 text-purple-200" />
									{/if}
									AI Suggest
								</button>
								<div class="h-3 w-px bg-border"></div>
								<button
									onclick={() => addGoal(topic.id)}
									class="hover:text-brand-dark flex items-center gap-1 text-[11px] font-semibold text-brand"
								>
									+ Add
								</button>
							</div>
						</div>

						<TextArea
							value={topicDescriptions[topic.id] ?? ''}
							oninput={(e) =>
								(topicDescriptions = {
									...topicDescriptions,
									[topic.id]: (e.currentTarget as HTMLTextAreaElement).value
								})}
							placeholder="Describe client situation for AI suggestions..."
							rows={2}
							class="text-sm"
						/>

						<div class="space-y-3">
							{#each topicGoals[topic.id] ?? [] as goal, index (index)}
								<div
									class="flex flex-col gap-3 rounded-xl border border-border/60 bg-zinc-50/60 p-3"
								>
									<div class="flex items-start gap-2">
										<div class="flex-1">
											<Input
												value={goal.title}
												oninput={(e) =>
													updateGoal(topic.id, index, {
														title: (e.currentTarget as HTMLInputElement).value
													})}
												placeholder="Goal title"
												class="h-9 py-1 text-sm"
											/>
										</div>
										<div class="w-24 shrink-0">
											<select
												value={goal.priority}
												onchange={(e) =>
													updateGoal(topic.id, index, {
														priority: (e.currentTarget as HTMLSelectElement)
															.value as Goal['priority']
													})}
												class="h-9 w-full rounded-xl border border-border bg-surface px-2 text-xs text-text outline-none focus:ring-2 focus:ring-brand/20"
											>
												<option value="high">High</option>
												<option value="medium">Med</option>
												<option value="low">Low</option>
											</select>
										</div>
										<button
											onclick={() => removeGoal(topic.id, index)}
											class="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700"
										>
											<X class="h-4 w-4" />
										</button>
									</div>

									<TextArea
										value={goal.description}
										oninput={(e) =>
											updateGoal(topic.id, index, {
												description: (e.currentTarget as HTMLTextAreaElement).value
											})}
										placeholder="Description..."
										rows={2}
										class="min-h-15 text-sm"
									/>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/snippet}

<Modal
	bind:open
	title="Create Intake"
	description={`For ${registration.client_first_name} ${registration.client_last_name}`}
	size="full"
	class="max-w-[80vw] overflow-hidden"
>
	{#snippet header()}
		<div>
			<h2 class="text-lg font-bold text-text">Create Intake</h2>
			<p class="text-sm text-text-muted">
				For {registration.client_first_name}
				{registration.client_last_name}
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
							<h2 class="text-xl font-bold text-text">Client Situation</h2>
							<p class="text-sm text-text-subtle">Current context and psychological overview</p>
						</div>
					</div>

					<div class="grid gap-6 lg:grid-cols-2">
						<div class="lg:col-span-2">
							<TextArea
								label="Family Situation"
								bind:value={familySituation}
								error={fieldErrors.familySituation}
								placeholder="Describe the family context, relationships, and home environment..."
								rows={4}
							/>
						</div>
						<div class="lg:col-span-2">
							<TextArea
								label="Psychological State"
								bind:value={psychologicalState}
								error={fieldErrors.psychologicalState}
								placeholder="Describe current psychological state, history, and observations..."
								rows={4}
							/>
						</div>
						<div class="lg:col-span-1">
							<Input
								type="number"
								label="Self Sufficiency Score (0-100)"
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
							<h2 class="text-xl font-bold text-text">Logistics & Assignment</h2>
							<p class="text-sm text-text-subtle">Dates, participants, and location details</p>
						</div>
					</div>

					<div class="grid gap-6 lg:grid-cols-2">
						<div class="space-y-1.5">
							<label class="flex items-center gap-1.5 text-sm font-semibold text-text-muted">
								<Calendar class="h-3.5 w-3.5" /> Date of Intake
							</label>
							<DateTimePicker bind:value={dateOfIntake} error={fieldErrors.dateOfIntake} />
						</div>

						<div>
							<Input
								label="Signature (Full Name)"
								bind:value={signature}
								error={fieldErrors.signature}
								placeholder="Type full name"
							/>
						</div>

						<div class="space-y-1.5">
							<label for="care-type" class="text-sm font-semibold text-text-muted">Care Type</label>
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
								label="Participants"
								bind:value={intakeParticipants}
								options={participantOptions}
								error={fieldErrors.intakeParticipants}
								placeholder="Select participants..."
							/>
						</div>

						<SearchSelect
							label="Sender / Referrer"
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
							placeholder="Select sender..."
						/>

						<SearchSelect
							label="Assign Location"
							bind:value={assignedLocationId}
							error={fieldErrors.assignedLocationId}
							loadOptions={async (query) => {
								const res = await listLocations({ search: query, pageSize: 50 });
								return res.data.results;
							}}
							labelFn={(loc) => `${loc.name} (${loc.city})`}
							valueFn={(loc) => loc.id}
							item={locationItem}
							placeholder="Select location..."
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
								<h2 class="text-xl font-bold text-text">Initial Assessment</h2>
								<p class="text-sm text-text-subtle">Risk factors and preliminary conclusion</p>
							</div>
						</div>

						<div class="space-y-6">
							<TextArea
								label="Risk Assessment"
								bind:value={riskAssessment}
								error={fieldErrors.riskAssessment}
								placeholder="Identify potential risks (aggression, self-harm, addiction, etc.)..."
								rows={4}
							/>

							<div class="grid gap-6 md:grid-cols-2">
								<div class="space-y-1.5">
									<label for="intake-conclusion" class="text-sm font-semibold text-text-muted"
										>Intake Conclusion</label
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
										label="Evaluation Interval (weeks)"
										bind:value={evaluationIntervalWeeks}
										error={fieldErrors.evaluationIntervalWeeks}
										min="1"
										placeholder="e.g. 4"
									/>
								</div>
								<div class="md:col-span-2">
									<TextArea
										label="Additional Notes"
										bind:value={intakeConclusionNotes}
										error={fieldErrors.intakeConclusionNotes}
										placeholder="Any other relevant information..."
										rows={3}
									/>
								</div>
							</div>
						</div>
					</div>

					<section class="space-y-5">
						<div class="space-y-2 px-1">
							<div class="flex items-center justify-between">
								<h2 class="text-xl font-bold text-text">Assessments & Goals</h2>
								<span
									class="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary"
								>
									Optional
								</span>
							</div>
							<p class="text-base text-text-subtle">
								You can define the maturity matrix and goals now, or complete this later.
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
											Define Now
										</span>
										<span
											class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 opacity-0 transition-opacity group-hover:opacity-100"
										>
											Recommended
										</span>
									</div>
									<p
										class="mt-1 text-sm font-medium text-text-muted group-hover:text-emerald-700/80"
									>
										Proceed to the maturity matrix and set goals immediately.
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
										Do Later
									</span>
									<p class="mt-1 text-sm font-medium text-text-muted group-hover:text-zinc-700">
										Save the intake now and skip the assessment step.
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
							<h3 class="text-base font-bold text-text">Client Goals (Reference)</h3>
							<span class="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
								Read-only
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
							<p class="text-sm text-text-subtle">No goals were submitted with the registration.</p>
						{/if}
						{#if registration.application_reason}
							<div class="mt-4 border-t border-border/60 pt-4">
								<p class="text-xs font-semibold tracking-wide text-text-subtle uppercase">
									Application Reason
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
								<h2 class="text-xl font-bold text-text">Assessment & Goals</h2>
								<p class="text-sm text-text-subtle">
									Select relevant topics, assign level, and define goals.
								</p>
							</div>
							<span
								class="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"
							>
								AI-ready
							</span>
						</div>

						{#if maturityLoading}
							<div
								class="rounded-2xl border border-border/60 bg-zinc-50/60 p-6 text-sm text-text-muted"
							>
								Loading maturity topics...
							</div>
						{:else if maturityError}
							<div
								class="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-sm text-rose-700"
							>
								{maturityError}
							</div>
						{:else if maturityTopics.length === 0}
							<div
								class="rounded-2xl border border-border/60 bg-zinc-50/60 p-6 text-sm text-text-muted"
							>
								No maturity topics available.
							</div>
						{:else}
							<div class="flex flex-col gap-4 lg:flex-row lg:items-start">
								<div class="flex flex-col gap-4 lg:w-1/2">
									{#each leftTopics as topic (topic.id)}
										{@render topicCard(topic)}
									{/each}
								</div>
								<div class="flex flex-col gap-4 lg:w-1/2">
									{#each rightTopics as topic (topic.id)}
										{@render topicCard(topic)}
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</section>
	</div>
</Modal>
