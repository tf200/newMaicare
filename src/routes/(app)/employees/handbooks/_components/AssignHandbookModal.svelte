<script lang="ts">
	import { CircleAlert } from 'lucide-svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { listEligibleHandbookEmployees } from '$lib/api/handbooks';
	import type { EligibleHandbookEmployeeApi } from '$lib/types/api';
	import type { EmployeeHandbookAssignment, HandbookTemplate } from '../+page';

	type DepartmentOption = { value: string; label: string };

	type Props = {
		open?: boolean;
		assignments: EmployeeHandbookAssignment[];
		departmentOptions: DepartmentOption[];
		templates: HandbookTemplate[];
		selectedEmployeeId: string;
		selectedEmployeeName: string;
		selectedDepartmentId: string;
		selectedTemplateId: string;
		isAssigning: boolean;
		isLoadingTemplates: boolean;
		loadErrorMessage: string | null;
		submitLabel: string;
		onEmployeeChange: (employeeId: string, departmentId: string | null) => void;
		onTemplateChange: (value: string) => void;
		onAssign: () => void;
	};

	let {
		open = $bindable(false),
		assignments,
		departmentOptions,
		templates,
		selectedEmployeeId,
		selectedEmployeeName,
		selectedDepartmentId,
		selectedTemplateId,
		isAssigning,
		isLoadingTemplates,
		loadErrorMessage,
		submitLabel,
		onEmployeeChange,
		onTemplateChange,
		onAssign
	}: Props = $props();

	const ALL_DEPARTMENTS_OPTION: DepartmentOption = {
		value: '',
		label: 'All Departments'
	};

	const getTemplateOptions = (tmplList: HandbookTemplate[]) =>
		tmplList.map((t) => ({ value: t.id, label: `${t.title} (v${t.version})` }));
	const getEmployeeName = (employee: EligibleHandbookEmployeeApi) =>
		`${employee.first_name?.trim() ?? ''} ${employee.last_name?.trim() ?? ''}`.trim() ||
		'Unknown employee';
	const getEmployeeDepartment = (employee: EligibleHandbookEmployeeApi) =>
		employee.department_name?.trim() || 'No department';
	const toLookupEntry = (assignment: EmployeeHandbookAssignment): EligibleHandbookEmployeeApi => {
		const [firstName = '', ...rest] = assignment.employee_name.trim().split(/\s+/);
		return {
			employee_id: assignment.employee_id,
			first_name: firstName,
			last_name: rest.join(' '),
			department_id: assignment.department_id,
			department_name: assignment.department_name
		};
	};

	const selectedTemplateInfo = $derived(templates.find((t) => t.id === selectedTemplateId));
	const employeeHasAssignment = $derived(
		assignments.some(
			(assignment) =>
				assignment.employee_id === selectedEmployeeId && assignment.employee_handbook_id
		)
	);
	const modalDepartmentOptions = $derived([ALL_DEPARTMENTS_OPTION, ...departmentOptions]);

	let activeDepartmentId = $state('');
	let employeeDisplayValue = $state('');
	let employeeLoadError = $state<string | null>(null);
	let employeeLookup = $state<Record<string, EligibleHandbookEmployeeApi>>({});

	function createInitialEmployeeLookup() {
		const preselectedAssignment = assignments.find(
			(assignment) => assignment.employee_id === selectedEmployeeId
		);
		return preselectedAssignment
			? { [preselectedAssignment.employee_id]: toLookupEntry(preselectedAssignment) }
			: {};
	}

	function getInitialDepartmentId() {
		return selectedDepartmentId;
	}

	function getInitialEmployeeDisplayValue() {
		return selectedEmployeeName;
	}

	activeDepartmentId = getInitialDepartmentId();
	employeeDisplayValue = getInitialEmployeeDisplayValue();
	employeeLookup = createInitialEmployeeLookup();

	function cacheEmployees(employees: EligibleHandbookEmployeeApi[]) {
		const nextLookup = { ...employeeLookup };
		for (const employee of employees) {
			nextLookup[employee.employee_id] = employee;
		}
		employeeLookup = nextLookup;
	}

	function getEmployeesFromResponseData(
		data:
			| { results?: EligibleHandbookEmployeeApi[] }
			| EligibleHandbookEmployeeApi[]
			| null
			| undefined
	) {
		if (Array.isArray(data)) return data;
		return Array.isArray(data?.results) ? data.results : [];
	}

	async function loadEmployeeOptions(query: string) {
		employeeLoadError = null;
		try {
			const response = await listEligibleHandbookEmployees({
				page: 1,
				pageSize: 25,
				departmentId: activeDepartmentId || undefined,
				search: query.trim() || undefined
			});
			const employees = getEmployeesFromResponseData(response.data);
			cacheEmployees(employees);
			return employees;
		} catch (error) {
			employeeLoadError =
				error instanceof Error ? error.message : 'Failed to load eligible employees.';
			return [];
		}
	}

	function handleDepartmentChange(value: string) {
		activeDepartmentId = value;
		employeeDisplayValue = '';
		employeeLoadError = null;
		onEmployeeChange('', null);
	}

	function handleEmployeeChange(value: string) {
		const employee = employeeLookup[value];
		employeeDisplayValue = employee ? getEmployeeName(employee) : '';
		onEmployeeChange(value, employee?.department_id ?? null);
	}
