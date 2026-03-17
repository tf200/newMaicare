<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

	type Props = {
		open: boolean;
		reason: string;
		errorMessage: string | null;
		isSubmitting: boolean;
		onOpenChange: (open: boolean) => void;
		onReasonChange: (value: string) => void;
		onSubmit: () => void;
	};

	let { open, reason, errorMessage, isSubmitting, onOpenChange, onReasonChange, onSubmit }: Props =
		$props();

	let isOpen = $state(false);
	$effect(() => {
		isOpen = open;
	});
	$effect(() => {
		onOpenChange(isOpen);
	});
</script>

<Modal
	bind:open={isOpen}
	title="Waive handbook"
	description="Optionally capture why this active handbook is being waived."
	size="md"
>
	<div class="space-y-4 py-4">
		<div class="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4">
			<div class="flex gap-3 text-orange-700 dark:text-orange-300">
				<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
				<p class="text-sm font-medium">
					Only active handbooks can be waived. This action records a lifecycle history event.
				</p>
			</div>
		</div>

		<div class="space-y-2">
			<label for="waive-reason" class="text-sm font-semibold text-text">Reason (optional)</label>
			<Textarea
				id="waive-reason"
				rows={4}
				placeholder="Assigned by mistake, employee transferred, duplicate process..."
				value={reason}
				oninput={(event) => onReasonChange(event.currentTarget.value)}
			/>
			<p class="text-xs font-medium text-text-muted">
				If provided, the reason is stored in handbook history metadata.
			</p>
		</div>

		{#if errorMessage}
			<p class="text-sm font-medium text-rose-600">{errorMessage}</p>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={() => onOpenChange(false)} disabled={isSubmitting}
				>Cancel</Button
			>
			<Button
				variant="secondary"
				onclick={onSubmit}
				isLoading={isSubmitting}
				disabled={isSubmitting}
			>
				Waive handbook
			</Button>
		</div>
	{/snippet}
</Modal>
