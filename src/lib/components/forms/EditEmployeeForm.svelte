<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import {
		listEmployees,
		updateEmployee,
		type EmployeeDetail,
		type EmployeeListItem,
		type UpdateEmployeeRequest
	} from '$lib/api/employees';
	import { listLocations } from '$lib/api/locations';
	import { listDepartments } from '$lib/api/settings';
	import { UpdateEmployeeSchema, type UpdateEmployeeSchemaInput } from '$lib/schemas/employee';
	import type { DepartmentItem, OrganizationLocation } from '$lib/types/api';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { m } from '$lib/paraglide/messages';
	import { getToastState } from '$lib/state/toast.svelte';
	import { onMount } from 'svelte';

	interface Props {
		open?: boolean;
		employee: EmployeeDetail | null;
		onUpdated?: () => Promise<void> | void;
	}

	let { open = $bindable(false), employee, onUpdated }: Props = $props();
	const toast = getToastState();
	let errorMessage = $state('');
	let departmentOptions = $state<Array<{ value: string; label: string }>>([]);
	const formId = 'edit-employee-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				first_name: '',
				last_name: '',
				position: '',
				department_id: '',
				manager_employee_id: '',
				employee_number: '',
				private_email_address: '',
				private_phone_number: '',
				work_phone_number: '',
				date_of_birth: '',
				home_telephone_number: '',
				location_id: '',
				gender: 'unknown',
				has_borrowed: false,
				out_of_service: false,
				is_archived: false
			} as UpdateEmployeeSchemaInput,
			valibotClient(UpdateEmployeeSchema)
		),
		{
			validators: valibotClient(UpdateEmployeeSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (!form.valid || !employee) return;
				try {
					const payload: UpdateEmployeeRequest = {
						first_name: form.data.first_name.trim(),
						last_name: form.data.last_name.trim(),
						position: trimToUndefined(form.data.position),
						department_id: trimToUndefined(form.data.department_id),
						manager_employee_id: trimToUndefined(form.data.manager_employee_id),
						employee_number: trimToUndefined(form.data.employee_number),
						private_email_address: trimToUndefined(form.data.private_email_address),
						private_phone_number: trimToUndefined(form.data.private_phone_number),
						work_phone_number: trimToUndefined(form.data.work_phone_number),
						date_of_birth: trimToUndefined(form.data.date_of_birth),
						home_telephone_number: trimToUndefined(form.data.home_telephone_number),
						gender: form.data.gender,
						location_id: trimToUndefined(form.data.location_id),
						has_borrowed: form.data.has_borrowed,
						out_of_service: form.data.out_of_service,
						is_archived: form.data.is_archived
					};
					await updateEmployee(employee.id, payload);
					toast.success(m.employee_updated_success());
					open = false;
					try {
						await onUpdated?.();
					} catch (error) {
						console.error('Failed to refresh after updating employee:', error);
					}
				} catch (error) {
					errorMessage = error instanceof Error ? error.message : 'Failed to update employee.';
				}
			}
		}
	);

	$effect(() => {
		if (!open || !employee) return;
		errorMessage = '';
		reset({
			data: {
				first_name: employee.first_name,
				last_name: employee.last_name,
				position: employee.position ?? '',
				department_id: employee.department_id ?? '',
				manager_employee_id: employee.manager_employee_id ?? '',
				employee_number: employee.employee_number ?? '',
				private_email_address: employee.private_email_address ?? '',
				private_phone_number: employee.private_phone_number ?? '',
				work_phone_number: employee.work_phone_number ?? '',
				date_of_birth: employee.date_of_birth ?? '',
				home_telephone_number: employee.home_telephone_number ?? '',
				gender:
					employee.gender === 'male' || employee.gender === 'female' ? employee.gender : 'unknown',
				location_id: employee.location_id ?? '',
				has_borrowed: employee.has_borrowed,
				out_of_service: employee.out_of_service ?? false,
				is_archived: employee.is_archived
			}
		});
	});

	onMount(async () => {
		try {
			const response = await listDepartments({ pageSize: 100 });
			departmentOptions = response.data.results.map((department: DepartmentItem) => ({
				value: department.id,
				label: department.name
			}));
		} catch {
			departmentOptions = [];
		}
	});

	const loadLocations = async (query: string) =>
		(await listLocations({ search: query, pageSize: 50 })).data.results;
	const loadManagers = async (query: string) =>
		(await listEmployees({ search: query, pageSize: 50 })).data.results.filter(
			(item) => item.id !== employee?.id
		);
	const genderOptions = [
		{ value: 'male', label: m.male() },
		{ value: 'female', label: m.female() },
		{ value: 'other', label: m.other() },
		{ value: 'unknown', label: m.unknown() }
	];
