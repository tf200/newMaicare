<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import type { DepartmentOption, DraftModalMode } from '../types';

	let {
		open = $bindable(false),
		draftModalMode,
		draftModalError,
		departments,
		createDraftDepartmentId = $bindable(''),
		createDraftTitle = $bindable(''),
		createDraftDescription = $bindable(''),
		draftTitleError,
		canSubmitDraft,
		isSubmittingDraft,
		onSubmit
	}: {
		open: boolean;
		draftModalMode: DraftModalMode;
		draftModalError: string | null;
		departments: DepartmentOption[];
		createDraftDepartmentId: string;
		createDraftTitle: string;
		createDraftDescription: string;
		draftTitleError: string | null;
		canSubmitDraft: boolean;
		isSubmittingDraft: boolean;
		onSubmit: () => void;
	} = $props();

	const formId = 'create-handbook-draft-form';
</script>

<Modal
	bind:open
	title={draftModalMode === 'clone' ? 'Create Draft From Version' : 'Create Handbook Draft'}
	description={draftModalMode === 'clone'
		? 'Creates a new editable draft by cloning the selected version and all of its steps.'
		: 'Creates a new empty draft version for the selected department.'}
>
	<form
		id={formId}
		class="space-y-4"
		onsubmit={(event) => {
			event.preventDefault();
			onSubmit();
		}}
	>
		{#if draftModalError}
			<div
				class="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-700"
			>
				{draftModalError}
			</div>
		{/if}
		{#if draftModalMode === 'create'}
			<Select
				label="Department"
				options={departments.map((department) => ({
					label: department.name,
					value: department.id
				}))}
				bind:value={createDraftDepartmentId}
			/>
			<Input
				label="Title"
				bind:value={createDraftTitle}
				error={draftTitleError ?? undefined}
				placeholder="Handbook title"
			/>
			<Textarea
				id="create-draft-description"
				label="Description"
				rows={4}
				bind:value={createDraftDescription}
				placeholder="Optional description for this version"
			/>
		{:else}
			<div class="rounded-2xl border border-border/60 bg-surface/40 p-4 text-sm text-text-muted">
				<p class="text-xs font-semibold tracking-wide text-text-subtle uppercase">Department</p>
				<p class="mt-1 font-semibold text-text">
					{departments.find((department) => department.id === createDraftDepartmentId)?.name ??
						'Selected department'}
				</p>
			</div>
			<div class="rounded-2xl border border-border/60 bg-surface/40 p-4 text-sm text-text-muted">
				<p class="font-semibold text-text">{createDraftTitle}</p>
				<p class="mt-1">{createDraftDescription || 'No description on the source version.'}</p>
			</div>
		{/if}
		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
			<Button form={formId} type="submit" isLoading={isSubmittingDraft} disabled={!canSubmitDraft}>
				{draftModalMode === 'clone' ? 'Clone Draft' : 'Create Draft'}
			</Button>
		</div>
	{/snippet}
</Modal>
