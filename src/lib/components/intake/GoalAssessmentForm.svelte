<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import * as v from 'valibot';
	import { Loader2, Sparkles, X, Plus, RotateCcw } from 'lucide-svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import TextArea from '$lib/components/ui/Textarea.svelte';
	import { intakes } from '$lib/api/intakes';
	import { listMaturityMatrixTopics } from '$lib/api/maturityMatrix';
	import { createGoalAssessmentSchema } from '$lib/schemas/intake';
	import type { IntakeGoalTopic, ListCarePlanTopics, MaturityGoal } from '$lib/types/api';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		intakeId?: string | null;
		goals: IntakeGoalTopic[];
	}

	interface GoalFieldErrors {
		title?: string;
		description?: string;
	}

	let { intakeId, goals = $bindable() }: Props = $props();

	const initialGoals = $state.snapshot(goals);
	let maturityTopics = $state<ListCarePlanTopics[]>([]);
	let maturityLoading = $state(false);
	let maturityError = $state('');
	let selectedTopics = $state(initialGoals.map((goal) => goal.topic_id));
	let topicLevels = $state<Record<string, number>>(
		Object.fromEntries(initialGoals.map((goal) => [goal.topic_id, goal.current_level]))
	);
	let topicGoals = $state<Record<string, MaturityGoal[]>>(
		Object.fromEntries(initialGoals.map((goal) => [goal.topic_id, goal.proposed_goals]))
	);
	let topicDescriptions = $state<Record<string, string>>(
		Object.fromEntries(initialGoals.map((goal) => [goal.topic_id, goal.notes ?? '']))
	);
	let levelErrors = $state<Record<string, string>>({});
	let goalErrors = $state<Record<string, GoalFieldErrors[]>>({});
	let generatingTopics = $state<Record<string, boolean>>({});
	let generateErrors = $state<Record<string, string>>({});
	let topicLoadSequence = 0;
	let generationSequence: Record<string, number> = {};
	let destroyed = false;

	const assessmentSchema = createGoalAssessmentSchema({
		required: m.intake_validation_required(),
		participantsRequired: m.intake_validation_participant(),
		integer: m.intake_validation_integer(),
		selfSufficiencyRange: m.intake_validation_self_sufficiency(),
		evaluationIntervalRange: m.intake_validation_evaluation_interval(),
		levelRange: m.intake_validation_level()
	});

	const leftTopics = $derived(maturityTopics.filter((_, index) => index % 2 === 0));
	const rightTopics = $derived(maturityTopics.filter((_, index) => index % 2 === 1));

	function buildGoals(): IntakeGoalTopic[] {
		return selectedTopics.map((topicId) => {
			const original = initialGoals.find((goal) => goal.topic_id === topicId);
			return {
				assessment_id: original?.assessment_id ?? '',
				topic_id: topicId,
				topic_name:
					maturityTopics.find((topic) => topic.id === topicId)?.topic_name ??
					original?.topic_name ??
					'',
				current_level: topicLevels[topicId] ?? 3,
				notes: topicDescriptions[topicId] ?? null,
				proposed_goals: topicGoals[topicId] ?? []
			};
		});
	}

	function commitGoals() {
		goals = buildGoals();
	}

	async function loadTopics() {
		if (maturityLoading) return;
		const sequence = ++topicLoadSequence;
		maturityLoading = true;
		maturityError = '';
		try {
			const response = await listMaturityMatrixTopics();
			if (destroyed || sequence !== topicLoadSequence) return;
			maturityTopics = response.data;
			commitGoals();
		} catch (error) {
			if (destroyed || sequence !== topicLoadSequence) return;
			console.error('Failed to load maturity topics:', error);
			maturityError = m.intake_topics_load_error();
		} finally {
			if (!destroyed && sequence === topicLoadSequence) maturityLoading = false;
		}
	}

	onMount(loadTopics);
	onDestroy(() => {
		destroyed = true;
		topicLoadSequence += 1;
		generationSequence = {};
	});

	function toggleTopic(topicId: string) {
		if (selectedTopics.includes(topicId)) {
			selectedTopics = selectedTopics.filter((id) => id !== topicId);
			generationSequence[topicId] = (generationSequence[topicId] ?? 0) + 1;
			generatingTopics = { ...generatingTopics, [topicId]: false };
		} else {
			selectedTopics = [...selectedTopics, topicId];
			topicLevels = { ...topicLevels, [topicId]: topicLevels[topicId] ?? 3 };
			topicGoals = { ...topicGoals, [topicId]: topicGoals[topicId] ?? [] };
		}
		commitGoals();
	}

	function setLevel(topicId: string, level: number) {
		topicLevels = { ...topicLevels, [topicId]: level };
		levelErrors = { ...levelErrors, [topicId]: '' };
		commitGoals();
	}

	function setDescription(topicId: string, value: string) {
		topicDescriptions = { ...topicDescriptions, [topicId]: value };
		commitGoals();
	}

	function addGoal(topicId: string) {
		topicGoals = {
			...topicGoals,
			[topicId]: [
				...(topicGoals[topicId] ?? []),
				{ title: '', description: '', priority: 'medium' }
			]
		};
		commitGoals();
	}

	function removeGoal(topicId: string, index: number) {
		topicGoals = {
			...topicGoals,
			[topicId]: (topicGoals[topicId] ?? []).filter((_, goalIndex) => goalIndex !== index)
		};
		goalErrors = {
			...goalErrors,
			[topicId]: (goalErrors[topicId] ?? []).filter((_, goalIndex) => goalIndex !== index)
		};
		commitGoals();
	}

	function updateGoal(topicId: string, index: number, updates: Partial<MaturityGoal>) {
		topicGoals = {
			...topicGoals,
			[topicId]: (topicGoals[topicId] ?? []).map((goal, goalIndex) =>
				goalIndex === index ? { ...goal, ...updates } : goal
			)
		};
		const errors = [...(goalErrors[topicId] ?? [])];
		errors[index] = {
			...errors[index],
			...(updates.title !== undefined ? { title: undefined } : {}),
			...(updates.description !== undefined ? { description: undefined } : {})
		};
		goalErrors = { ...goalErrors, [topicId]: errors };
		commitGoals();
	}

	export function validate(): boolean {
		const nextLevelErrors: Record<string, string> = {};
		const nextGoalErrors: Record<string, GoalFieldErrors[]> = {};
		let valid = true;

		for (const topicId of selectedTopics) {
			const level = topicLevels[topicId];
			const validLevels = maturityTopics
				.find((topic) => topic.id === topicId)
				?.level_descriptions.map((description) => description.level);
			const result = v.safeParse(assessmentSchema, {
				current_level: level,
				proposed_goals: topicGoals[topicId] ?? [],
				notes: topicDescriptions[topicId] ?? null
			});

			if (!Number.isFinite(level) || !Number.isInteger(level) || !validLevels?.includes(level)) {
				nextLevelErrors[topicId] = m.intake_validation_level();
				valid = false;
			}

			if (!result.success) {
				valid = false;
				const errors: GoalFieldErrors[] = [];
				for (const issue of result.issues) {
					const path = issue.path?.map((item) => String(item.key)) ?? [];
					if (path[0] !== 'proposed_goals') continue;
					const index = Number(path[1]);
					if (!Number.isInteger(index)) continue;
					errors[index] = {
						...errors[index],
						...(path[2] === 'title' ? { title: issue.message } : {}),
						...(path[2] === 'description' ? { description: issue.message } : {})
					};
				}
				nextGoalErrors[topicId] = errors;
			}
		}

		levelErrors = nextLevelErrors;
		goalErrors = nextGoalErrors;
		if (valid) {
			topicGoals = Object.fromEntries(
				Object.entries(topicGoals).map(([topicId, topicGoalList]) => [
					topicId,
					topicGoalList.map((goal) => ({
						...goal,
						title: goal.title.trim(),
						description: goal.description.trim()
					}))
				])
			);
			commitGoals();
		}
		return valid;
	}

	async function generateGoals(topicId: string) {
		if (generatingTopics[topicId] || !intakeId) return;
		const requestIntakeId = intakeId;
		const currentLevel = topicLevels[topicId];
		if (!Number.isFinite(currentLevel) || !Number.isInteger(currentLevel)) {
			generateErrors = { ...generateErrors, [topicId]: m.intake_ai_level_required() };
			return;
		}

		const requestSequence = (generationSequence[topicId] ?? 0) + 1;
		generationSequence[topicId] = requestSequence;
		generatingTopics = { ...generatingTopics, [topicId]: true };
		generateErrors = { ...generateErrors, [topicId]: '' };

		try {
			const response = await intakes.generateGoals(requestIntakeId, {
				topic_id: topicId,
				current_level: currentLevel,
				user_desc: topicDescriptions[topicId]?.trim() || undefined
			});
			if (
				destroyed ||
				generationSequence[topicId] !== requestSequence ||
				!selectedTopics.includes(topicId)
			)
				return;
			topicGoals = {
				...topicGoals,
				[topicId]: [...(topicGoals[topicId] ?? []), ...response.data.goals]
			};
			commitGoals();
		} catch (error) {
			if (destroyed || generationSequence[topicId] !== requestSequence) return;
			console.error('Failed to generate goals:', error);
			generateErrors = {
				...generateErrors,
				[topicId]: m.intake_ai_generation_error()
			};
		} finally {
			if (!destroyed && generationSequence[topicId] === requestSequence) {
				generatingTopics = { ...generatingTopics, [topicId]: false };
			}
		}
	}
