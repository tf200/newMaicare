<script lang="ts">
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

	let { open = $bindable(false), onCreated } = $props<{
		open?: boolean;
		onCreated?: () => void;
	}>();

	const createInitialFormData = () => ({
		// Personal
		first_name: '',
		last_name: '',
		bsn: '',
		gender: '' as 'male' | 'female' | 'not_specified' | '',
		date_of_birth: '',

		// Contact
		work_email_address: '',
		private_email_address: '',
		work_phone_number: '',
		private_phone_number: '',
		home_telephone_number: '',

		// Address
		postal_code: '',
		house_number: '',
		house_number_addition: '',
		street: '',
		city: '',

		// Employment
		employee_number: '',
		employment_number: '',
		role_id: '',
		location_id: '',
		position: '',
		department: '',

		// Contract
		contract_type: '' as 'loondienst' | 'ZZP' | 'none' | '',
		contract_hours: '',
		contract_rate: '',
		contract_start_date: '',
		contract_end_date: ''
	});

	// Form State
	let formData = $state(createInitialFormData());

	let errors = $state<Record<string, string>>({});
	let errorMessage = $state('');
	let isLoading = $state(false);
	let rolesCache = $state<RoleListItem[]>([]);

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

	// Validation
	const validate = () => {
		const newErrors: Record<string, string> = {};
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
		if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
		if (!formData.bsn.trim()) newErrors.bsn = 'BSN is required';
		if (!formData.gender) newErrors.gender = 'Gender is required';
		if (!formData.work_email_address.trim())
			newErrors.work_email_address = 'Work email is required';
		if (
			formData.work_email_address.trim() &&
			!emailRegex.test(formData.work_email_address.trim())
		) {
			newErrors.work_email_address = 'Enter a valid work email address';
		}
		if (
			formData.private_email_address.trim() &&
			!emailRegex.test(formData.private_email_address.trim())
		) {
			newErrors.private_email_address = 'Enter a valid private email address';
		}
		if (!formData.postal_code.trim()) newErrors.postal_code = 'Postal code is required';
		if (!formData.house_number.trim()) newErrors.house_number = 'House number is required';
		if (!formData.street.trim()) newErrors.street = 'Street is required';
		if (!formData.city.trim()) newErrors.city = 'City is required';
		if (!formData.role_id) newErrors.role_id = 'Role is required';
		if (!formData.contract_type) newErrors.contract_type = 'Contract type is required';

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	};

	const toOptionalString = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	};

	const toOptionalNumber = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return undefined;
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) ? parsed : undefined;
	};

	const resetForm = () => {
		formData = createInitialFormData();
		errors = {};
		errorMessage = '';
	};

	const handleSubmit = async () => {
		if (isLoading) return;
		errorMessage = '';
		if (!validate()) return;

		isLoading = true;
		try {
			const payload: CreateEmployeeRequest = {
				first_name: formData.first_name.trim(),
				last_name: formData.last_name.trim(),
				bsn: formData.bsn.trim(),
				street: formData.street.trim(),
				house_number: formData.house_number.trim(),
				postal_code: formData.postal_code.trim(),
				city: formData.city.trim(),
				work_email_address: formData.work_email_address.trim(),
				gender: formData.gender as CreateEmployeeRequest['gender'],
				contract_type: formData.contract_type as CreateEmployeeRequest['contract_type'],
				role_id: formData.role_id,
				employee_number: toOptionalString(formData.employee_number),
				employment_number: toOptionalString(formData.employment_number),
				location_id: toOptionalString(formData.location_id),
				position: toOptionalString(formData.position),
				department: toOptionalString(formData.department),
				private_email_address: toOptionalString(formData.private_email_address),
				work_phone_number: toOptionalString(formData.work_phone_number),
				private_phone_number: toOptionalString(formData.private_phone_number),
				date_of_birth: toOptionalString(formData.date_of_birth),
				home_telephone_number: toOptionalString(formData.home_telephone_number),
				contract_hours: toOptionalNumber(formData.contract_hours),
				contract_start_date: toOptionalString(formData.contract_start_date),
				contract_end_date: toOptionalString(formData.contract_end_date),
				contract_rate: toOptionalNumber(formData.contract_rate),
				house_number_addition: toOptionalString(formData.house_number_addition)
			};

			await createEmployee(payload);
			resetForm();
			onCreated?.();
			open = false;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to create employee';
		} finally {
			isLoading = false;
		}
	};

	const handleCancel = () => {
		resetForm();
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
	<div class="space-y-6">
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
					bind:value={formData.first_name}
					error={errors.first_name}
					required
				/>
				<Input
					label="Last Name"
					placeholder="Doe"
					bind:value={formData.last_name}
					error={errors.last_name}
					required
				/>
				<Input
					label="BSN"
					placeholder="123456789"
					bind:value={formData.bsn}
					error={errors.bsn}
					required
				/>
				<Select
					label="Gender"
					bind:value={formData.gender}
					options={genderOptions}
					placeholder="Select gender..."
					error={errors.gender}
				/>
				<DatePicker label="Date of Birth" bind:value={formData.date_of_birth} />
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
					bind:value={formData.work_email_address}
					error={errors.work_email_address}
					required
				/>
				<Input
					label="Private Email"
					type="email"
					placeholder="jane.doe@gmail.com"
					bind:value={formData.private_email_address}
				/>
				<Input
					label="Work Phone"
					placeholder="+31 6 12345678"
					bind:value={formData.work_phone_number}
				/>
				<Input
					label="Private Phone"
					placeholder="+31 6 87654321"
					bind:value={formData.private_phone_number}
				/>
				<Input
					label="Home Telephone"
					placeholder="+31 20 1234567"
					bind:value={formData.home_telephone_number}
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
					bind:value={formData.postal_code}
					error={errors.postal_code}
					required
				/>
				<Input
					label="House Number"
					placeholder="10"
					bind:value={formData.house_number}
					error={errors.house_number}
					required
				/>
				<Input label="Addition" placeholder="A" bind:value={formData.house_number_addition} />
			</div>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Street"
					placeholder="Main Street"
					bind:value={formData.street}
					error={errors.street}
					required
				/>
				<Input
					label="City"
					placeholder="Amsterdam"
					bind:value={formData.city}
					error={errors.city}
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
					bind:value={formData.role_id}
					error={errors.role_id}
					item={roleItem}
					labelFn={(role) => role.role_name}
					valueFn={(role) => role.id}
					placeholder="Search for a role..."
				/>
				<SearchSelect
					label="Assigned Location"
					loadOptions={loadLocations}
					bind:value={formData.location_id}
					item={locationItem}
					labelFn={(location) => `${location.name} (${location.city})`}
					valueFn={(location) => location.id}
					placeholder="Search for a location..."
				/>
				<Input
					label="Employee Number"
					placeholder="EMP-001"
					bind:value={formData.employee_number}
				/>
				<Input
					label="Employment Number"
					placeholder="100200300"
					bind:value={formData.employment_number}
				/>
				<Input label="Position" placeholder="Senior Caregiver" bind:value={formData.position} />
				<Input label="Department" placeholder="Ambulant Care" bind:value={formData.department} />
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
					bind:value={formData.contract_type}
					options={contractTypeOptions}
					placeholder="Select type..."
					error={errors.contract_type}
				/>
				<Input
					label="Contract Hours"
					type="number"
					placeholder="36"
					bind:value={formData.contract_hours}
				/>
				<Input
					label="Rate / Salary"
					type="number"
					placeholder="0.00"
					bind:value={formData.contract_rate}
				/>
			</div>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<DatePicker label="Start Date" bind:value={formData.contract_start_date} />
				<DatePicker label="End Date" bind:value={formData.contract_end_date} />
			</div>
		</section>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isLoading}>Cancel</Button>
			<Button variant="secondary" class="gap-2" onclick={handleSubmit} {isLoading}>
				<Plus class="h-4 w-4" />
				{isLoading ? 'Creating Employee...' : 'Create Employee'}
			</Button>
		</div>
	{/snippet}
</Modal>
