<script lang="ts">
	import { FileText, CheckSquare, Link, HelpCircle, Plus, Trash2 } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import type { StepFormState, StepModalMode } from '../types';

	let {
		open = $bindable(false),
		stepModalMode,
		stepModalError,
		stepForm = $bindable(),
		stepTitleError,
		stepLinkUrlError,
		stepQuizQuestionError,
		stepQuizOptionsError,
		stepQuizCorrectOptionError,
		canSubmitStep,
		isSubmittingStep,
		onSubmit
	}: {
		open: boolean;
		stepModalMode: StepModalMode;
		stepModalError: string | null;
		stepForm: StepFormState;
		stepTitleError: string | null;
		stepLinkUrlError: string | null;
		stepQuizQuestionError: string | null;
		stepQuizOptionsError: string | null;
		stepQuizCorrectOptionError: string | null;
		canSubmitStep: boolean;
		isSubmittingStep: boolean;
		onSubmit: () => void;
	} = $props();

	const uid = $props.id();
	const formId = `${uid}-step-editor-form`;
	const stepBodyId = `${uid}-step-body`;

	let localQuizOptions = $state<string[]>(['', '']);

	$effect(() => {
		if (open) {
			const incoming = stepForm.quizOptionsText ? stepForm.quizOptionsText.split('\n') : ['', ''];
			if (incoming.join('\n') !== localQuizOptions.join('\n')) {
				localQuizOptions = incoming;
			}
		}
	});

	function updateQuizOptions() {
		stepForm.quizOptionsText = localQuizOptions.join('\n');
	}

	function addQuizOption() {
		localQuizOptions.push('');
		updateQuizOptions();
	}

	function removeQuizOption(index: number) {
		localQuizOptions.splice(index, 1);
		const currentIndex = Number(stepForm.quizCorrectOptionIndex);
		if (currentIndex === index) {
			stepForm.quizCorrectOptionIndex = '0';
		} else if (currentIndex > index) {
			stepForm.quizCorrectOptionIndex = String(currentIndex - 1);
		}
		updateQuizOptions();
	}
</script>

<Modal
	bind:open
	title={stepModalMode === 'edit' ? 'Edit Draft Step' : 'Add Draft Step'}
	description={stepModalMode === 'edit'
		? 'Update the selected draft step.'
		: 'Add a new step to the currently selected draft version.'}