</script>

<Modal
	bind:open
	title="Edit employee"
	description="Update the employee information that can be changed."
	size="4xl"
>
	<form id={formId} use:enhance class="space-y-6">
		{#if errorMessage}<div
				class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
			>
				{errorMessage}
			</div>{/if}
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.personal_information()}
			</h3>
			<div class="grid gap-5 md:grid-cols-2">
				<Input
					label={m.first_name()}
					bind:value={$form.first_name}
					error={formatFormError($errors.first_name)}
					required
				/><Input
					label={m.last_name()}
					bind:value={$form.last_name}
					error={formatFormError($errors.last_name)}
					required
				/><Select
					label={m.gender()}
					bind:value={$form.gender}
					options={genderOptions}
					error={formatFormError($errors.gender)}
				/><DatePicker label={m.date_of_birth()} bind:value={$form.date_of_birth} />
			</div>
		</section>
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.contact_details()}
			</h3>
			<div class="grid gap-5 md:grid-cols-2">
				<Input
					label={m.private_email()}
					type="email"
					bind:value={$form.private_email_address}
					error={formatFormError($errors.private_email_address)}
				/><Input label={m.work_phone()} bind:value={$form.work_phone_number} /><Input
					label={m.private_phone()}
					bind:value={$form.private_phone_number}
				/><Input label={m.home_telephone()} bind:value={$form.home_telephone_number} />
			</div>
		</section>
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.employment_role()}
			</h3>
			<div class="grid gap-5 md:grid-cols-2">
				<Input label={m.position()} bind:value={$form.position} /><Input
					label={m.employee_number()}
					bind:value={$form.employee_number}
				/><Select
					label={m.department()}
					options={departmentOptions}
					bind:value={$form.department_id}
				/><SearchSelect
					label={m.assigned_location()}
					loadOptions={loadLocations}
					bind:value={$form.location_id}
					labelFn={(location: OrganizationLocation) => `${location.name} (${location.city})`}
					valueFn={(location: OrganizationLocation) => location.id}
					placeholder={m.search_location_placeholder()}
				/><SearchSelect
					label={m.manager()}
					loadOptions={loadManagers}
					bind:value={$form.manager_employee_id}
					labelFn={(manager: EmployeeListItem) => `${manager.first_name} ${manager.last_name}`}
					valueFn={(manager: EmployeeListItem) => manager.id}
					placeholder="Search manager"
				/>
			</div>
		</section>
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.status()}
			</h3>
			<div class="grid gap-4 md:grid-cols-3">
				<Checkbox label="Has borrowed equipment" bind:checked={$form.has_borrowed} /><Checkbox
					label={m.out_of_service()}
					bind:checked={$form.out_of_service}
				/><Checkbox label="Archived" bind:checked={$form.is_archived} />
			</div>
		</section>
		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>
	{#snippet footer()}<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={() => (open = false)} disabled={$delayed}
				>{m.cancel()}</Button
			><Button variant="secondary" form={formId} type="submit" isLoading={$delayed}
				>{m.save_changes()}</Button
			>
		</div>{/snippet}
</Modal>
