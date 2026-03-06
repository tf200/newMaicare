<script lang="ts">
	import type { Department } from '../types';
	import { Building2, Plus, Pencil, Trash2, Users, UserCircle } from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { departments }: { departments: Department[] } = $props();

	const columns: DataTableColumn[] = [
		{ key: 'name', label: 'Department Name' },
		{ key: 'description', label: 'Description' },
		{ key: 'head', label: 'Department Head' },
		{ key: 'employeeCount', label: 'Employees', align: 'right', width: '120px' },
		{ key: 'actions', label: '', align: 'right', width: '100px' }
	];
</script>

{#snippet nameCell(row: Department)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/5 text-indigo-600 ring-1 ring-indigo-500/10"
		>
			<Building2 class="h-4 w-4" />
		</div>
		<span class="font-semibold text-text">{row.name}</span>
	</div>
{/snippet}

{#snippet headCell(row: Department)}
	<div class="flex items-center gap-2 text-text-muted">
		<UserCircle class="h-3.5 w-3.5" />
		<span class="text-sm font-medium">{row.head}</span>
	</div>
{/snippet}

{#snippet employeeCountCell(row: Department)}
	<div class="flex items-center justify-end gap-2 text-text-muted">
		<Users class="h-3.5 w-3.5" />
		<span class="text-sm font-medium">{row.employeeCount}</span>
	</div>
{/snippet}

{#snippet actionsCell()}
	<div class="flex justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title="Edit Department"
		>
			<Pencil class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-rose-600"
			title="Delete Department"
		>
			<Trash2 class="h-4 w-4" />
		</button>
	</div>
{/snippet}

<div class="space-y-6">
	<DataTable
		{columns}
		rows={departments}
		rowKey="id"
		title="Departments"
		description="Manage organizational structure and units."
		cells={{
			name: nameCell,
			head: headCell,
			employeeCount: employeeCountCell,
			actions: actionsCell
		}}
	>
		{#snippet actions()}
			<Button class="gap-2">
				<Plus class="h-4 w-4" />
				Add Department
			</Button>
		{/snippet}
	</DataTable>
</div>
