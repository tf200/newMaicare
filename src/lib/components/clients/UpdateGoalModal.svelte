<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import TextArea from '$lib/components/ui/Textarea.svelte';
	import { Loader2, Save, Target, Check, AlertCircle } from 'lucide-svelte';
	import { listMaturityMatrixTopics } from '$lib/api/maturityMatrix';
	import type { UpdateClientGoalRequest, ListCarePlanTopics } from '$lib/types/api';
	import { m } from '$lib/paraglide/messages';
	import { fly } from 'svelte/transition';

	interface GoalToEdit {
		id: string;
		title: string;
		description: string | null;
		priority: 'high' | 'medium' | 'low';
		topic_id: string | null;
	}

	interface Props {
		open: boolean;
		goal: GoalToEdit;
		onSave: (goalId: string, data: UpdateClientGoalRequest) => Promise<void> | void;
		onCancel: () => void;
	}

	let { open = $bindable(false), goal, onSave, onCancel }: Props = $props();

	// Form state
	let selectedTopicId = $state('');
	let title = $state('');
	let description = $state('');
	let priority = $state<'high' | 'medium' | 'low'>('medium');

	// UI state
	let isSaving = $state(false);
	let topics = $state<ListCarePlanTopics[]>([]);
	let topicsLoading = $state(false);
	let topicsError = $state('');

	const canSave = $derived(
		selectedTopicId !== '' && title.trim() !== '' && description.trim() !== ''
	);

	// Reset / pre-fill form when modal opens with a goal
	$effect(() => {
		if (open) {
			selectedTopicId = goal.topic_id ?? '';
			title = goal.title;
			description = goal.description ?? '';
			priority = goal.priority;
			if (topics.length === 0 && !topicsLoading) {
				loadTopics();
			}
		}
	});

	const loadTopics = async () => {
		topicsLoading = true;
		topicsError = '';
		try {
			const res = await listMaturityMatrixTopics();
			topics = res.data;
		} catch (err) {
			console.error('Failed to load topics:', err);
			topicsError = 'Failed to load topics.';
		} finally {
			topicsLoading = false;
		}
	};

	const handleSave = async () => {
		if (!canSave) return;
		isSaving = true;
		try {
			await onSave(goal.id, {
				title: title.trim(),
				description: description.trim(),
				priority,
				topic_id: selectedTopicId,
				sort_order: 0
			});
			open = false;
		} catch (err) {
			console.error('Failed to update goal:', err);
		} finally {
			isSaving = false;
		}
	};

	const selectTopic = (topicId: string) => {
		selectedTopicId = topicId;
	};

	const priorityOptions: { value: 'high' | 'medium' | 'low'; label: string; color: string }[] = [
		{ value: 'high', label: m.high(), color: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
		{ value: 'medium', label: m.medium(), color: 'bg-sky-500/10 text-sky-700 border-sky-500/20' },
		{ value: 'low', label: m.low(), color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20' }
	];

	const selectedTopicName = $derived(
		topics.find((t) => t.id === selectedTopicId)?.topic_name ?? ''
	);
	const selectedPriorityOpt = $derived(priorityOptions.find((o) => o.value === priority));
</script>

<Modal bind:open title={m.edit_goal()} description={m.edit_goal_description()} size="lg">
	{#snippet footer()}
		<div class="flex w-full justify-end gap-3">
			<button
				onclick={onCancel}
				class="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
			>
				{m.cancel()}
			</button>
			<button
				onclick={handleSave}
				disabled={!canSave || isSaving}
				class="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:text-black dark:hover:bg-teal-400"
			>
				{#if isSaving}
					<Loader2 class="h-4 w-4 animate-spin" />
					{m.saving()}
				{:else}
					<Save class="h-4 w-4" />
					{m.save_changes()}
				{/if}
			</button>
		</div>
	{/snippet}

	<div class="space-y-6">
		<!-- Topic Selection -->
		<div>
			<div class="mb-3 flex items-center gap-2">
				<span
					class="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"
				>
					<Target class="h-3.5 w-3.5" />
				</span>
				<div>
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
						{m.select_a_topic()}
					</h3>
					<p class="text-[11px] text-zinc-400">{m.select_a_topic_description()}</p>
				</div>
			</div>

			{#if topicsLoading}
				<div class="flex items-center justify-center py-8">
					<Loader2 class="h-6 w-6 animate-spin text-teal-600" />
					<p class="ml-3 text-sm text-zinc-500">{m.loading_topics()}</p>
				</div>
			{:else if topicsError}
				<div
					class="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300"
				>
					<AlertCircle class="h-4 w-4 shrink-0" />
					{topicsError}
				</div>
			{:else}
				<div class="flex flex-wrap gap-2">
					{#each topics as topic (topic.id)}
						{@const isSelected = selectedTopicId === topic.id}
						<button
							onclick={() => selectTopic(topic.id)}
							class="group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 {isSelected
								? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm ring-1 shadow-teal-500/10 ring-teal-500/20 dark:border-teal-400 dark:bg-teal-500/15 dark:text-teal-300'
								: 'border-zinc-200 bg-white text-zinc-600 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-teal-500/40 dark:hover:bg-teal-500/10'}"
						>
							{#if isSelected}
								<Check class="h-3.5 w-3.5" />
							{/if}
							{topic.topic_name}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Goal Details -->
		{#if selectedTopicId}
			<div class="space-y-4" in:fly={{ y: 10, duration: 250 }}>
				<div
					class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
				>
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white">Goal Details</h3>

					<div class="mt-4 space-y-4">
						<Input
							bind:value={title}
							placeholder={m.goal_title_placeholder()}
							class="h-10 bg-zinc-50 py-1 text-sm dark:bg-zinc-800/50"
						/>
						<TextArea
							bind:value={description}
							placeholder={m.goal_description_placeholder()}
							rows={3}
							class="min-h-[80px] bg-zinc-50 text-sm dark:bg-zinc-800/50"
						/>

						<div>
							<p class="mb-2 ml-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
								{m.priority()}
							</p>
							<div class="flex gap-2">
								{#each priorityOptions as opt (opt.value)}
									{@const isSelected = priority === opt.value}
									<button
										onclick={() => (priority = opt.value)}
										class="flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all {isSelected
											? opt.color + ' shadow-sm'
											: 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600'}"
									>
										{opt.label}
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Preview -->
				<div
					class="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/30"
				>
					<p class="mb-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Preview</p>
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
								{selectedTopicName}
							</span>
							{#if selectedPriorityOpt}
								<span
									class="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase {selectedPriorityOpt.color}"
								>
									{selectedPriorityOpt.label}
								</span>
							{/if}
						</div>
						<p class="text-sm font-bold text-zinc-900 dark:text-white">
							{title || m.goal_title_placeholder()}
						</p>
						{#if description}
							<p class="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</Modal>
