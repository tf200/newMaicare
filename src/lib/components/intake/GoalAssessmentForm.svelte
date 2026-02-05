<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import TextArea from '$lib/components/ui/Textarea.svelte';
	import { slide } from 'svelte/transition';
	import { untrack } from 'svelte';
	import { Loader2, Sparkles, X, Plus } from 'lucide-svelte';
	import { listMaturityMatrixTopics } from '$lib/api/maturityMatrix';
	import type { IntakeGoalTopic, MaturityGoal, ListCarePlanTopics } from '$lib/types/api';

	interface Props {
		goals: IntakeGoalTopic[];
		onGoalsChange: (goals: IntakeGoalTopic[]) => void;
	}

	let { goals = $bindable([]), onGoalsChange }: Props = $props();

	// Component State
	let maturityTopics = $state<ListCarePlanTopics[]>([]);
	let maturityLoading = $state(false);
	let maturityError = $state('');

	// Local form state
	let selectedTopics = $state<string[]>(untrack(() => goals.map((g) => g.topic_id)));
	let topicLevels = $state<Record<string, number>>({});
	let topicGoals = $state<Record<string, MaturityGoal[]>>({});
	let topicDescriptions = $state<Record<string, string>>({});
	let generatingFor = $state<string | null>(null);

	// Initialize local state from goals prop
	$effect(() => {
		if (goals.length > 0 && Object.keys(topicLevels).length === 0) {
			untrack(() => {
				goals.forEach((g) => {
					topicLevels[g.topic_id] = g.current_level;
					topicGoals[g.topic_id] = g.proposed_goals || [];
					topicDescriptions[g.topic_id] = g.notes || '';
				});
				if (selectedTopics.length === 0) {
					selectedTopics = goals.map((g) => g.topic_id);
				}
			});
		}
	});

	const leftTopics = $derived(maturityTopics.filter((_, i) => i % 2 === 0));
	const rightTopics = $derived(maturityTopics.filter((_, i) => i % 2 === 1));

	// Load maturity topics
	$effect(() => {
		if (maturityTopics.length === 0 && !maturityLoading) {
			untrack(() => {
				maturityLoading = true;
				listMaturityMatrixTopics()
					.then((res) => {
						maturityTopics = res.data;
					})
					.catch((err) => {
						console.error('Failed to load maturity topics:', err);
						maturityError = 'Failed to load maturity topics.';
					})
					.finally(() => {
						maturityLoading = false;
					});
			});
		}
	});

	// Sync local state back to goals prop
	$effect(() => {
		const updatedGoals: IntakeGoalTopic[] = selectedTopics.map((topicId) => {
			const topic = maturityTopics.find((t) => t.id === topicId);
			return {
				assessment_id: untrack(
					() => goals.find((g) => g.topic_id === topicId)?.assessment_id || ''
				),
				topic_id: topicId,
				topic_name: topic?.topic_name || '',
				current_level: topicLevels[topicId] || 3,
				notes: topicDescriptions[topicId] || null,
				proposed_goals: topicGoals[topicId] || []
			};
		});

		untrack(() => {
			onGoalsChange?.(updatedGoals);
			goals = updatedGoals;
		});
	});

	const toggleTopic = (topicId: string) => {
		if (selectedTopics.includes(topicId)) {
			selectedTopics = selectedTopics.filter((id) => id !== topicId);
			return;
		}
		selectedTopics = [...selectedTopics, topicId];
		if (!topicLevels[topicId]) topicLevels[topicId] = 3;
		if (!topicGoals[topicId]) topicGoals[topicId] = [];
	};

	const addGoal = (topicId: string) => {
		const existingGoals = topicGoals[topicId] ?? [];
		topicGoals = {
			...topicGoals,
			[topicId]: [...existingGoals, { title: '', description: '', priority: 'medium' }]
		};
	};

	const removeGoal = (topicId: string, index: number) => {
		const existingGoals = topicGoals[topicId] ?? [];
		topicGoals = {
			...topicGoals,
			[topicId]: existingGoals.filter((_, i) => i !== index)
		};
	};

	const updateGoal = (topicId: string, index: number, updates: Partial<MaturityGoal>) => {
		const existingGoals = topicGoals[topicId] ?? [];
		topicGoals = {
			...topicGoals,
			[topicId]: existingGoals.map((g, i) => (i === index ? { ...g, ...updates } : g))
		};
	};

	const generateGoals = async (topicId: string) => {
		generatingFor = topicId;
		await new Promise((resolve) => setTimeout(resolve, 1500));
		const newGoals: MaturityGoal[] = [
			{
				title: `Improve consistency in ${maturityTopics.find((t) => t.id === topicId)?.topic_name}`,
				description: 'Focused approach on daily routines and self-management.',
				priority: 'medium'
			}
		];
		const existing = topicGoals[topicId] ?? [];
		topicGoals = { ...topicGoals, [topicId]: [...existing, ...newGoals] };
		generatingFor = null;
	};
</script>

<div class="space-y-6">
	{#if maturityLoading}
		<div class="flex flex-col items-center justify-center py-12">
			<Loader2 class="h-8 w-8 animate-spin text-brand" />
			<p class="mt-4 text-sm text-text-muted">Loading topics...</p>
		</div>
	{:else if maturityError}
		<div class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-rose-700">
			{maturityError}
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
		class="mb-4 inline-block w-full break-inside-avoid rounded-2xl border bg-surface p-4 align-top transition-all dark:bg-zinc-900/40 {isSelected
			? 'border-brand/40 shadow-sm ring-1 ring-brand/10'
			: 'border-border/70 hover:border-secondary/30'}"
	>
		<div class="flex items-center justify-between gap-3">
			<div>
				<h3 class="text-base font-bold text-text {isSelected ? 'text-brand' : ''}">
					{topic.topic_name}
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
						{#each topic.level_descriptions as level (level.level)}
							{@const isLevelSelected = topicLevels[topic.id] === level.level}
							<button
								onclick={() => (topicLevels[topic.id] = level.level)}
								class="h-8 flex-1 rounded-lg border text-xs font-bold transition-all {isLevelSelected
									? 'border-brand bg-brand text-white shadow-sm'
									: 'border-border bg-white text-text-muted hover:border-brand/30 hover:text-text'}"
							>
								{level.level}
							</button>
						{/each}
					</div>
					{#if topicLevels[topic.id]}
						{@const currentLevel = topic.level_descriptions.find(
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
									<Plus class="h-3.5 w-3.5" /> Add
								</button>
							</div>
						</div>

						<TextArea
							bind:value={topicDescriptions[topic.id]}
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
												bind:value={goal.title}
												placeholder="Goal title"
												class="h-9 bg-white py-1 text-sm"
											/>
										</div>
										<div class="w-24 shrink-0">
											<select
												bind:value={goal.priority}
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
										bind:value={goal.description}
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