</script>

{#snippet employeeOption(employee: EligibleHandbookEmployeeApi)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{getEmployeeName(employee)}</span>
		<span class="text-xs text-text-muted">{getEmployeeDepartment(employee)}</span>
	</div>
{/snippet}

<Modal
	bind:open
	title={submitLabel}
	description="Select an employee and a published handbook template version."
>
	<div class="space-y-4 py-4">
		<div class="space-y-2">
			<label for="department-filter" class="text-sm font-semibold text-text">Department</label>
			<Select
				id="department-filter"
				className="w-full"
				placeholder="All Departments"
				options={modalDepartmentOptions}
				value={activeDepartmentId}
				onchange={handleDepartmentChange}
			/>
		</div>

		<div class="space-y-2">
			<label for="employee-select" class="text-sm font-semibold text-text">Employee</label>
			<SearchSelect
				id="employee-select"
				className="w-full"
				value={selectedEmployeeId}
				displayValue={employeeDisplayValue}
				loadOptions={loadEmployeeOptions}
				labelFn={getEmployeeName}
				valueFn={(employee) => employee.employee_id}
				item={employeeOption}
				placeholder="Search employees..."
				searchPlaceholder="Search eligible employees..."
				onchange={handleEmployeeChange}
			/>
			{#if employeeLoadError}
				<p class="text-xs font-medium text-rose-600">{employeeLoadError}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<label for="template-select" class="text-sm font-semibold text-text">Handbook Template</label>
			<Select
				id="template-select"
				placeholder={isLoadingTemplates ? 'Loading templates...' : 'Select template version...'}
				options={getTemplateOptions(templates)}
				value={selectedTemplateId}
				onchange={onTemplateChange}
			/>
			{#if loadErrorMessage}
				<p class="text-xs font-medium text-rose-600">{loadErrorMessage}</p>
			{:else if selectedEmployeeId && !isLoadingTemplates && templates.length === 0}
				<p class="text-xs font-medium text-text-muted">
					No published templates are available for this employee's department.
				</p>
			{/if}
			{#if selectedTemplateInfo}
				<p class="mt-1 text-xs text-text-muted">
					{selectedTemplateInfo.description}
					{#if selectedTemplateInfo.steps_count > 0}
						• {selectedTemplateInfo.steps_count} steps
					{/if}
				</p>
			{/if}
		</div>

		<div class="mt-4 rounded-xl border border-orange-500/10 bg-orange-500/5 p-3">
			<div class="flex gap-2 text-orange-600 dark:text-orange-400">
				<CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
				<p class="text-xs font-medium">
					{employeeHasAssignment
						? "Assigning this template will automatically waive the employee's current active handbook first."
						: 'This will create a new handbook assignment and start the employee in a not started state.'}
				</p>
			</div>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
			<Button
				variant="secondary"
				onclick={onAssign}
				disabled={!selectedEmployeeId || !selectedTemplateId || isAssigning || isLoadingTemplates}
				isLoading={isAssigning}
			>
				{submitLabel}
			</Button>
		</div>
	{/snippet}
</Modal>
