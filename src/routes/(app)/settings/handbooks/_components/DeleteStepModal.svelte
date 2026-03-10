<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { HandbookStep } from '../types';
	import { getStepSummary } from '../utils';

	let {
		open = $bindable(false),
		deleteStepModalError,
		stepPendingDelete,
		isDeletingStep,
		onSubmit
	}: {
		open: boolean;
		deleteStepModalError: string | null;
		stepPendingDelete: HandbookStep | null;
		isDeletingStep: boolean;
		onSubmit: () => void;
	} = $props();
</script>

<Modal
	bind:open
	title="Delete Draft Step"
	description="Delete the selected step from this draft. Remaining steps will be renumbered automatically."
>
	<div class="space-y-4">
		{#if deleteStepModalError}
			<div
				class="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-700"
			>
				{deleteStepModalError}
			</div>
		{/if}
		{#if stepPendingDelete}
			<div class="rounded-2xl border border-border/60 bg-surface/40 p-4">
				<p class="font-semibold text-text">{stepPendingDelete.title}</p>
				<p class="mt-1 text-sm text-text-muted">{getStepSummary(stepPendingDelete)}</p>
			</div>
		{/if}
		<div class="flex justify-end gap-2 pt-2">
			<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
			<Button variant="destructive" isLoading={isDeletingStep} onclick={onSubmit}>
				Delete Step
			</Button>
		</div>
	</div>
</Modal>
