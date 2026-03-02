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
	import type { OrganizationLocation } from '$lib/types/api';
	import { EmployeeSchema, type EmployeeSchemaInput } from '$lib/schemas/employee';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';

	let { open = $bindable(false), onCreated } = $props<{
		open?: boolean;
		onCreated?: () => void;
	}>();

	let errorMessage = $state('');
	let rolesCache = $state<RoleListItem[]>([]);
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
				contract_type: 'none'
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
							department: trimToUndefined(form.data.department),
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
						errorMessage = error instanceof Error ? error.message : 'Failed to create employee';
					}
				}
			}
		}
	);

	// Options
	const genderOptions = [
		{ value: 'male', label: 'Male' },
		{ value: 'female', label: 'Female' },
		{ value: 'not_specified', label: 'Not Specified' }
	];

	const contractTypeOptions = [
		{ value: 'loondienst', label: 'Loondienst (Full-time)' },
		{ value: 'ZZP', label: 'ZZP (Freelance)' },
		{ value: 'none', label: 'None' }
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
</script>

{#snippet roleItem(option: RoleListItem)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.role_name}</span>
		<span class="text-xs text-text-muted">{option.permission_count} permissions</span>
	</div>
{/snippet}

{#snippet locationItem(option: OrganizationLocation)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex flex-col gap-0.5 text-xs text-text-muted">
			<span>{option.street} {option.house_number}, {option.city}</span>
			<span class="{option.available > 0 ? 'text-emerald-600' : 'text-rose-600'} font-medium">
				{option.available} spots available
			</span>
		</div>
	</div>
{/snippet}

<Modal
	bind:open
	title="Add New Employee"
	description="Create a new employee profile with personal, contact, and contract details."
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
				Personal Information
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="First Name"
					placeholder="Jane"
					bind:value={$form.first_name}
					error={formatFormError($errors.first_name)}
					required
				/>
				<Input
					label="Last Name"
					placeholder="Doe"
					bind:value={$form.last_name}
					error={formatFormError($errors.last_name)}
					required
				/>
				<Input
					label="BSN"
					placeholder="123456789"
					bind:value={$form.bsn}
					error={formatFormError($errors.bsn)}
					required
				/>
				<Select
					label="Gender"
					bind:value={$form.gender}
					options={genderOptions}
					placeholder="Select gender..."
					error={formatFormError($errors.gender)}
				/>
				<DatePicker label="Date of Birth" bind:value={$form.date_of_birth} />
			</div>
		</section>

		<!-- Section: Contact Details -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Contact Details
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Work Email"
					type="email"
					placeholder="jane.doe@maicare.com"
					bind:value={$form.work_email_address}
					error={formatFormError($errors.work_email_address)}
					required
				/>
				<Input
					label="Private Email"
					type="email"
					placeholder="jane.doe@gmail.com"
					bind:value={$form.private_email_address}
					error={formatFormError($errors.private_email_address)}
				/>
				<Input
					label="Work Phone"
					placeholder="+31 6 12345678"
					bind:value={$form.work_phone_number}
				/>
				<Input
					label="Private Phone"
					placeholder="+31 6 87654321"
					bind:value={$form.private_phone_number}
				/>
				<Input
					label="Home Telephone"
					placeholder="+31 20 1234567"
					bind:value={$form.home_telephone_number}
				/>
			</div>
		</section>

		<!-- Section: Address -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Address
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input
					label="Postal Code"
					placeholder="1234 AB"
					bind:value={$form.postal_code}
					error={formatFormError($errors.postal_code)}
					required
				/>
				<Input
					label="House Number"
					placeholder="10"
					bind:value={$form.house_number}
					error={formatFormError($errors.house_number)}
					required
				/>
				<Input label="Addition" placeholder="A" bind:value={$form.house_number_addition} />
			</div>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Street"
					placeholder="Main Street"
					bind:value={$form.street}
					error={formatFormError($errors.street)}
					required
				/>
				<Input
					label="City"
					placeholder="Amsterdam"
					bind:value={$form.city}
					error={formatFormError($errors.city)}
					required
				/>
			</div>
		</section>

		<!-- Section: Employment & Role -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Employment & Role
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<SearchSelect
					label="Role"
					loadOptions={loadRoles}
					bind:value={$form.role_id}
					error={formatFormError($errors.role_id)}
					item={roleItem}
					labelFn={(role) => role.role_name}
					valueFn={(role) => role.id}
					placeholder="Search for a role..."
				/>
				<SearchSelect
					label="Assigned Location"
					loadOptions={loadLocations}
					bind:value={$form.location_id}
					item={locationItem}
					labelFn={(location) => `${location.name} (${location.city})`}
					valueFn={(location) => location.id}
					placeholder="Search for a location..."
				/>
				<Input label="Employee Number" placeholder="EMP-001" bind:value={$form.employee_number} />
				<Input
					label="Employment Number"
					placeholder="100200300"
					bind:value={$form.employment_number}
				/>
				<Input label="Position" placeholder="Senior Caregiver" bind:value={$form.position} />
				<Input label="Department" placeholder="Ambulant Care" bind:value={$form.department} />
			</div>
		</section>

		<!-- Section: Contract -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Contract
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Select
					label="Contract Type"
					bind:value={$form.contract_type}
					options={contractTypeOptions}
					placeholder="Select type..."
					error={formatFormError($errors.contract_type)}
				/>
				<Input
					label="Contract Hours"
					type="number"
					placeholder="36"
					bind:value={$form.contract_hours}
					error={formatFormError($errors.contract_hours)}
				/>
				<Input
					label="Rate / Salary"
					type="number"
					placeholder="0.00"
					bind:value={$form.contract_rate}
					error={formatFormError($errors.contract_rate)}
				/>
			</div>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<DatePicker label="Start Date" bind:value={$form.contract_start_date} />
				<DatePicker label="End Date" bind:value={$form.contract_end_date} />
			</div>
		</section>

		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>Cancel</Button>
			<Button variant="secondary" class="gap-2" form={formId} type="submit" isLoading={$delayed}>
				<Plus class="h-4 w-4" />
				{$delayed ? 'Creating Employee...' : 'Create Employee'}
			</Button>
		</div>
	{/snippet}
</Modal>
