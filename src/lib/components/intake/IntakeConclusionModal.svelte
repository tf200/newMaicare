<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

	type Decision = 'accept' | 'refuse';

	interface Props {
		open: boolean;
		onSave: (payload: {
			decision: Decision;
			intake_conclusion_notes?: string;
		}) => Promise<void> | void;
		onCancel: () => void;
	}

	let { open = $bindable(false), onSave, onCancel }: Props = $props();

	let decision = $state<Decision>('accept');
	let notes = $state('');
	let isSaving = $state(false);

	const resetForm = () => {
		decision = 'accept';
		notes = '';
	};

	const handleCancel = () => {
		resetForm();
		onCancel();
	};

	const handleSubmit = async () => {
		isSaving = true;
		try {
			await onSave({
				decision,
				intake_conclusion_notes: notes.trim() || undefined
			});
			resetForm();
			open = false;
		} finally {
			isSaving = false;
		}
	};
</script>

<Modal
	bind:open
	title="Process intake"
	description="Choose the final decision before this intake can move forward."
	size="md"
>
	{#snippet footer()}
		<div class="flex w-full items-center justify-end gap-2">
			<Button variant="ghost" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleSubmit} isLoading={isSaving}>Save decision</Button>
		</div>
	{/snippet}

	<div class="space-y-5">
		<div class="grid gap-2 sm:grid-cols-2">
			<button
				type="button"
				onclick={() => (decision = 'accept')}
				class="rounded-2xl border px-4 py-3 text-left transition-colors {decision === 'accept'
					? 'border-emerald-500 bg-emerald-500/5'
					: 'border-border bg-surface hover:bg-border/20'}"
			>
				<p class="text-sm font-bold text-text">Accept</p>
				<p class="mt-1 text-xs text-text-muted">Set intake conclusion to suitable.</p>
			</button>
			<button
				type="button"
				onclick={() => (decision = 'refuse')}
				class="rounded-2xl border px-4 py-3 text-left transition-colors {decision === 'refuse'
					? 'border-rose-500 bg-rose-500/5'
					: 'border-border bg-surface hover:bg-border/20'}"
			>
				<p class="text-sm font-bold text-text">Refuse</p>
				<p class="mt-1 text-xs text-text-muted">Set intake conclusion to unsuitable.</p>
			</button>
		</div>

		<Textarea
			label="Decision notes (optional)"
			bind:value={notes}
			placeholder="Explain why this intake is accepted or refused..."
			rows={4}
		/>
	</div>
</Modal>