>
	<form
		id={formId}
		class="space-y-6"
		onsubmit={(event) => {
			event.preventDefault();
			onSubmit();
		}}
	>
		{#if stepModalError}
			<div
				class="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-700"
			>
				{stepModalError}
			</div>
		{/if}

		{#if stepModalMode === 'create'}
			<fieldset class="space-y-3">
				<legend class="ml-1 text-sm font-semibold text-text-muted">Step Type</legend>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<button
						type="button"
						onclick={() => (stepForm.kind = 'content')}
						aria-pressed={stepForm.kind === 'content'}
						class={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${stepForm.kind === 'content' ? 'border-brand bg-brand/5 text-brand' : 'border-border/60 bg-surface/40 text-text outline-hidden hover:border-brand/30 hover:bg-surface focus:ring-2 focus:ring-brand/20'}`}
					>
						<FileText size={24} />
						<span class="text-xs font-semibold">Content</span>
					</button>

					<button
						type="button"
						onclick={() => (stepForm.kind = 'ack')}
						aria-pressed={stepForm.kind === 'ack'}
						class={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${stepForm.kind === 'ack' ? 'border-brand bg-brand/5 text-brand' : 'border-border/60 bg-surface/40 text-text outline-hidden hover:border-brand/30 hover:bg-surface focus:ring-2 focus:ring-brand/20'}`}
					>
						<CheckSquare size={24} />
						<span class="text-xs font-semibold whitespace-nowrap">Acknowledge</span>
					</button>

					<button
						type="button"
						onclick={() => (stepForm.kind = 'link')}
						aria-pressed={stepForm.kind === 'link'}
						class={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${stepForm.kind === 'link' ? 'border-brand bg-brand/5 text-brand' : 'border-border/60 bg-surface/40 text-text outline-hidden hover:border-brand/30 hover:bg-surface focus:ring-2 focus:ring-brand/20'}`}
					>
						<Link size={24} />
						<span class="text-xs font-semibold">External Link</span>
					</button>

					<button
						type="button"
						onclick={() => (stepForm.kind = 'quiz')}
						aria-pressed={stepForm.kind === 'quiz'}
						class={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${stepForm.kind === 'quiz' ? 'border-brand bg-brand/5 text-brand' : 'border-border/60 bg-surface/40 text-text outline-hidden hover:border-brand/30 hover:bg-surface focus:ring-2 focus:ring-brand/20'}`}
					>
						<HelpCircle size={24} />
						<span class="text-xs font-semibold">Quiz</span>
					</button>
				</div>
			</fieldset>
		{:else}
			<div
				class="rounded-2xl border border-border/60 bg-surface/40 px-4 py-3 text-sm text-text-muted"
			>
				Step Type: <span class="font-semibold text-text capitalize"
					>{stepForm.kind === 'ack'
						? 'Acknowledgment'
						: stepForm.kind === 'link'
							? 'External Link'
							: stepForm.kind}</span
				>
			</div>
		{/if}

		<div class="space-y-4">
			<Input
				label="Step Title"
				bind:value={stepForm.title}
				error={stepTitleError ?? undefined}
				placeholder="E.g., Welcome to the company"
			/>

			<Textarea
				id={stepBodyId}
				label={stepForm.kind === 'link' ? 'Context / instructions' : 'Body Text'}
				rows={5}
				bind:value={stepForm.body}
				placeholder={stepForm.kind === 'ack'
					? 'Text the employee must read and acknowledge...'
					: stepForm.kind === 'link'
						? 'Optional context before opening the external resource...'
						: stepForm.kind === 'quiz'
							? 'Optional instructions shown before the quiz content...'
							: 'Main content for this step...'}
			/>

			{#if stepForm.kind === 'link'}
				<Input
					label="External URL"
					bind:value={stepForm.linkUrl}
					error={stepLinkUrlError ?? undefined}
					placeholder="https://example.com/resource"
				/>
			{:else if stepForm.kind === 'quiz'}
				<div class="space-y-4 rounded-xl border border-border/80 bg-surface/30 p-4">
					<Input
						label="Quiz Question"
						bind:value={stepForm.quizQuestion}
						error={stepQuizQuestionError ?? undefined}
						placeholder="What should the employee know?"
					/>

					<fieldset class="space-y-3">
						<legend class="ml-1 text-sm font-semibold text-text-muted">Answer Options</legend>
						<div class="space-y-2">
							{#each localQuizOptions as option, index (index)}
								<div class="flex items-center gap-2">
									<label
										for={`${uid}-quiz-option-${index}`}
										class="flex items-center gap-2 rounded-lg px-1 py-1 text-sm text-text-muted"
									>
										<input
											type="radio"
											name={`${uid}-correct-option`}
											class="h-4 w-4 text-brand focus:ring-brand/20"
											checked={String(index) === String(stepForm.quizCorrectOptionIndex)}
											onchange={() => (stepForm.quizCorrectOptionIndex = String(index))}
										/>
										<span class="sr-only">Mark option {index + 1} as correct</span>
									</label>
									<input
										id={`${uid}-quiz-option-${index}`}
										type="text"
										class={`flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text outline-hidden focus:ring-2 focus:ring-brand/20 ${Number(stepForm.quizCorrectOptionIndex) === index ? 'border-brand/40 bg-brand/5' : ''}`}
										value={option}
										placeholder={`Option ${index + 1}`}
										oninput={(event) => {
											localQuizOptions[index] = event.currentTarget.value;
											updateQuizOptions();
										}}
									/>
									<button
										type="button"
										class="rounded-lg p-2 text-text-muted hover:bg-rose-500/10 hover:text-rose-600 focus:ring-2 focus:ring-rose-500/20 focus:outline-hidden disabled:opacity-50"
										onclick={() => removeQuizOption(index)}
										disabled={localQuizOptions.length <= 2}
										title={localQuizOptions.length <= 2
											? 'Minimum 2 options required'
											: 'Remove option'}
									>
										<Trash2 size={18} />
									</button>
								</div>
							{/each}
						</div>

						{#if stepQuizOptionsError}
							<p class="ml-1 text-xs font-medium text-rose-700">{stepQuizOptionsError}</p>
						{/if}

						<button
							type="button"
							class="flex items-center gap-2 rounded-lg py-1.5 pr-3 pl-1 text-sm font-medium text-brand hover:bg-brand/5"
							onclick={addQuizOption}
						>
							<Plus size={16} />
							Add Option
						</button>

						{#if stepQuizCorrectOptionError}
							<p class="ml-1 text-xs font-medium text-rose-700">{stepQuizCorrectOptionError}</p>
						{:else}
							<p class="ml-1 text-xs text-text-subtle">
								Select the radio button next to the correct answer.
							</p>
						{/if}
					</fieldset>
				</div>
			{/if}
		</div>

		<div class="rounded-xl border border-border/60 bg-surface/40 px-4 py-3">
			<Checkbox label="Required step" bind:checked={stepForm.isRequired} />
		</div>

		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
			<Button form={formId} type="submit" isLoading={isSubmittingStep} disabled={!canSubmitStep}>
				{stepModalMode === 'edit' ? 'Save Step' : 'Add Step'}
			</Button>
		</div>
	{/snippet}
</Modal>
