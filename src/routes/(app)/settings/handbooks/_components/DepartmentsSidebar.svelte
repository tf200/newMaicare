<script lang="ts">
	import type { DepartmentOption, DepartmentTemplateGroup, LoadStatus } from '../types';
	import { cardClass } from '../utils';

	let {
		departments,
		departmentTemplates,
		selectedDepartmentId,
		templateStatusByDepartmentId,
		onSelectDepartment
	}: {
		departments: DepartmentOption[];
		departmentTemplates: DepartmentTemplateGroup[];
		selectedDepartmentId: string | null;
		templateStatusByDepartmentId: Record<string, LoadStatus>;
		onSelectDepartment: (departmentId: string) => void;
	} = $props();
</script>

<div class={cardClass}>
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-lg font-bold text-text">Departments</h2>
		<span class="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-bold text-secondary">
			{departments.length}
		</span>
	</div>

	{#if departments.length === 0}
		<div
			class="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-text-muted"
		>
			Loading handbook templates...
		</div>
	{:else}
		<div class="space-y-3" role="list" aria-label="Departments">
			{#each departments as department (department.id)}
				{@const group =
					departmentTemplates.find((candidate) => candidate.departmentId === department.id) ?? null}
				{@const templateStatus = templateStatusByDepartmentId[department.id] ?? 'idle'}
				<button
					type="button"
					onclick={() => onSelectDepartment(department.id)}
					aria-pressed={selectedDepartmentId === department.id}
					class="w-full rounded-2xl border p-4 text-left transition-all {selectedDepartmentId ===
					department.id
						? 'border-secondary bg-secondary/5 ring-1 ring-secondary/20'
						: 'border-border/50 bg-surface/40 hover:border-secondary/30'}"
				>
					<div class="flex items-center justify-between gap-3">
						<div>
							<h3
								class="font-bold {selectedDepartmentId === department.id
									? 'text-secondary'
									: 'text-text'}"
							>
								{department.name}
							</h3>
							<p class="mt-1 text-xs text-text-muted">
								{templateStatus === 'loading'
									? 'Loading versions...'
									: templateStatus === 'error'
										? 'Failed to load versions'
										: group
											? group.versions.length === 0
												? 'No template versions yet'
												: `${group.versions.length} version${group.versions.length === 1 ? '' : 's'}`
											: 'Open to load versions'}
							</p>
						</div>
						{#if group?.versions.find((version) => version.status === 'draft')}
							<span
								class="rounded-full bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning uppercase"
							>
								Draft
							</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
