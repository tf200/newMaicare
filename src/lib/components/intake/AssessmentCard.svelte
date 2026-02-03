<script lang="ts">
	import { intakes } from '$lib/api/intakes';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import type { MaturityAssessment, MaturityGoal } from '$lib/types/api';
	import { Loader2, Sparkles, Plus, Trash2, Save } from 'lucide-svelte';

	let { assessment } = $props<{ assessment: MaturityAssessment }>();

	let currentLevel = $state(0);
	let notes = $state('');
	let goals = $state<MaturityGoal[]>([]);
	let lastAssessmentId = $state<number | null>(null);

	$effect(() => {
		if (assessment.id !== lastAssessmentId) {
			currentLevel = assessment.current_level ?? 0;
			notes = assessment.notes ?? '';
			goals = assessment.proposed_goals ?? [];
			lastAssessmentId = assessment.id;
		}
	});

	let isGenerating = $state(false);
	let isSaving = $state(false);
	let message = $state('');

	async function handleGenerateGoals() {
		if (currentLevel === 0) {
			message = 'Please select a level first.';
			return;
		}
		isGenerating = true;
		message = '';
		try {
			// Update local state and backend before generating
			await intakes.updateAssessment(assessment.id, {
				current_level: currentLevel,
				notes,
				proposed_goals: goals
			});

			const res = await intakes.generateGoals(assessment.id);
			if (res.data?.goals) {
				goals = [...goals, ...res.data.goals];
			}
		} catch (e) {
			console.error(e);
			message = 'Failed to generate goals.';
		} finally {
			isGenerating = false;
		}
	}

	async function handleSave() {
		isSaving = true;
		message = '';
		try {
			await intakes.updateAssessment(assessment.id, {
				current_level: currentLevel,
				notes,
				proposed_goals: goals
			});
			message = 'Saved successfully!';
			setTimeout(() => (message = ''), 3000);
		} catch (e) {
			console.error(e);
			message = 'Failed to save.';
		} finally {
			isSaving = false;
		}
	}

	function addGoal() {
		goals = [...goals, { title: '', description: '', priority: 'medium' }];
	}

	function removeGoal(index: number) {
		goals = goals.filter((_, i) => i !== index);
	}
</script>

<div
	class="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md"
>
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-lg font-bold text-text">{assessment.topic_name}</h3>
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-text-muted">Level:</span>
			<select
				bind:value={currentLevel}
				class="rounded-lg border border-border bg-surface px-2 py-1 text-sm font-semibold text-text focus:ring-2 focus:ring-brand/20"
			>
				<option value={0}>Select...</option>
				<option value={1}>1 - Crisis</option>
				<option value={2}>2 - Vulnerable</option>
				<option value={3}>3 - Stable</option>
				<option value={4}>4 - Self-sufficient</option>
				<option value={5}>5 - Thriving</option>
			</select>
		</div>
	</div>

	<div class="mb-4">
		<Textarea placeholder="Assessment notes..." bind:value={notes} rows={2} class="text-sm" />
	</div>

	<div class="mb-4 space-y-3">
		<div class="flex items-center justify-between">
			<span class="text-xs font-bold tracking-wider text-text-subtle uppercase">Goals</span>
			<Button
				variant="ghost"
				onclick={handleGenerateGoals}
				disabled={isGenerating || currentLevel === 0}
			>
				{#if isGenerating}
					<Loader2 class="mr-2 h-3.5 w-3.5 animate-spin" /> Generating...
				{:else}
					<Sparkles class="mr-2 h-3.5 w-3.5 text-brand" /> AI Suggest
				{/if}
			</Button>
		</div>

		{#if goals.length === 0}
			<div
				class="rounded-xl border border-dashed border-border p-4 text-center text-xs text-text-muted"
			>
				No goals set. Use AI Suggest or add manually.
			</div>
		{:else}
			<div class="space-y-3">
				{#each goals as goal, i (i)}
					<div
						class="group relative rounded-xl border border-border bg-zinc-50/50 p-3 transition-colors hover:bg-white"
					>
						<div class="mb-2 flex gap-2">
							<Input
								placeholder="Goal Title"
								bind:value={goals[i].title}
								class="h-8 text-sm font-semibold"
							/>
							<select
								bind:value={goals[i].priority}
								class="h-8 rounded-lg border border-border bg-surface px-2 text-xs font-medium focus:ring-2 focus:ring-brand/20"
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>
						<Textarea
							placeholder="Description..."
							bind:value={goals[i].description}
							rows={2}
							class="text-xs"
						/>
						<button
							onclick={() => removeGoal(i)}
							class="absolute -top-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-sm group-hover:flex hover:bg-rose-200"
						>
							<Trash2 class="h-3.5 w-3.5" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<Button variant="secondary" onclick={addGoal} class="w-full">
			<Plus class="mr-2 h-3.5 w-3.5" /> Add Goal
		</Button>
	</div>

	<div class="flex items-center justify-between border-t border-border pt-4">
		<span class="min-h-5 text-xs font-medium text-emerald-600">
			{message}
		</span>
		<Button onclick={handleSave} disabled={isSaving}>
			{#if isSaving}
				<Loader2 class="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...
			{:else}
				<Save class="mr-2 h-3.5 w-3.5" /> Save Topic
			{/if}
		</Button>
	</div>
</div>
