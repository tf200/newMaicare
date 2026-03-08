<script lang="ts">
	import type { Department, EmployeeOption } from '../types';
	import { Building2, Plus, Pencil, Trash2, Users, UserCircle } from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';

	let {
		departments = $bindable(),
		employees = [],
		onCreateDepartment,
		onUpdateDepartment
	}: {
		departments: Department[];
		employees?: EmployeeOption[];
		onCreateDepartment?: (payload: {
			name: string;
			description?: string;
			departmentHeadId?: string | null;
		}) => Promise<Department>;
		onUpdateDepartment?: (
			id: string,
			payload: {
				name?: string;
				description?: string;
				departmentHeadId?: string | null;
			}
		) => Promise<Department>;
	} = $props();

	const columns: DataTableColumn[] = [
		{ key: 'name', label: 'Department Name' },
		{ key: 'description', label: 'Description' },
		{ key: 'head', label: 'Department Head' },
		{ key: 'employeeCount', label: 'Employees', align: 'right', width: '120px' },
		{ key: 'actions', label: '', align: 'right', width: '100px' }
	];

	let isModalOpen = $state(false);
	let isSaving = $state(false);
	let formError = $state('');
	let editingDepartmentId = $state<string | null>(null);
	let formName = $state('');
	let formDescription = $state('');
	let formHeadId = $state('');
	let formHeadDisplayValue = $state('');
	let loadedEmployeeNameById = $state<Record<string, string>>({});

	interface DepartmentHeadOption {
		id: string;
		name: string;
	}

	const EMPLOYEE_PAGE_SIZE = 50;
	const MAX_EMPLOYEE_OPTION_PAGES = 10;

	const employeeNameById = $derived.by(() => {
		const names: Record<string, string> = { ...loadedEmployeeNameById };
		for (const employee of employees) {
			names[employee.id] = employee.name;
		}
		return names;
	});

	function getEmployeeLabel(employeeId: string | null) {
		if (!employeeId) return 'Unassigned';
		return employeeNameById[employeeId] ?? employeeId;
	}

	function mapEmployeeToHeadOption(employee: EmployeeListItem): DepartmentHeadOption {
		return {
			id: employee.id,
			name: `${employee.first_name} ${employee.last_name}`.trim()
		};
	}

	async function loadDepartmentHeadOptions(query: string): Promise<DepartmentHeadOption[]> {
		const options: DepartmentHeadOption[] = [];
		let page = 1;
		let hasNextPage = true;

		while (hasNextPage && page <= MAX_EMPLOYEE_OPTION_PAGES) {
			const response = await listEmployees({
				page,
				page_size: EMPLOYEE_PAGE_SIZE,
				search: query.trim() || undefined
			});

			const mappedOptions = response.data.results.map(mapEmployeeToHeadOption);
			options.push(...mappedOptions);

			const pageEmployeeNames: Record<string, string> = {};
			for (const option of mappedOptions) {
				pageEmployeeNames[option.id] = option.name;
			}
			loadedEmployeeNameById = { ...loadedEmployeeNameById, ...pageEmployeeNames };

			hasNextPage = Boolean(response.data.next);
			page += 1;
		}

		return options;
	}

	function openCreateModal() {
		editingDepartmentId = null;
		formName = '';
		formDescription = '';
		formHeadId = '';
		formHeadDisplayValue = '';
		formError = '';
		isModalOpen = true;
	}

	function openEditModal(department: Department) {
		editingDepartmentId = department.id;
		formName = department.name;
		formDescription = department.description;
		formHeadId = department.head ?? '';
		formHeadDisplayValue = getEmployeeLabel(department.head);
		formError = '';
		isModalOpen = true;
	}

	async function handleSubmit() {
		if (!formName.trim()) {
			formError = 'Department name is required.';
			return;
		}
		isSaving = true;
		formError = '';
		try {
			if (editingDepartmentId) {
				if (!onUpdateDepartment) return;
				const updated = await onUpdateDepartment(editingDepartmentId, {
					name: formName.trim(),
					description: formDescription.trim() || undefined,
					departmentHeadId: formHeadId.trim() || null
				});
				departments = departments.map((dept) =>
					dept.id === updated.id ? updated : dept
				);
			} else {
				if (!onCreateDepartment) return;
				const created = await onCreateDepartment({
					name: formName.trim(),
					description: formDescription.trim() || undefined,
					departmentHeadId: formHeadId.trim() || null
				});
				departments = [...departments, created];
			}
			isModalOpen = false;
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Unable to save department.';
		} finally {
			isSaving = false;
		}
	}
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
		<span class="text-sm font-medium">{getEmployeeLabel(row.head)}</span>
	</div>
{/snippet}

{#snippet employeeCountCell(row: Department)}
	<div class="flex items-center justify-end gap-2 text-text-muted">
		<Users class="h-3.5 w-3.5" />
		<span class="text-sm font-medium">{row.employeeCount}</span>
	</div>
{/snippet}

{#snippet actionsCell(row: Department)}
	<div class="flex justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title="Edit Department"
			onclick={() => openEditModal(row)}
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
		title="Departments"
		description="Manage organizational structure and units."
		{columns}
		rows={departments}
		rowKey="id"
		cells={{
			name: nameCell,
			head: headCell,
			employeeCount: employeeCountCell,
			actions: actionsCell
		}}
	>
		{#snippet actions()}
			<Button class="gap-2 rounded-xl" onclick={openCreateModal}>
				<Plus class="h-4 w-4" />
				Add Department
			</Button>
		{/snippet}
	</DataTable>
</div>

<Modal
	bind:open={isModalOpen}
	title={editingDepartmentId ? 'Edit Department' : 'Add Department'}
	description="Set the team details and head employee ID"
>
	<div class="space-y-4">
		<Input label="Department name" bind:value={formName} />
		<Input label="Description" bind:value={formDescription} />
		<SearchSelect
			label="Department head"
			bind:value={formHeadId}
			bind:displayValue={formHeadDisplayValue}
			loadOptions={loadDepartmentHeadOptions}
			labelFn={(employee) => employee.name}
			valueFn={(employee) => employee.id}
			placeholder="Select employee"
		/>
		{#if formError}
			<p class="text-xs font-medium text-rose-600">{formError}</p>
		{/if}
	</div>
	{#snippet footer()}
		<div class="flex items-center justify-end gap-2">
			<Button variant="ghost" onclick={() => (isModalOpen = false)}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} isLoading={isSaving} class="px-4">
				{editingDepartmentId ? 'Save Changes' : 'Create Department'}
			</Button>
		</div>
	{/snippet}
</Modal>
