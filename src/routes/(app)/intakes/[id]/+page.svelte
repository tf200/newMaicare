<script lang="ts">
	import {
		ArrowLeft,
		Calendar,
		Clock,
		MapPin,
		User,
		Activity,
		FileText,
		ShieldAlert,
		CheckCircle2,
		Target,
		ListChecks,
		Sparkles,
		Loader2,
		X,
		Save,
		AlertTriangle,
		Plus
	} from 'lucide-svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import TextArea from '$lib/components/ui/Textarea.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { fade, slide } from 'svelte/transition';

	// --- Types ---
	type IntakeCareTypeEnum =
		| 'protected_living'
		| 'training_center'
		| 'supported_independent_living'
		| 'ambulatory_support'
		| 'other';
	type IntakeConclusionEnum =
		| 'suitable'
		| 'unsuitable'
		| 'further_investigation'
		| 'possible_palcement_date'
		| 'other';
	type IntakeParticipantsEnum =
		| 'client'
		| 'referrer'
		| 'parents/guardians'
		| 'care_coordinator'
		| 'other';

	interface IntakeAssessmentGoal {
		title: string;
		description: string;
		priority: 'low' | 'medium' | 'high';
	}

	interface IntakeGoalTopic {
		assessment_id: string;
		topic_id: string;
		topic_name: string;
		current_level: number;
		proposed_goals: IntakeAssessmentGoal[];
		notes: string | null;
	}

	interface IntakeFormLocationDetails {
		id: string;
		name: string;
		street: string;
		house_number: string;
		city: string;
	}

	interface GetIntakeFormResponse {
		id: string;
		registration_form_id: string;
		date_of_intake: string;
		care_type: IntakeCareTypeEnum;
		intake_participants: IntakeParticipantsEnum[];
		family_situation: string | null;
		psychological_state: string | null;
		self_sufficiency: number;
		sender_id: string | null;
		assigned_location_id: string | null;
		risk_assessment: string | null;
		intake_conclusion: IntakeConclusionEnum;
		intake_conclusion_notes: string | null;
		evaluation_intervals_weeks: number;
		signature: string | null;
		created_at: string;
		updated_at: string;
		client_first_name: string;
		client_last_name: string;
		client_bsn_number: string;
		desired_goals: string[];
		sender_name: string | null;
		location: IntakeFormLocationDetails | null;
		intake_goals_assigned: IntakeGoalTopic[];
	}

	// --- Mock Data ---
	const createMockIntake = (hasGoals: boolean): GetIntakeFormResponse => ({
		id: 'intake-123',
		registration_form_id: 'reg-456',
		date_of_intake: new Date().toISOString(),
		care_type: 'protected_living',
		intake_participants: ['client', 'care_coordinator'],
		family_situation:
			'Client lives with parents. High tension environment due to recent behavioral issues.',
		psychological_state: 'Stable but shows signs of anxiety in social situations.',
		self_sufficiency: 65,
		sender_id: 'sender-789',
		assigned_location_id: 'loc-101',
		risk_assessment: 'Low risk of aggression. Moderate risk of self-isolation.',
		intake_conclusion: 'suitable',
		intake_conclusion_notes: 'Client is motivated and fits the profile for protected living.',
		evaluation_intervals_weeks: 4,
		signature: 'Dr. Sarah Smith',
		created_at: new Date(Date.now() - 86400000).toISOString(),
		updated_at: new Date().toISOString(),
		client_first_name: 'John',
		client_last_name: 'Doe',
		client_bsn_number: '123456789',
		desired_goals: ['Learn to cook', 'Manage finances', 'Improve social skills'],
		sender_name: 'City Hospital',
		location: {
			id: 'loc-101',
			name: 'Sunrise Care Home',
			street: 'Main St',
			house_number: '10',
			city: 'Amsterdam'
		},
		intake_goals_assigned: hasGoals
			? [
					{
						assessment_id: 'assess-1',
						topic_id: 'topic-1',
						topic_name: 'Self-Care',
						current_level: 3,
						notes: 'Client can manage basic hygiene but needs reminders.',
						proposed_goals: [
							{
								title: 'Daily Routine',
								description: 'Establish a morning hygiene routine',
								priority: 'high'
							},
							{
								title: 'Laundry',
								description: 'Learn to do laundry independently',
								priority: 'medium'
							}
						]
					},
					{
						assessment_id: 'assess-2',
						topic_id: 'topic-2',
						topic_name: 'Social Skills',
						current_level: 2,
						notes: 'Struggles with initiating conversations.',
						proposed_goals: [
							{
								title: 'Group Activities',
								description: 'Participate in one group activity per week',
								priority: 'medium'
							}
						]
					}
				]
			: []
	});

	let intake = $state<GetIntakeFormResponse>(createMockIntake(false));
	let isGoalModalOpen = $state(false);

	const toggleMockData = () => {
		const hasGoals = intake.intake_goals_assigned.length > 0;
		intake = createMockIntake(!hasGoals);
	};

	// --- Modal / Goal Form Logic ---
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

	const mockTopics: CarePlanTopic[] = [
		{
			id: 'topic-1',
			topicName: 'Self-Care',
			levelDescriptions: [
				{ level: 1, name: 'Dependent', description: 'Needs full support' },
				{ level: 2, name: 'Semi-Dependent', description: 'Needs reminders' },
				{ level: 3, name: 'Independent', description: 'Can do alone' },
				{ level: 4, name: 'Advanced', description: 'Can help others' }
			]
		},
		{
			id: 'topic-2',
			topicName: 'Social Skills',
			levelDescriptions: [
				{ level: 1, name: 'Isolated', description: 'No social contact' },
				{ level: 2, name: 'Withdrawn', description: 'Limited contact' },
				{ level: 3, name: 'Social', description: 'Regular contact' },
				{ level: 4, name: 'Outgoing', description: 'Initiates contact' }
			]
		},
		{
			id: 'topic-3',
			topicName: 'Financial',
			levelDescriptions: [
				{ level: 1, name: 'No Income', description: 'No financial means' },
				{ level: 2, name: 'Allowance', description: 'Manages small amounts' },
				{ level: 3, name: 'Budgeting', description: 'Manages monthly budget' },
				{ level: 4, name: 'Independent', description: 'Full financial independence' }
			]
		},
		{
			id: 'topic-4',
			topicName: 'Housing',
			levelDescriptions: [
				{ level: 1, name: 'Homeless', description: 'No fixed abode' },
				{ level: 2, name: 'Shelter', description: 'Temporary shelter' },
				{ level: 3, name: 'Supported', description: 'Supported housing' },
				{ level: 4, name: 'Independent', description: 'Own tenancy' }
			]
		}
	];

	let selectedTopics = $state<string[]>([]);
	let topicLevels = $state<Record<string, number>>({});
	let topicGoals = $state<Record<string, IntakeAssessmentGoal[]>>({});
	let topicDescriptions = $state<Record<string, string>>({});
	let generatingFor = $state<string | null>(null);

	const leftTopics = $derived(mockTopics.filter((_, i) => i % 2 === 0));
	const rightTopics = $derived(mockTopics.filter((_, i) => i % 2 === 1));

	const toggleTopic = (topicId: string) => {
		if (selectedTopics.includes(topicId)) {
			selectedTopics = selectedTopics.filter((id) => id !== topicId);
			// Cleanup state for unselected topic
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
		topicGoals = { ...topicGoals, [topicId]: [] };
	};

	const addGoal = (topicId: string) => {
		const goals = topicGoals[topicId] ?? [];
		topicGoals = {
			...topicGoals,
			[topicId]: [...goals, { title: '', description: '', priority: 'medium' }]
		};
	};

	const removeGoal = (topicId: string, index: number) => {
		const goals = topicGoals[topicId] ?? [];
		const next = goals.filter((_, i) => i !== index);
		topicGoals = { ...topicGoals, [topicId]: next };
	};

	const updateGoal = (topicId: string, index: number, updates: Partial<IntakeAssessmentGoal>) => {
		const goals = topicGoals[topicId] ?? [];
		const next = goals.map((goal, i) => (i === index ? { ...goal, ...updates } : goal));
		topicGoals = { ...topicGoals, [topicId]: next };
	};

	const generateGoals = async (topicId: string) => {
		generatingFor = topicId;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const newGoals: IntakeAssessmentGoal[] = [
			{
				title: `Improve ${mockTopics.find((t) => t.id === topicId)?.topicName} skills`,
				description: 'AI Suggestion: Improve consistency in daily tasks related to this domain.',
				priority: 'medium'
			}
		];
		const existing = topicGoals[topicId] ?? [];
		topicGoals = { ...topicGoals, [topicId]: [...existing, ...newGoals] };
		generatingFor = null;
	};

	const saveGoals = () => {
		const newGoalsAssigned: IntakeGoalTopic[] = selectedTopics.map((topicId) => {
			const topic = mockTopics.find((t) => t.id === topicId)!;
			return {
				assessment_id: `new-${Date.now()}`,
				topic_id: topicId,
				topic_name: topic.topicName,
				current_level: topicLevels[topicId] || 1,
				notes: topicDescriptions[topicId] || null,
				proposed_goals: topicGoals[topicId] || []
			};
		});

		intake = {
			...intake,
			intake_goals_assigned: newGoalsAssigned
		};
		isGoalModalOpen = false;
	};

	// --- Styling Helpers ---
	const priorityColors = {
		high: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
		medium: 'bg-secondary/10 text-secondary border-secondary/20', // Use Secondary for Medium
		low: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};
</script>

<!-- Header -->
<div class="space-y-6">
	<div class="flex items-center justify-between">
		<a
			href="/intakes"
			class="inline-flex items-center gap-2 text-sm font-medium text-text-subtle transition-colors hover:text-text"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to Intakes
		</a>
		<button
			onclick={toggleMockData}
			class="text-xs text-secondary hover:text-secondary/80 hover:underline"
		>
			[Dev: Toggle Data State]
		</button>
	</div>

	<!-- Main Header -->
	<header class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
		<div
			class="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-secondary/5 to-transparent"
		></div>
		<div class="relative flex flex-col justify-between gap-6 p-8 md:flex-row md:items-start">
			<div class="flex items-center gap-5">
				<div
					class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-2xl font-bold text-brand shadow-inner ring-1 ring-brand/10"
				>
					{intake.client_first_name[0]}{intake.client_last_name[0]}
				</div>
				<div>
					<h1 class="text-3xl font-bold tracking-tight text-text">Intake Details</h1>
					<div class="flex items-center gap-2">
						<p class="text-lg font-medium text-text-muted">
							{intake.client_first_name}
							{intake.client_last_name}
						</p>
						<span class="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-bold text-secondary">
							{intake.client_bsn_number}
						</span>
					</div>
				</div>
			</div>

			<div class="flex flex-col items-end gap-2 text-sm">
				<div
					class="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-1.5 text-text-muted dark:bg-zinc-900"
				>
					<Calendar class="h-4 w-4 text-secondary" />
					<span class="font-medium">{formatDate(intake.date_of_intake)}</span>
				</div>
				<div
					class="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-1.5 text-text-muted dark:bg-zinc-900"
				>
					<MapPin class="h-4 w-4 text-brand" />
					<span class="font-medium">Assigned Location: {intake.location?.name || 'None'}</span>
				</div>
			</div>
		</div>
	</header>

	<div class="grid gap-6 xl:grid-cols-[1fr_380px]">
		<!-- Left Column -->
		<div class="space-y-6">
			<!-- Goals Section -->
			<section class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
				<div class="border-b border-border/60 bg-zinc-50/50 p-6 dark:bg-zinc-900/50">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary ring-1 ring-secondary/10"
							>
								<Target class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-bold text-text">Goals & Assessments</h2>
								<p class="text-xs text-text-subtle">Maturity matrix levels and action plan</p>
							</div>
						</div>
						{#if intake.intake_goals_assigned.length > 0}
							<button
								onclick={() => (isGoalModalOpen = true)}
								class="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-text shadow-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
							>
								<span class="h-1.5 w-1.5 rounded-full bg-secondary"></span>
								Edit Goals
							</button>
						{/if}
					</div>
				</div>

				<div class="p-6">
					{#if intake.intake_goals_assigned.length > 0}
						<!-- READ ONLY VIEW -->
						<div class="grid gap-6" in:fade>
							{#each intake.intake_goals_assigned as goalTopic}
								<div
									class="relative overflow-hidden rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all hover:border-secondary/30 hover:shadow-md dark:bg-zinc-900/50"
								>
									<div
										class="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-brand to-brand/20"
									></div>

									<div class="mb-4 flex items-start justify-between pl-2">
										<div>
											<h3 class="text-base font-bold text-text">{goalTopic.topic_name}</h3>
											{#if goalTopic.notes}
												<p class="mt-1 text-sm text-text-muted italic">"{goalTopic.notes}"</p>
											{/if}
										</div>
										<div class="flex flex-col items-end gap-1">
											<span class="text-[10px] font-bold tracking-wider text-text-subtle uppercase"
												>Maturity Level</span
											>
											<span
												class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-sm"
											>
												{goalTopic.current_level}
											</span>
										</div>
									</div>

									{#if goalTopic.proposed_goals.length > 0}
										<div class="mt-4 space-y-3 pl-2">
											{#each goalTopic.proposed_goals as goal}
												<div
													class="group flex items-start gap-3 rounded-xl border border-border/50 bg-zinc-50 p-3 transition-colors hover:border-secondary/20 hover:bg-secondary/5 dark:bg-zinc-900"
												>
													<div
														class={`mt-1.5 h-2 w-2 rounded-full ${goal.priority === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : goal.priority === 'medium' ? 'bg-secondary' : 'bg-blue-500'}`}
													></div>
													<div class="flex-1">
														<div class="flex items-center justify-between">
															<p class="text-sm font-bold text-text">{goal.title}</p>
															<span
																class={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${priorityColors[goal.priority]}`}
															>
																{goal.priority}
															</span>
														</div>
														<p class="mt-0.5 text-xs text-text-muted group-hover:text-text-subtle">
															{goal.description}
														</p>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<!-- EMPTY STATE (Action Card) -->
						<div
							in:slide
							class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-zinc-50/50 py-12 text-center dark:bg-zinc-900/20"
						>
							<div
								class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary ring-4 ring-secondary/5"
							>
								<ListChecks class="h-8 w-8" />
							</div>
							<h3 class="text-lg font-bold text-text">Goals Pending</h3>
							<p class="mx-auto mt-2 max-w-sm text-sm text-text-muted">
								This client has not been assessed yet. Please complete the maturity matrix and
								define initial goals.
							</p>
							<button
								onclick={() => (isGoalModalOpen = true)}
								class="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-secondary/25 transition-all hover:scale-[1.02] hover:bg-orange-600 active:scale-[0.98]"
							>
								<Plus class="h-5 w-5" />
								Start Assessment
							</button>
						</div>
					{/if}
				</div>
			</section>

			<!-- Client Situation -->
			<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-6 flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
						<User class="h-5 w-5" />
					</div>
					<div>
						<h2 class="text-lg font-bold text-text">Client Situation</h2>
						<p class="text-xs text-text-subtle">Context and psychological state</p>
					</div>
				</div>

				<div class="grid gap-6 md:grid-cols-2">
					<div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>Family Situation</span
						>
						<p class="mt-2 text-sm leading-relaxed text-text-muted">
							{intake.family_situation || 'N/A'}
						</p>
					</div>
					<div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>Psychological State</span
						>
						<p class="mt-2 text-sm leading-relaxed text-text-muted">
							{intake.psychological_state || 'N/A'}
						</p>
					</div>
				</div>
				<div class="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
					<span class="text-sm font-medium text-text-muted">Self Sufficiency Score</span>
					<div class="flex items-center gap-3">
						<div class="h-2.5 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
							<div
								class="h-full rounded-full bg-gradient-to-r from-brand to-secondary"
								style="width: {intake.self_sufficiency}%"
							></div>
						</div>
						<span class="text-sm font-bold text-text">{intake.self_sufficiency}/100</span>
					</div>
				</div>
			</section>
		</div>

		<!-- Right Column: Sidebar -->
		<div class="space-y-6">
			<!-- Initial Assessment -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2">
					<Activity class="h-5 w-5 text-text-subtle" />
					<h3 class="text-lg font-bold text-text">Assessment</h3>
				</div>

				<div class="space-y-5">
					<div
						class="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10"
					>
						<div class="flex items-center gap-2 text-rose-700 dark:text-rose-400">
							<ShieldAlert class="h-4 w-4" />
							<span class="text-xs font-bold tracking-wider uppercase">Risk Assessment</span>
						</div>
						<p class="mt-2 text-sm text-text-muted">{intake.risk_assessment || 'None'}</p>
					</div>

					<div>
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>Conclusion</span
						>
						<div
							class="mt-2 flex items-center gap-2 rounded-xl bg-zinc-50 p-3 font-medium text-text dark:bg-zinc-900/50"
						>
							<CheckCircle2 class="h-4 w-4 text-emerald-500" />
							<span class="capitalize">{intake.intake_conclusion.replace('_', ' ')}</span>
						</div>
					</div>

					<div>
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase">Notes</span>
						<p class="mt-2 text-sm text-text-muted">{intake.intake_conclusion_notes}</p>
					</div>
				</div>
			</div>

			<!-- Logistics -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2">
					<FileText class="h-5 w-5 text-text-subtle" />
					<h3 class="text-lg font-bold text-text">Logistics</h3>
				</div>

				<div class="space-y-4 text-sm">
					<div class="flex justify-between border-b border-border/50 pb-2">
						<span class="text-text-muted">Care Type</span>
						<span class="font-medium text-text capitalize"
							>{intake.care_type.replace(/_/g, ' ')}</span
						>
					</div>
					<div class="flex justify-between border-b border-border/50 pb-2">
						<span class="text-text-muted">Evaluation</span>
						<span class="font-medium text-text"
							>Every {intake.evaluation_intervals_weeks} weeks</span
						>
					</div>
					<div class="pt-1">
						<span class="mb-2 block text-text-muted">Participants</span>
						<div class="flex flex-wrap gap-1.5">
							{#each intake.intake_participants as participant}
								<span
									class="rounded-md border border-border bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 capitalize dark:bg-zinc-800 dark:text-zinc-400"
								>
									{participant}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal for Setting Goals -->
<Modal
	bind:open={isGoalModalOpen}
	title="Assessment & Goals"
	description="Select topics, assign maturity levels, and define goals."
	size="2xl"
>
	{#snippet footer()}
		<div class="flex w-full justify-end gap-3">
			<button
				onclick={() => (isGoalModalOpen = false)}
				class="rounded-xl px-4 py-2 text-sm font-semibold text-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800"
			>
				Cancel
			</button>
			<button
				onclick={saveGoals}
				disabled={selectedTopics.length === 0}
				class="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Save class="h-4 w-4" />
				Save Goals
			</button>
		</div>
	{/snippet}

	<div class="space-y-6">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-start">
			<!-- Left Topics -->
			<div class="flex flex-col gap-4 lg:w-1/2">
				{#each leftTopics as topic (topic.id)}
					{@render topicCard(topic)}
				{/each}
			</div>
			<!-- Right Topics -->
			<div class="flex flex-col gap-4 lg:w-1/2">
				{#each rightTopics as topic (topic.id)}
					{@render topicCard(topic)}
				{/each}
			</div>
		</div>
	</div>
</Modal>

{#snippet topicCard(topic: CarePlanTopic)}
	{@const isSelected = selectedTopics.includes(topic.id)}
	<div
		class="mb-4 inline-block w-full break-inside-avoid rounded-2xl border bg-surface p-4 align-top transition-all dark:bg-zinc-900/40 {isSelected
			? 'border-brand/40 shadow-sm ring-1 ring-brand/10'
			: 'border-border/70 hover:border-secondary/30'}"
	>
		<div class="flex items-center justify-between gap-3">
			<div>
				<h3 class="text-base font-bold text-text {isSelected ? 'text-brand' : ''}">
					{topic.topicName}
				</h3>
				<p class="text-xs text-text-subtle">
					{isSelected ? 'Configure levels and goals below.' : 'Select to assess.'}
				</p>
			</div>
			<button
				onclick={() => toggleTopic(topic.id)}
				class="rounded-full border px-3 py-1 text-xs font-semibold transition-all {isSelected
					? 'border-brand bg-brand text-white shadow-sm'
					: 'border-border bg-surface text-text-subtle hover:border-secondary hover:text-secondary hover:text-text'}"
			>
				{isSelected ? 'Selected' : 'Select'}
			</button>
		</div>

		{#if isSelected}
			<div class="mt-4 space-y-4" in:slide>
				<!-- Compact Level Selector -->
				<div
					class="space-y-3 rounded-xl border border-border/60 bg-zinc-50/50 p-3 dark:bg-zinc-900/50"
				>
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold tracking-wide text-text-subtle uppercase"
							>Maturity Level</span
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
									: 'border-border bg-white text-text-muted hover:border-brand/30 hover:text-text'}"
							>
								{level.level}
							</button>
						{/each}
					</div>
					{#if topicLevels[topic.id]}
						{@const currentLevel = topic.levelDescriptions.find(
							(l) => l.level === topicLevels[topic.id]
						)}
						<div
							class="animate-in fade-in slide-in-from-top-1 rounded-lg border border-brand/10 bg-white p-3 text-sm shadow-sm dark:bg-zinc-800"
						>
							<p class="font-semibold text-brand-strong">{currentLevel?.name}</p>
							<p class="mt-1 text-xs text-text-muted">{currentLevel?.description}</p>
						</div>
					{/if}
				</div>

				<!-- Goals -->
				<div class="rounded-xl border border-border/60 bg-white p-3 shadow-sm dark:bg-zinc-900">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="text-xs font-semibold tracking-wide text-text-subtle uppercase">
								Action Plan
							</p>
							<div class="flex items-center gap-2">
								<button
									onclick={() => generateGoals(topic.id)}
									disabled={generatingFor === topic.id}
									class="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
								>
									{#if generatingFor === topic.id}
										<Loader2 class="h-3.5 w-3.5 animate-spin" />
									{:else}
										<Sparkles class="h-3.5 w-3.5 text-purple-100" />
									{/if}
									AI Suggest
								</button>
								<div class="h-3 w-px bg-border"></div>
								<button
									onclick={() => addGoal(topic.id)}
									class="flex items-center gap-1 text-[11px] font-semibold text-brand transition-colors hover:text-secondary"
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
							placeholder="Add assessment notes here..."
							rows={2}
							class="border-zinc-200 bg-zinc-50 text-sm focus:border-brand/40"
						/>

						<div class="space-y-3">
							{#each topicGoals[topic.id] ?? [] as goal, index (index)}
								<div
									class="flex flex-col gap-3 rounded-xl border border-border/60 bg-zinc-50/60 p-3 transition-all hover:bg-zinc-50"
									transition:slide
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
												class="h-9 bg-white py-1 text-sm"
											/>
										</div>
										<div class="w-24 shrink-0">
											<select
												value={goal.priority}
												onchange={(e) =>
													updateGoal(topic.id, index, {
														priority: (e.currentTarget as HTMLSelectElement)
															.value as IntakeAssessmentGoal['priority']
													})}
												class="h-9 w-full cursor-pointer rounded-xl border border-border bg-white px-2 text-xs text-text outline-none focus:ring-2 focus:ring-brand/20"
											>
												<option value="high">High</option>
												<option value="medium">Med</option>
												<option value="low">Low</option>
											</select>
										</div>
										<button
											onclick={() => removeGoal(topic.id, index)}
											class="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-500 hover:text-white"
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
										placeholder="Goal description..."
										rows={2}
										class="min-h-12 bg-white text-sm"
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
