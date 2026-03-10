<script lang="ts">
	import { Save } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

	let {
		open = $bindable(false),
		metadataModalError,
		metadataTitle = $bindable(''),
		metadataDescription = $bindable(''),
		metadataTitleError,
		canSaveMetadata,
		isUpdatingTemplate,
		onSubmit
	}: {
		open: boolean;
		metadataModalError: string | null;
		metadataTitle: string;
		metadataDescription: string;
		metadataTitleError: string | null;
		canSaveMetadata: boolean;
		isUpdatingTemplate: boolean;
		onSubmit: () => void;
	} = $props();

	const formId = 'edit-handbook-metadata-form';
</script>

<Modal
	bind:open
	title="Edit Draft Details"
	description="Update the title and description for the selected draft version."
>
	<form
		id={formId}
		class="space-y-4"
		onsubmit={(event) => {
			event.preventDefault();
			onSubmit();
		}}
	>
		{#if metadataModalError}
			<div
				class="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-700"
			>
				{metadataModalError}
			</div>
		{/if}
		<Input
			label="Title"
			bind:value={metadataTitle}
			error={metadataTitleError ?? undefined}
			placeholder="Handbook title"
		/>
		<Textarea
			id="metadata-description"
			label="Description"
			rows={4}
			bind:value={metadataDescription}
			placeholder="Optional description"
		/>
		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
			<Button
				form={formId}
				type="submit"
				isLoading={isUpdatingTemplate}
				disabled={!canSaveMetadata}
			>
				<Save class="h-4 w-4" />
				Save Details
			</Button>
		</div>
	{/snippet}
</Modal>
