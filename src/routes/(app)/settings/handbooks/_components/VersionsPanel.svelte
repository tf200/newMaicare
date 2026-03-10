<script lang="ts">
	import { History } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type {
		DepartmentOption,
		DepartmentTemplateGroup,
		HandbookTemplateVersion,
		LoadStatus
	} from '../types';
	import { cardClass, formatVersion, versionMetaLabel, versionStatusTone } from '../utils';

	let {
		selectedDepartment,
		selectedDepartmentGroup,
		selectedDepartmentTemplateStatus,
		templateError,
		selectedVersionId,
		onSelectVersion,
		onRetry
	}: {
		selectedDepartment: DepartmentOption | null;
		selectedDepartmentGroup: DepartmentTemplateGroup | null;
		selectedDepartmentTemplateStatus: LoadStatus;
		templateError: string | null;
		selectedVersionId: string | null;
		onSelectVersion: (versionId: string) => void;
		onRetry: () => void;
	} = $props();
</script>

{#if selectedDepartment}
	<div class={cardClass}>
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-lg font-bold text-text">Versions</h2>
			<History class="h-4 w-4 text-text-muted" />
		</div>

		{#if selectedDepartmentTemplateStatus === 'loading' && !selectedDepartmentGroup}
			<div
				class="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-text-muted"
			>
				Loading versions for {selectedDepartment.name}...
			</div>
		{:else if selectedDepartmentTemplateStatus === 'error'}
			<div
				class="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-6 text-sm text-rose-700"
			>
				<p>{templateError ?? 'Failed to load versions.'}</p>
				<div class="mt-4">
					<Button onclick={onRetry}>Retry</Button>
				</div>
			</div>
		{:else if selectedDepartmentGroup?.versions.length === 0}
			<div
				class="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-text-muted"
			>
				No versions exist for this department yet.
			</div>
		{:else if selectedDepartmentGroup}
			<div class="space-y-2" role="list" aria-label="Handbook versions">
				{#each selectedDepartmentGroup.versions as version (version.id)}
					<button
						type="button"
						onclick={() => onSelectVersion(version.id)}
						aria-current={selectedVersionId === version.id ? 'true' : undefined}
						class="w-full rounded-xl border p-3 text-left transition-all {selectedVersionId ===
						version.id
							? 'border-brand/40 bg-brand/5'
							: 'border-border/40 bg-surface/30 hover:bg-surface/50'}"
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-sm font-bold text-text">{formatVersion(version.version)}</p>
								<p class="text-xs text-text-muted capitalize">{version.status}</p>
								<p class="mt-1 text-[11px] text-text-subtle">{versionMetaLabel(version)}</p>
							</div>
							<span
								class={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${versionStatusTone(version.status)}`}
							>
								{version.status}
							</span>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
