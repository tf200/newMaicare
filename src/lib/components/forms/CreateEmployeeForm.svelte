<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import { Plus } from 'lucide-svelte';
	import { createEmployee, type CreateEmployeeRequest } from '$lib/api/employees';
	import { listRoles, type RoleListItem } from '$lib/api/roles';
	import { listLocations } from '$lib/api/locations';
	import { listDepartments } from '$lib/api/settings';
	import type { OrganizationLocation } from '$lib/types/api';
	import type { DepartmentItem } from '$lib/types/api';
	import { EmployeeSchema, type EmployeeSchemaInput } from '$lib/schemas/employee';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { m } from '$lib/paraglide/messages';
	import { onMount } from 'svelte';

	let { open = $bindable(false), onCreated } = $props<{
		open?: boolean;
		onCreated?: () => void;
	}>();

	let errorMessage = $state('');
	let rolesCache = $state<RoleListItem[]>([]);
	let departmentOptions = $state<Array<{ value: string; label: string }>>([]);
	const formId = 'create-employee-form';
	const toOptionalNumber = (value: string | number | undefined): number | undefined => {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : undefined;
		}

		const normalized = value?.replace(',', '.').trim();
		if (!normalized) return undefined;

		const parsed = Number.parseFloat(normalized);
		return Number.isFinite(parsed) ? parsed : undefined;
	};

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				gender: 'not_specified',
				contract_type: 'none',
				department_id: ''
			} as unknown as EmployeeSchemaInput,
			valibotClient(EmployeeSchema)
		),
		{
			validators: valibotClient(EmployeeSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid) {
					try {
						const payload: CreateEmployeeRequest = {
							first_name: form.data.first_name.trim(),
							last_name: form.data.last_name.trim(),
							bsn: form.data.bsn.trim(),
							street: form.data.street.trim(),
							house_number: form.data.house_number.trim(),
							postal_code: form.data.postal_code.trim(),
							city: form.data.city.trim(),
							work_email_address: form.data.work_email_address.trim(),
							gender: form.data.gender,
							contract_type: form.data.contract_type,
							role_id: form.data.role_id.trim(),
							house_number_addition: trimToUndefined(form.data.house_number_addition),
							employee_number: trimToUndefined(form.data.employee_number),
							employment_number: trimToUndefined(form.data.employment_number),
							location_id: trimToUndefined(form.data.location_id),
							position: trimToUndefined(form.data.position),
							department_id: trimToUndefined(form.data.department_id),
							private_email_address: trimToUndefined(form.data.private_email_address),
							work_phone_number: trimToUndefined(form.data.work_phone_number),
							private_phone_number: trimToUndefined(form.data.private_phone_number),
							date_of_birth: trimToUndefined(form.data.date_of_birth),
							home_telephone_number: trimToUndefined(form.data.home_telephone_number),
							contract_hours: toOptionalNumber(form.data.contract_hours),
							contract_start_date: trimToUndefined(form.data.contract_start_date),
							contract_end_date: trimToUndefined(form.data.contract_end_date),
							contract_rate: toOptionalNumber(form.data.contract_rate)
						};

						await createEmployee(payload);
						reset();
						onCreated?.();
						open = false;
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : m.failed_create_employee();
					}
				}
			}
		}
	);

	// Options
	const genderOptions = [
		{ value: 'male', label: m.male() },
		{ value: 'female', label: m.female() },
		{ value: 'not_specified', label: m.not_specified() }
	];

	const contractTypeOptions = [
		{ value: 'loondienst', label: m.loondienst_full_time() },
		{ value: 'ZZP', label: m.zzp_freelance() },
		{ value: 'none', label: m.none() }
	];

	const handleCancel = () => {
		reset();
		open = false;
	};

	const loadRoles = async (query: string) => {
		if (rolesCache.length === 0) {
			const res = await listRoles();
			rolesCache = res.data;
		}

		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) return rolesCache;

		return rolesCache.filter((role) => role.role_name.toLowerCase().includes(normalizedQuery));
	};

	const loadLocations = async (query: string) => {
		const res = await listLocations({ search: query, pageSize: 50 });
		return res.data.results;
	};

	onMount(async () => {
		try {
			const res = await listDepartments({ pageSize: 100 });
			departmentOptions = res.data.results
				.map((department: DepartmentItem) => ({
					value: department.id,
					label: department.name
				}))
				.filter((department) => department.label.trim().length > 0);
		} catch (error) {
			console.error(error);
			departmentOptions = [];
		}
	});
</script>

