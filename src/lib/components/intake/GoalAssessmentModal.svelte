<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import GoalAssessmentForm from './GoalAssessmentForm.svelte';
	import { Loader2, Save } from 'lucide-svelte';
	import type { IntakeGoalTopic, CreateIntakeFormGoalsRequest } from '$lib/types/api';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		open: boolean;
		intakeId?: string;
		initialGoals?: IntakeGoalTopic[];
		onSave: (data: CreateIntakeFormGoalsRequest) => Promise<void> | void;
		onCancel: () => void;
	}

	let { open = $bindable(false), intakeId, initialGoals = [], onSave, onCancel }: Props = $props();

	let isSaving = $state(false);
	let currentGoals = $state<IntakeGoalTopic[]>([]);

	$effect(() => {
		if (open) {
			currentGoals = [...initialGoals];
		}
	});

	const handleSave = async () => {
		isSaving = true;
		try {
			const requestData: CreateIntakeFormGoalsRequest = {
				assessments: currentGoals.map((g) => ({
					topic_id: g.topic_id,
					current_level: g.current_level,
					proposed_goals: g.proposed_goals,
					notes: g.notes
				}))
			};
			await onSave(requestData);
			open = false;
		} catch (err) {
			console.error('Failed to save goals:', err);
		} finally {
			isSaving = false;
		}
	};
</script>

<Modal
	bind:open
	title={m.goals_assessments()}
	description={m.assessment_goals_description()}
	size="2xl"
>
	{#snippet footer()}
		<div class="flex w-full justify-end gap-3">
			<button
				onclick={onCancel}
				class="rounded-xl px-4 py-2 text-sm font-semibold text-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800"
			>
				{m.cancel()}
			</button>
			<button
				onclick={handleSave}
				disabled={currentGoals.length === 0 || isSaving}
				class="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isSaving}
					<Loader2 class="h-4 w-4 animate-spin" />
					{m.saving()}
				{:else}
					<Save class="h-4 w-4" />
					{m.save_goals()}
				{/if}
			</button>
		</div>
	{/snippet}

	<GoalAssessmentForm intakeId={intakeId} bind:goals={currentGoals} />
</Modal>
