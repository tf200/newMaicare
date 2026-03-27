<script lang="ts">
	import {
		AlertCircle,
		ArrowDown,
		ArrowUp,
		BookOpen,
		ExternalLink,
		Plus,
		SquarePen,
		Trash2
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { HandbookStep, HandbookTemplateVersion, LoadStatus } from '../types';
	import {
		cardClass,
		getLinkTarget,
		getQuizContent,
		getStepColorClasses,
		getStepIcon,
		getStepSummary
	} from '../utils';

	let {
		selectedVersion,
		selectedVersionSteps,
		selectedVersionStepStatus,
		stepError,
		isDraftVersion,
		isEditMode,
		canEditSelectedDraft,
		reorderingStepId,
		onAddStep,
		onRetry,
		onReorderStep,
		onEditStep,
		onDeleteStep,
		onOpenExternalResource
	}: {
		selectedVersion: HandbookTemplateVersion;
		selectedVersionSteps: HandbookStep[];
		selectedVersionStepStatus: LoadStatus;
		stepError: string | null;
		isDraftVersion: boolean;
		isEditMode: boolean;
		canEditSelectedDraft: boolean;
		reorderingStepId: string | null;
		onAddStep: () => void;
		onRetry: () => void;
		onReorderStep: (stepId: string, direction: 'up' | 'down') => void;
		onEditStep: (step: HandbookStep) => void;
		onDeleteStep: (step: HandbookStep) => void;
		onOpenExternalResource: (url: string) => void;
	} = $props();
</script>

<div class={cardClass}>
	<div class="mb-6 flex items-center justify-between gap-4">
		<div>
			<h3 class="text-lg font-bold text-text">Steps</h3>
			<p class="text-sm text-text-muted">Ordered by backend-owned sort order.</p>
		</div>
		{#if isDraftVersion && isEditMode}
			<Button variant="ghost" class="gap-2" onclick={onAddStep}>
				<Plus class="h-4 w-4" />
				Add Step
			</Button>
		{/if}
	</div>

	{#if selectedVersionSteps.length === 0}
		{#if selectedVersionStepStatus === 'loading' || selectedVersionStepStatus === 'idle'}
			<div class="space-y-4" aria-busy="true">
				{#each [1, 2, 3] as item (item)}
					<div class="h-28 animate-pulse rounded-2xl bg-border/60"></div>
				{/each}
			</div>
		{:else if selectedVersionStepStatus === 'error'}
			<div
				class="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-6 text-sm text-rose-700"
			>
				<p>{stepError ?? 'Failed to load steps for this version.'}</p>
				<div class="mt-4">
					<Button onclick={onRetry}>Retry</Button>
				</div>
			</div>
		{:else}
			<div class="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
				<div
					class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary"
				>
					<BookOpen class="h-7 w-7" />
				</div>
				<h4 class="mt-4 font-bold text-text">No steps yet</h4>
				<p class="mt-2 text-sm text-text-muted">
					{isDraftVersion
						? 'Start the draft by adding the first handbook step.'
						: 'This version does not have any steps returned by the backend.'}
				</p>
				{#if isDraftVersion}
					<Button class="mt-6 gap-2" onclick={onAddStep}>
						<Plus class="h-4 w-4" />
						Add First Step
					</Button>
				{/if}
			</div>
		{/if}
	{:else}
		<div class="space-y-4">
			{#each selectedVersionSteps as step, index (step.id)}
				{@const Icon = getStepIcon(step.kind)}
				{@const stepColors = getStepColorClasses(step.kind)}
				<div class="rounded-2xl border border-border/50 bg-surface/50 p-5">
					<div class="flex items-start gap-4">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {stepColors.bg} {stepColors.text}"
						>
							<Icon class="h-5 w-5" />
						</div>
						<div class="min-w-0 flex-1 space-y-2">
							<div class="flex flex-wrap items-center gap-2">
								<h4 class="font-bold text-text">{step.sortOrder}. {step.title}</h4>
								<span
									class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase {stepColors.badge}"
								>
									{step.kind}
								</span>
								{#if step.isRequired}
									<span
										class="rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success uppercase"
									>
										Required
									</span>
								{/if}
							</div>
							<p class="text-sm text-text-muted">{getStepSummary(step)}</p>
							{#if step.kind === 'quiz'}
								{@const quiz = getQuizContent(step.content)}
								{#if quiz}
									<p class="text-xs text-text-subtle">Question: {quiz.question}</p>
								{/if}
							{/if}
							{#if step.kind === 'link' && getLinkTarget(step)}
								<button
									type="button"
									class="inline-flex items-center gap-2 text-sm font-medium {stepColors.text} hover:underline"
									onclick={() => onOpenExternalResource(getLinkTarget(step))}
								>
									<ExternalLink class="h-4 w-4" />
									Open external resource
								</button>
							{/if}

							{#if canEditSelectedDraft && isEditMode}
								<div
									class="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4"
								>
									<div class="flex items-center gap-2">
										<Button
											variant="ghost"
											class="h-8 gap-1.5 border border-border/50 px-3 text-xs font-semibold text-text-muted hover:border-border/80 hover:text-text"
											title="Move up"
											disabled={index === 0 || reorderingStepId === step.id}
											onclick={() => onReorderStep(step.id, 'up')}
										>
											<ArrowUp class="h-3.5 w-3.5" />
											Move Up
										</Button>
										<Button
											variant="ghost"
											class="h-8 gap-1.5 border border-border/50 px-3 text-xs font-semibold text-text-muted hover:border-border/80 hover:text-text"
											title="Move down"
											disabled={index === selectedVersionSteps.length - 1 ||
												reorderingStepId === step.id}
											onclick={() => onReorderStep(step.id, 'down')}
										>
											<ArrowDown class="h-3.5 w-3.5" />
											Move Down
										</Button>
									</div>
									<div class="flex items-center gap-2">
										<Button
											variant="ghost"
											class="h-8 gap-2 px-3 text-text-muted hover:text-text"
											onclick={() => onEditStep(step)}
										>
											<SquarePen class="h-4 w-4" />
											Edit
										</Button>
										<Button
											variant="ghost"
											class="h-8 gap-2 px-3 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
											onclick={() => onDeleteStep(step)}
										>
											<Trash2 class="h-4 w-4" />
											Delete
										</Button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