{#snippet roleItem(option: RoleListItem)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.role_name}</span>
		<span class="text-xs text-text-muted">
			{m.permissions_count({ count: option.permission_count })}
		</span>
	</div>
{/snippet}

{#snippet locationItem(option: OrganizationLocation)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex flex-col gap-0.5 text-xs text-text-muted">
			<span>{option.street} {option.house_number}, {option.city}</span>
			<span class="{option.available > 0 ? 'text-emerald-600' : 'text-rose-600'} font-medium">
				{m.spots_available({ count: option.available })}
			</span>
		</div>
	</div>
{/snippet}

<Modal
	bind:open
	title={m.add_new_employee()}
	description={m.add_new_employee_description()}
	size="4xl"
>
	<form id={formId} use:enhance class="space-y-6">
		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}

		<!-- Section: Personal Information -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.personal_information()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label={m.first_name()}
					placeholder={m.example_first_name()}
					bind:value={$form.first_name}
					error={formatFormError($errors.first_name)}
					required
				/>
				<Input
					label={m.last_name()}
					placeholder={m.example_last_name()}
					bind:value={$form.last_name}
					error={formatFormError($errors.last_name)}
					required
				/>
				<Input
					label={m.bsn()}
					placeholder={m.example_bsn()}
					bind:value={$form.bsn}
					error={formatFormError($errors.bsn)}
					required
				/>
				<Select
					label={m.gender()}
					bind:value={$form.gender}
					options={genderOptions}
					placeholder={m.select_gender()}
					error={formatFormError($errors.gender)}
				/>
				<DatePicker label={m.date_of_birth()} bind:value={$form.date_of_birth} />
			</div>
		</section>

		<!-- Section: Contact Details -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.contact_details()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label={m.work_email()}
					type="email"
					placeholder={m.placeholder_work_email()}
					bind:value={$form.work_email_address}
					error={formatFormError($errors.work_email_address)}
					required
				/>
				<Input
					label={m.private_email()}
					type="email"
					placeholder={m.placeholder_private_email()}
					bind:value={$form.private_email_address}
					error={formatFormError($errors.private_email_address)}
				/>
				<Input
					label={m.work_phone()}
					placeholder={m.example_phone_nl()}
					bind:value={$form.work_phone_number}
				/>
				<Input
					label={m.private_phone()}
					placeholder={m.example_phone_nl()}
					bind:value={$form.private_phone_number}
				/>
				<Input
					label={m.home_telephone()}
					placeholder={m.example_phone_nl()}
					bind:value={$form.home_telephone_number}
				/>
			</div>
		</section>

		<!-- Section: Address -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.address()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input
					label={m.postal_code()}
					placeholder={m.example_postal_code()}
					bind:value={$form.postal_code}
					error={formatFormError($errors.postal_code)}
					required
				/>
				<Input
					label={m.house_number()}
					placeholder={m.example_house_number()}
					bind:value={$form.house_number}
					error={formatFormError($errors.house_number)}
					required
				/>
				<Input
					label={m.addition_optional()}
					placeholder={m.example_house_number_addition()}
					bind:value={$form.house_number_addition}
				/>
			</div>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label={m.street()}
					placeholder={m.example_street_name()}
					bind:value={$form.street}
					error={formatFormError($errors.street)}
					required
				/>
				<Input
					label={m.city()}
					placeholder={m.example_city_name()}
					bind:value={$form.city}
					error={formatFormError($errors.city)}
					required
				/>
			</div>
		</section>

		<!-- Section: Employment & Role -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.employment_role()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<SearchSelect
					label={m.role()}
					loadOptions={loadRoles}
					bind:value={$form.role_id}
					error={formatFormError($errors.role_id)}
					item={roleItem}
					labelFn={(role) => role.role_name}
					valueFn={(role) => role.id}
					placeholder={m.search_role_placeholder()}
				/>
				<SearchSelect
					label={m.assigned_location()}
					loadOptions={loadLocations}
					bind:value={$form.location_id}
					item={locationItem}
					labelFn={(location) => `${location.name} (${location.city})`}
					valueFn={(location) => location.id}
					placeholder={m.search_location_placeholder()}
				/>
				<Input
					label={m.employee_number()}
					placeholder={m.placeholder_employee_number()}
					bind:value={$form.employee_number}
				/>
				<Input
					label={m.employment_number()}
					placeholder={m.placeholder_employment_number()}
					bind:value={$form.employment_number}
				/>
				<Input
					label={m.position()}
					placeholder={m.placeholder_position()}
					bind:value={$form.position}
				/>
				<Select
					label={m.department()}
					placeholder={m.placeholder_department()}
					options={departmentOptions}
					bind:value={$form.department_id}
					error={formatFormError($errors.department_id)}
				/>
			</div>
		</section>

		<!-- Section: Contract -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.contract()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Select
					label={m.contract_type()}
					bind:value={$form.contract_type}
					options={contractTypeOptions}
					placeholder={m.select_contract_type()}
					error={formatFormError($errors.contract_type)}
				/>
				<Input
					label={m.contract_hours()}
					type="number"
					placeholder={m.placeholder_contract_hours()}
					bind:value={$form.contract_hours}
					error={formatFormError($errors.contract_hours)}
				/>
				<Input
					label={m.rate_salary()}
					type="number"
					placeholder={m.placeholder_amount_zero()}
					bind:value={$form.contract_rate}
					error={formatFormError($errors.contract_rate)}
				/>
			</div>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<DatePicker label={m.start_date()} bind:value={$form.contract_start_date} />
				<DatePicker label={m.end_date()} bind:value={$form.contract_end_date} />
			</div>
		</section>

		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>{m.cancel()}</Button>
			<Button variant="secondary" class="gap-2" form={formId} type="submit" isLoading={$delayed}>
				<Plus class="h-4 w-4" />
				{$delayed ? m.creating_employee() : m.create_employee()}
			</Button>
		</div>
	{/snippet}
</Modal>
