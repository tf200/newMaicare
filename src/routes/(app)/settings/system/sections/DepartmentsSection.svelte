<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { Building2, Pencil, Plus, UserCircle, Users } from 'lucide-svelte';
	import { fromAction } from 'svelte/attachments';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { m } from '$lib/paraglide/messages';
	import type { Department, EmployeeOption } from '../types';
	import {
		createDepartmentSchema,
		type DepartmentSettingsInput
	} from '$lib/schemas/system-settings';

	type DepartmentPayload = {
		name: string;
		description?: string;
		departmentHeadId?: string | null;
	};

	interface Props {
		departments: readonly Department[];
		employees?: readonly EmployeeOption[];
		onCreateDepartment?: (payload: DepartmentPayload) => Promise<void>;
		onUpdateDepartment?: (id: string, payload: DepartmentPayload) => Promise<void>;
	}

	interface DepartmentHeadOption {
		id: string;
		name: string;
	}

	const { departments, employees = [], onCreateDepartment, onUpdateDepartment }: Props = $props();
	const instanceId = $props.id();
	const formId = `${instanceId}-department-form`;
	const nameInputId = `${instanceId}-department-name`;
	const departmentSchema = createDepartmentSchema(m.required_field());

	const columns: DataTableColumn[] = [
		{ key: 'name', label: m.department() },
		{ key: 'description', label: m.description() },
		{ key: 'head', label: m.employee() },
		{ key: 'employeeCount', label: m.employees(), align: 'right', width: '120px' },
		{ key: 'actions', label: m.edit(), align: 'right', width: '72px' }
	];

	let isModalOpen = $state(false);
	let editingDepartmentId = $state<string | null>(null);
	let formError = $state('');
	let formHeadDisplayValue = $state('');
	let loadedEmployeeNameById = $state<Record<string, string>>({});
	let employeeRequestId = 0;

	const { form, errors, enhance, submitting, reset } = superForm(
		defaults(
			{ name: '', description: '', departmentHeadId: '' } satisfies DepartmentSettingsInput,
			valibotClient(departmentSchema)
		),
		{
			SPA: true,
			validators: valibotClient(departmentSchema),
			onUpdate: async ({ form: result }) => {
				if (!result.valid) return;
				formError = '';
				const payload: DepartmentPayload = {
					name: result.data.name,
					description: result.data.description || undefined,
					departmentHeadId: result.data.departmentHeadId || null
				};

				try {
					if (editingDepartmentId) {
						await onUpdateDepartment?.(editingDepartmentId, payload);
					} else {
						await onCreateDepartment?.(payload);
					}
					await invalidate('app:settings-system:departments');
					closeModal();
				} catch (error) {
					formError = error instanceof Error ? error.message : m.failed_update_progress_report();
				}
			}
		}
	);

	const employeeNameById = $derived.by(() => {
		const names: Record<string, string> = { ...loadedEmployeeNameById };
		for (const employee of employees) names[employee.id] = employee.name;
		return names;
	});

	function getEmployeeLabel(employeeId: string | null) {
		if (!employeeId) return m.unassigned();
		return employeeNameById[employeeId] ?? employeeId;
	}

	function mapEmployee(employee: EmployeeListItem): DepartmentHeadOption {
		return { id: employee.id, name: `${employee.first_name} ${employee.last_name}`.trim() };
	}

	async function loadDepartmentHeadOptions(query: string): Promise<DepartmentHeadOption[]> {
		const requestId = ++employeeRequestId;
		const response = await listEmployees({
			page: 1,
			page_size: 50,
			search: query.trim() || undefined
		});
		if (requestId !== employeeRequestId) return [];

		const options = response.data.results.map(mapEmployee);
		loadedEmployeeNameById = {
			...loadedEmployeeNameById,
			...Object.fromEntries(options.map((option) => [option.id, option.name]))
		};
		return options;
	}

	function resetModal() {
		employeeRequestId += 1;
		editingDepartmentId = null;
		formHeadDisplayValue = '';
		formError = '';
		reset();
	}

	function closeModal() {
		isModalOpen = false;
		resetModal();
	}

	function openCreateModal() {
		resetModal();
		isModalOpen = true;
	}

	function openEditModal(department: Department) {
		resetModal();
		editingDepartmentId = department.id;
		$form = {
			name: department.name,
			description: department.description,
			departmentHeadId: department.head ?? ''
		};
		formHeadDisplayValue = getEmployeeLabel(department.head);
		isModalOpen = true;
	}
