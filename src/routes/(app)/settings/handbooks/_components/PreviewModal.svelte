<script lang="ts">
	import { ExternalLink } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { DepartmentTemplateGroup, HandbookStep, HandbookTemplateVersion } from '../types';
	import { formatVersion, getLinkTarget, getQuizContent } from '../utils';

	let {
		open = $bindable(false),
		selectedDepartmentGroup,
		selectedVersion,
		selectedVersionSteps,
		onOpenExternalResource
	}: {
		open: boolean;
		selectedDepartmentGroup: DepartmentTemplateGroup | null;
		selectedVersion: HandbookTemplateVersion | null;
		selectedVersionSteps: HandbookStep[];
		onOpenExternalResource: (url: string) => void;
	} = $props();
</script>

<Modal
	bind:open
	title="Handbook Preview"
	description="Preview the selected handbook version."
	size="lg"
>
	{#if selectedDepartmentGroup && selectedVersion}
		<div class="space-y-8 p-2">
			<div class="text-center">
				<h2 class="text-3xl font-bold text-text">{selectedVersion.title}</h2>
				<p class="mt-2 text-text-muted">{selectedVersion.description}</p>
				<p class="mt-1 text-xs font-semibold tracking-wide text-text-subtle uppercase">
					{selectedDepartmentGroup.departmentName} - {formatVersion(selectedVersion.version)}
				</p>
			</div>

			<div class="mx-auto max-w-2xl space-y-8">
				{#each selectedVersionSteps as step, index (step.id)}
					<div class="space-y-4 rounded-2xl border border-border/50 bg-surface/50 p-6">
						<div class="flex items-center gap-4">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
							>
								{index + 1}
							</div>
							<div>
								<h3 class="text-xl font-bold text-text">{step.title}</h3>
								<p class="text-xs tracking-wide text-text-subtle uppercase">{step.kind}</p>
							</div>
						</div>

						{#if step.kind === 'link' && getLinkTarget(step)}
							<p class="text-sm whitespace-pre-wrap text-text-muted">{step.body}</p>
							<button
								type="button"
								class="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
								onclick={() => onOpenExternalResource(getLinkTarget(step))}
							>
								<ExternalLink class="h-4 w-4" />
								Open external resource
							</button>
						{:else if step.kind === 'ack'}
							<p class="text-sm whitespace-pre-wrap text-text-muted">
								{step.body || 'No acknowledgment text.'}
							</p>
							<div
								class="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-medium text-brand"
							>
								Acknowledgment required
							</div>
						{:else if step.kind === 'quiz'}
							{@const quiz = getQuizContent(step.content)}
							{#if step.body}
								<p class="text-sm whitespace-pre-wrap text-text-muted">{step.body}</p>
							{/if}
							{#if quiz}
								<div class="space-y-4">
									<p class="font-semibold text-text">{quiz.question}</p>
									<div class="space-y-2">
										{#each quiz.options as option, optionIndex (option)}
											<div
												class="rounded-xl border px-4 py-3 text-sm {optionIndex ===
												quiz.correct_option_index
													? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700'
													: 'border-border/60 bg-surface/40 text-text'}"
											>
												{optionIndex + 1}. {option}
											</div>
										{/each}
									</div>
								</div>
							{:else}
								<p class="text-sm text-text-muted">Quiz content unavailable.</p>
							{/if}
						{:else}
							<p class="text-sm whitespace-pre-wrap text-text-muted">
								{step.body || 'No content provided.'}
							</p>
						{/if}
					</div>
				{/each}
			</div>

			<div class="flex justify-center pt-2">
				<Button onclick={() => (open = false)}>Close Preview</Button>
			</div>
		</div>
	{/if}
</Modal>