</script>

<div class="space-y-6">
	{#if maturityLoading}
		<div class="flex flex-col items-center justify-center py-12" role="status">
			<Loader2 class="h-8 w-8 animate-spin text-brand" aria-hidden="true" />
			<p class="mt-4 text-sm text-text-muted">{m.loading_topics()}</p>
		</div>
	{:else if maturityError}
		<div
			class="rounded-xl border border-error/30 bg-error/10 p-4 text-center text-error"
			role="alert"
		>
			<p>{maturityError}</p>
			<button
				type="button"
				onclick={loadTopics}
				class="mt-3 inline-flex items-center gap-2 rounded-xl border border-error/30 px-3 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
			>
				<RotateCcw class="h-4 w-4" aria-hidden="true" />
				{m.retry()}
			</button>
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

{#snippet topicCard(topic: ListCarePlanTopics)}
	{@const isSelected = selectedTopics.includes(topic.id)}
	<div
		class="mb-4 inline-block w-full break-inside-avoid rounded-2xl border bg-surface p-4 align-top transition-all {isSelected
			? 'border-brand/40 shadow-sm ring-1 ring-brand/10'
			: 'border-border/70 hover:border-secondary/30'}"
	>
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<h3 class="text-base font-bold break-words text-text {isSelected ? 'text-brand' : ''}">
					{topic.topic_name}
				</h3>
				<p class="text-xs text-text-subtle">
					{isSelected ? m.configure_levels_goals() : m.select_to_assess()}
				</p>
			</div>
			<button
				type="button"
				onclick={() => toggleTopic(topic.id)}
				aria-pressed={isSelected}
				aria-label={m.intake_toggle_topic({ topic: topic.topic_name })}
				class="rounded-full border px-3 py-1 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none {isSelected
					? 'border-brand bg-brand text-white shadow-sm'
					: 'border-border bg-surface text-text-subtle hover:border-secondary hover:text-text'}"
			>
				{isSelected ? m.selected() : m.select()}
			</button>
		</div>

		{#if isSelected}
			<div class="mt-4 space-y-4" in:slide>
				<div class="space-y-3 rounded-xl border border-border/60 bg-bg p-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold tracking-wide text-text-subtle uppercase">
							{m.maturity_level()}
						</span>
						<span class="text-xs font-bold text-brand">
							{topicLevels[topic.id]
								? m.level_label({ level: topicLevels[topic.id] })
								: m.not_set()}
						</span>
					</div>
					<div
						class="flex gap-1"
						role="group"
						aria-label={m.intake_level_for_topic({ topic: topic.topic_name })}
					>
						{#each topic.level_descriptions as level (level.level)}
							{@const isLevelSelected = topicLevels[topic.id] === level.level}
							<button
								type="button"
								onclick={() => setLevel(topic.id, level.level)}
								aria-pressed={isLevelSelected}
								aria-label={m.intake_select_level({ level: level.level, topic: topic.topic_name })}
								class="h-8 flex-1 rounded-lg border text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none {isLevelSelected
									? 'border-brand bg-brand text-white shadow-sm'
									: 'border-border bg-surface text-text-muted hover:border-brand/30 hover:text-text'}"
							>
								{level.level}
							</button>
						{/each}
					</div>
					{#if levelErrors[topic.id]}
						<p class="text-xs font-medium text-error">{levelErrors[topic.id]}</p>
					{/if}
				</div>

				<div class="rounded-xl border border-border/60 bg-surface p-3 shadow-sm">
					<div class="space-y-3">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<p class="text-xs font-semibold tracking-wide text-text-subtle uppercase">
								{m.action_plan()}
							</p>
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={() => generateGoals(topic.id)}
									disabled={generatingTopics[topic.id] || !intakeId}
									aria-label={m.intake_ai_suggest_topic({ topic: topic.topic_name })}
									class="flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
								>
									{#if generatingTopics[topic.id]}
										<Loader2 class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
									{:else}
										<Sparkles class="h-3.5 w-3.5" aria-hidden="true" />
									{/if}
									{m.ai_suggest()}
								</button>
								<button
									type="button"
									onclick={() => addGoal(topic.id)}
									class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
								>
									<Plus class="h-3.5 w-3.5" aria-hidden="true" />
									{m.add()}
								</button>
							</div>
						</div>

						{#if generateErrors[topic.id]}
							<div
								class="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
								role="alert"
							>
								{generateErrors[topic.id]}
							</div>
						{/if}

						<TextArea
							value={topicDescriptions[topic.id] ?? ''}
							oninput={(event) => setDescription(topic.id, event.currentTarget.value)}
							placeholder={m.assessment_notes_placeholder()}
							rows={2}
						/>

						<div class="space-y-3">
							{#each topicGoals[topic.id] ?? [] as goal, index (`${topic.id}-${index}`)}
								<div class="rounded-xl border border-border/60 bg-bg p-3" transition:slide>
									<div class="flex items-start gap-2">
										<div class="min-w-0 flex-1">
											<Input
												value={goal.title}
												oninput={(event) =>
													updateGoal(topic.id, index, { title: event.currentTarget.value })}
												error={goalErrors[topic.id]?.[index]?.title}
												placeholder={m.goal_title_placeholder()}
											/>
										</div>
										<select
											value={goal.priority}
											onchange={(event) =>
												updateGoal(topic.id, index, {
													priority: event.currentTarget.value as MaturityGoal['priority']
												})}
											aria-label={m.intake_goal_priority()}
											class="h-10 w-24 shrink-0 rounded-xl border border-border bg-surface px-2 text-xs text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
										>
											<option value="high">{m.high()}</option>
											<option value="medium">{m.medium()}</option>
											<option value="low">{m.low()}</option>
										</select>
										<button
											type="button"
											onclick={() => removeGoal(topic.id, index)}
											aria-label={m.intake_remove_goal({
												number: index + 1,
												topic: topic.topic_name
											})}
											class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-error/30 bg-error/10 text-error hover:bg-error hover:text-white focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none"
										>
											<X class="h-4 w-4" aria-hidden="true" />
										</button>
									</div>
									<div class="mt-3">
										<TextArea
											value={goal.description}
											oninput={(event) =>
												updateGoal(topic.id, index, { description: event.currentTarget.value })}
											error={goalErrors[topic.id]?.[index]?.description}
											placeholder={m.goal_description_placeholder()}
											rows={2}
										/>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/snippet}
