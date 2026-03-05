<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { m } from '$lib/paraglide/messages';

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
	title={m.process_intake()}
	description={m.process_intake_modal_description()}
	size="md"
>
	{#snippet footer()}
		<div class="flex w-full items-center justify-end gap-2">
			<Button variant="ghost" onclick={handleCancel}>{m.cancel()}</Button>
			<Button onclick={handleSubmit} isLoading={isSaving}>{m.save_decision()}</Button>
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
				<p class="text-sm font-bold text-text">{m.decision_accept()}</p>
				<p class="mt-1 text-xs text-text-muted">{m.decision_accept_description()}</p>
			</button>
			<button
				type="button"
				onclick={() => (decision = 'refuse')}
				class="rounded-2xl border px-4 py-3 text-left transition-colors {decision === 'refuse'
					? 'border-rose-500 bg-rose-500/5'
					: 'border-border bg-surface hover:bg-border/20'}"
			>
				<p class="text-sm font-bold text-text">{m.decision_refuse()}</p>
				<p class="mt-1 text-xs text-text-muted">{m.decision_refuse_description()}</p>
			</button>
		</div>

		<Textarea
			label={m.decision_notes_optional()}
			bind:value={notes}
			placeholder={m.decision_notes_placeholder()}
			rows={4}
		/>
	</div>
</Modal>