</script>

{#snippet nameCell(row: Department)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/5 text-brand ring-1 ring-brand/10"
		>
			<Building2 class="h-4 w-4" aria-hidden="true" />
		</div>
		<span class="font-semibold text-text">{row.name}</span>
	</div>
{/snippet}

{#snippet headCell(row: Department)}
	<div class="flex items-center gap-2 text-text-muted">
		<UserCircle class="h-3.5 w-3.5" aria-hidden="true" />
		<span class="text-sm font-medium">{getEmployeeLabel(row.head)}</span>
	</div>
{/snippet}

{#snippet employeeCountCell(row: Department)}
	<div class="flex items-center justify-end gap-2 text-text-muted">
		<Users class="h-3.5 w-3.5" aria-hidden="true" />
		<span class="text-sm font-medium">{row.employeeCount}</span>
	</div>
{/snippet}

{#snippet actionsCell(row: Department)}
	<PermissionGuard permission={PERMISSIONS.SETTINGS.DEPARTMENT.UPDATE}>
		<div class="flex justify-end">
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				aria-label={`${m.edit()} ${row.name}`}
				title={m.edit()}
				onclick={() => openEditModal(row)}
			>
				<Pencil class="h-4 w-4" aria-hidden="true" />
			</button>
		</div>
	</PermissionGuard>
{/snippet}

<DataTable
	title={m.department()}
	description={m.system_settings_departments_description()}
	{columns}
	rows={departments.slice()}
	pagination={false}
	rowKey="id"
	cells={{ name: nameCell, head: headCell, employeeCount: employeeCountCell, actions: actionsCell }}
>
	{#snippet actions()}
		<PermissionGuard permission={PERMISSIONS.SETTINGS.DEPARTMENT.CREATE}>
			<Button class="gap-2 rounded-xl" onclick={openCreateModal}>
				<Plus class="h-4 w-4" aria-hidden="true" />
				{m.create()}
				{m.department()}
			</Button>
		</PermissionGuard>
	{/snippet}
</DataTable>

<Modal
	bind:open={isModalOpen}
	title={editingDepartmentId ? `${m.edit()} ${m.department()}` : `${m.create()} ${m.department()}`}
	description={m.system_settings_department_form_description()}
	closeLabel={m.cancel()}
	onClose={resetModal}
	initialFocus={() => document.getElementById(nameInputId)}
>
	<form id={formId} method="POST" {@attach fromAction(enhance)} class="space-y-4">
		<Input
			id={nameInputId}
			name="name"
			label={m.department()}
			bind:value={$form.name}
			error={$errors.name?.[0]}
			required
			autocomplete="organization-title"
		/>
		<Input
			name="description"
			label={m.description()}
			bind:value={$form.description}
			error={$errors.description?.[0]}
			autocomplete="off"
		/>
		<SearchSelect
			id={`${instanceId}-department-head`}
			label={m.employee()}
			bind:value={$form.departmentHeadId}
			bind:displayValue={formHeadDisplayValue}
			loadOptions={loadDepartmentHeadOptions}
			labelFn={(employee) => employee.name}
			valueFn={(employee) => employee.id}
			placeholder={m.select_employee_placeholder()}
			searchPlaceholder={m.search_employees()}
			loadErrorText={m.failed_load_employees()}
		/>
		{#if formError}
			<InlineErrorBanner
				title={m.system_settings_department_save_error_title()}
				message={formError}
			/>
		{/if}
	</form>

	{#snippet footer()}
		<div class="flex items-center justify-end gap-2">
			<Button type="button" variant="ghost" onclick={closeModal}>{m.cancel()}</Button>
			<Button type="submit" form={formId} isLoading={$submitting} class="px-4">
				{editingDepartmentId ? m.save_changes() : `${m.create()} ${m.department()}`}
			</Button>
		</div>
	{/snippet}
</Modal>
