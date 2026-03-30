<script lang="ts">
	import { AlertCircle, Eye, Layers, Plus, Send, SquarePen } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { DepartmentTemplateGroup, HandbookTemplateVersion } from '../types';
	import { cardClass, formatVersion, versionStatusTone } from '../utils';

	let {
		selectedDepartmentGroup,
		selectedVersion,
		isDraftVersion,
		isPublishedVersion,
		isArchivedVersion,
		isEditMode,
		isPublishing,
		canPublishSelectedDraft,
		selectedVersionStepsLength,
		onToggleEditMode,
		onOpenPreview,
		onPublish,
		onCloneDraft,
		onOpenMetadata,
		onAddStep
	}: {
		selectedDepartmentGroup: DepartmentTemplateGroup;
		selectedVersion: HandbookTemplateVersion;
		isDraftVersion: boolean;
		isPublishedVersion: boolean;
		isArchivedVersion: boolean;
		isEditMode: boolean;
		isPublishing: boolean;
		canPublishSelectedDraft: boolean;
		selectedVersionStepsLength: number;
		onToggleEditMode: () => void;
		onOpenPreview: () => void;
		onPublish: () => void;
		onCloneDraft: (version: HandbookTemplateVersion) => void;
		onOpenMetadata: () => void;
		onAddStep: () => void;
	} = $props();
</script>

<div class={cardClass}>
	<div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
		<div class="space-y-3">
			<div class="flex flex-wrap items-center gap-3">
				<h2 class="text-2xl font-bold text-text">{selectedVersion.title}</h2>
				<span
					class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${versionStatusTone(selectedVersion.status)}`}
				>
					{formatVersion(selectedVersion.version)} • {selectedVersion.status}
				</span>
			</div>
			<p class="text-sm text-text-muted">Department: {selectedDepartmentGroup.departmentName}</p>
			<p class="text-text-muted">
				{selectedVersion.description || 'No description provided for this version.'}
			</p>
		</div>

		<div class="flex shrink-0 items-center gap-2">
			{#if isDraftVersion}
				<Button variant="ghost" class="gap-2" onclick={onToggleEditMode}>
					<SquarePen class="h-4 w-4" />
					{isEditMode ? 'Close Edit Mode' : 'Edit Draft'}
				</Button>
				<Button variant="ghost" class="gap-2" onclick={onOpenPreview}>
					<Eye class="h-4 w-4" />
					Preview
				</Button>
				<Button
					isLoading={isPublishing}
					disabled={!canPublishSelectedDraft}
					class="gap-2"
					onclick={onPublish}
				>
					<Send class="h-4 w-4" />
					Publish
				</Button>
			{:else}
				<Button variant="ghost" class="gap-2" onclick={onOpenPreview}>
					<Eye class="h-4 w-4" />
					View
				</Button>
				<Button class="gap-2" onclick={() => onCloneDraft(selectedVersion)}>
					<Layers class="h-4 w-4" />
					New Draft
				</Button>
			{/if}
		</div>
	</div>

	{#if isPublishedVersion || isArchivedVersion}
		<div class="mt-6 rounded-2xl border border-info/20 bg-info/5 p-4 text-sm text-info">
			This version is read-only. To change handbook content, clone it into a new draft for
			{selectedDepartmentGroup.departmentName}.
		</div>
	{/if}

	{#if isDraftVersion && isEditMode}
		<div
			class="mt-6 rounded-3xl border border-brand/20 bg-brand/5 p-6 shadow-sm transition-all hover:border-brand/30"
		>
			<div class="flex items-start gap-4">
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand"
				>
					<SquarePen class="h-6 w-6" />
				</div>
				<div class="flex-1">
					<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<div>
							<h3 class="text-lg font-bold text-brand">Edit Mode Active</h3>
							<p class="mt-1 text-sm text-text-muted">
								You can now update metadata, manage steps, and reorder the flow before publishing.
							</p>
							{#if selectedVersionStepsLength === 0}
								<div
									class="mt-3 flex max-w-fit items-center gap-2 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-xs font-medium text-warning"
								>
									<AlertCircle class="h-4 w-4" />
									Publishing stays disabled until the draft has at least one step.
								</div>
							{/if}
						</div>
						<div class="flex shrink-0 flex-wrap items-center gap-3 md:pt-1">
							<Button
								variant="ghost"
								class="gap-2 border border-brand/20 bg-surface text-brand hover:border-brand/40"
								onclick={onOpenMetadata}
							>
								<SquarePen class="h-4 w-4" />
								Edit Details
							</Button>
							<Button class="gap-2" onclick={onAddStep}>
								<Plus class="h-4 w-4" />
								Add Step
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
