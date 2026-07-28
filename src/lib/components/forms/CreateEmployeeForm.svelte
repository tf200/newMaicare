<script lang="ts">
	import { onDestroy } from 'svelte';
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
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import type { OrganizationLocation } from '$lib/types/api';
	import type { DepartmentItem } from '$lib/types/api';
	import { EmployeeSchema, type EmployeeSchemaInput } from '$lib/schemas/employee';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { m } from '$lib/paraglide/messages';
	import { getToastState } from '$lib/state/toast.svelte';

	let { open = $bindable(false), onCreated } = $props<{
		open?: boolean;
		onCreated?: () => void;
	}>();
	const toast = getToastState();

	let errorMessage = $state('');
	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;
	let lookupSequence = 0;
	let rolesCache = $state.raw<RoleListItem[]>([]);
	let departmentsCache = $state.raw<DepartmentItem[]>([]);
	let roleDisplayValue = $state('');
	let locationDisplayValue = $state('');
	let departmentDisplayValue = $state('');
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

	const { form, errors, enhance, submitting, reset } = superForm(
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
					errorMessage = '';
					try {
						const payload: CreateEmployeeRequest = {
							first_name: form.data.first_name.trim(),
							last_name: form.data.last_name.trim(),
							bsn: form.data.bsn.trim(),
							street: form.data.street.trim(),
							house_number: form.data.house_number.trim(),
							postal_code: formatPostalCode(form.data.postal_code).trim(),
							city: form.data.city.trim(),
							work_email_address: form.data.work_email_address.trim(),
							gender: form.data.gender,
							contract_type: form.data.contract_type,
							role_id: form.data.role_id.trim(),
							house_number_addition: trimToUndefined(form.data.house_number_addition),
							employee_number: trimToUndefined(form.data.employee_number),
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
						toast.success(m.employee_created_success());
						clearTransientState();
						open = false;
						onCreated?.();
					} catch {
						errorMessage = m.failed_create_employee();
					}
				}
			}
		}
	);

	// Options
	const genderOptions = $derived([
		{ value: 'male', label: m.male() },
		{ value: 'female', label: m.female() },
		{ value: 'not_specified', label: m.not_specified() }
	]);

	const contractTypeOptions = $derived([
		{ value: 'loondienst', label: m.loondienst_full_time() },
		{ value: 'ZZP', label: m.zzp_freelance() },
		{ value: 'none', label: m.none() }
	]);

	const normalizePostalCode = (value: string) => value.replace(/\s+/g, '').toUpperCase().trim();

	const formatPostalCode = (value: string) => {
		const normalized = normalizePostalCode(value);
		if (normalized.length <= 4) return normalized;
		return `${normalized.slice(0, 4)} ${normalized.slice(4, 6)}`;
	};

	const isPostalCodeValid = (value: string) => /^\d{4}\s?[A-Za-z]{2}$/.test(value.trim());

	const clearTransientState = () => {
		if (lookupTimer) {
			clearTimeout(lookupTimer);
			lookupTimer = null;
		}
		lookupSequence += 1;
		lookupMessage = '';
		isLookupLoading = false;
		errorMessage = '';
		roleDisplayValue = '';
		locationDisplayValue = '';
		departmentDisplayValue = '';
		reset();
	};

	onDestroy(() => {
		if (lookupTimer) clearTimeout(lookupTimer);
		lookupSequence += 1;
	});

	const handleCancel = () => {
		clearTransientState();
		open = false;
	};

	const runLookup = async (postcodeValue: string, numberValue: string) => {
		if (!isPostalCodeValid(postcodeValue)) return;
		const sequence = ++lookupSequence;
		isLookupLoading = true;
		lookupMessage = '';
		try {
			const result = await lookupAddressByPostcode(postcodeValue, numberValue);
			if (sequence !== lookupSequence || !open) return;
			if (!result) {
				lookupMessage = m.address_not_found_manual();
				return;
			}
			$form.street = result.street;
			$form.city = result.city;
		} catch (error) {
			if (sequence !== lookupSequence || !open) return;
			lookupMessage = error instanceof Error ? error.message : m.address_lookup_failed();
		} finally {
			if (sequence === lookupSequence) isLookupLoading = false;
		}
	};

	const scheduleLookup = (postcodeValue: string, numberValue: string) => {
		lookupMessage = '';
		if (!postcodeValue.trim() || !numberValue.trim()) return;
		if (lookupTimer) clearTimeout(lookupTimer);
		lookupTimer = setTimeout(() => {
			void runLookup(postcodeValue, numberValue);
		}, 400);
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

	const loadDepartments = async (query: string) => {
		if (departmentsCache.length === 0) {
			const response = await listDepartments({ pageSize: 100 });
			departmentsCache = response.data.results.filter(
				(department) => department.name.trim().length > 0
			);
		}
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) return departmentsCache;
		return departmentsCache.filter((department) =>
			department.name.toLowerCase().includes(normalizedQuery)
		);
	};
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
			<span
				class="{option.available > 0 ? 'text-success-strong' : 'text-error-strong'} font-medium"
			>
				{m.spots_available({ count: option.available })}
			</span>
		</div>
	</div>
{/snippet}

{#snippet departmentItem(option: DepartmentItem)}
	<span class="font-medium text-text">{option.name}</span>
{/snippet}

<Modal
	bind:open
	title={m.add_new_employee()}
	description={m.add_new_employee_description()}
	size="4xl"
	closeLabel={m.close()}
	dismissible={!$submitting}
	onClose={clearTransientState}
>
	<form id={formId} use:enhance class="space-y-6">
		{#if errorMessage}
			<div
				class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error-strong"
				role="alert"
			>
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
					id="create-employee-first-name"
					label={m.first_name()}
					placeholder={m.example_first_name()}
					bind:value={$form.first_name}
					error={formatFormError($errors.first_name)}
					required
					autocomplete="given-name"
				/>
				<Input
					id="create-employee-last-name"
					label={m.last_name()}
					placeholder={m.example_last_name()}
					bind:value={$form.last_name}
					error={formatFormError($errors.last_name)}
					required
					autocomplete="family-name"
				/>
				<Input
					id="create-employee-bsn"
					label={m.bsn()}
					placeholder={m.example_bsn()}
					bind:value={$form.bsn}
					error={formatFormError($errors.bsn)}
					required
					inputmode="numeric"
					autocomplete="off"
				/>
				<Select
					id="create-employee-gender"
					label={m.gender()}
					bind:value={$form.gender}
					options={genderOptions}
					placeholder={m.select_gender()}
					error={formatFormError($errors.gender)}
				/>
				<DatePicker
					id="create-employee-date-of-birth"
					label={m.date_of_birth()}
					bind:value={$form.date_of_birth}
					error={formatFormError($errors.date_of_birth)}
				/>
			</div>
		</section>

		<!-- Section: Contact Details -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.contact_details()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					id="create-employee-work-email"
					label={m.work_email()}
					type="email"
					placeholder={m.placeholder_work_email()}
					bind:value={$form.work_email_address}
					error={formatFormError($errors.work_email_address)}
					required
					autocomplete="email"
				/>
				<Input
					id="create-employee-private-email"
					label={m.private_email()}
					type="email"
					placeholder={m.placeholder_private_email()}
					bind:value={$form.private_email_address}
					error={formatFormError($errors.private_email_address)}
					autocomplete="email"
				/>
				<Input
					id="create-employee-work-phone"
					label={m.work_phone()}
					type="tel"
					placeholder={m.example_phone_nl()}
					bind:value={$form.work_phone_number}
					error={formatFormError($errors.work_phone_number)}
					autocomplete="tel"
				/>
				<Input
					id="create-employee-private-phone"
					label={m.private_phone()}
					type="tel"
					placeholder={m.example_phone_nl()}
					bind:value={$form.private_phone_number}
					error={formatFormError($errors.private_phone_number)}
					autocomplete="tel"
				/>
				<Input
					id="create-employee-home-phone"
					label={m.home_telephone()}
					type="tel"
					placeholder={m.example_phone_nl()}
					bind:value={$form.home_telephone_number}
					error={formatFormError($errors.home_telephone_number)}
					autocomplete="tel"
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
					id="create-employee-postal-code"
					label={m.postal_code()}
					placeholder={m.example_postal_code()}
					bind:value={$form.postal_code}
					error={formatFormError($errors.postal_code)}
					required
					autocomplete="postal-code"
					oninput={() => {
						if ($form.postal_code && $form.house_number) {
							scheduleLookup($form.postal_code, $form.house_number);
						}
					}}
					onblur={() => {
						if ($form.postal_code) {
							$form.postal_code = formatPostalCode($form.postal_code);
							if ($form.house_number) {
								scheduleLookup($form.postal_code, $form.house_number);
							}
						}
					}}
				/>
				<Input
					id="create-employee-house-number"
					label={m.house_number()}
					placeholder={m.example_house_number()}
					bind:value={$form.house_number}
					error={formatFormError($errors.house_number)}
					required
					oninput={() => {
						if ($form.postal_code && $form.house_number) {
							scheduleLookup($form.postal_code, $form.house_number);
						}
					}}
				/>
				<Input
					id="create-employee-house-number-addition"
					label={m.addition_optional()}
					placeholder={m.example_house_number_addition()}
					bind:value={$form.house_number_addition}
					error={formatFormError($errors.house_number_addition)}
				/>
			</div>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					id="create-employee-street"
					label={m.street()}
					placeholder={m.example_street_name()}
					bind:value={$form.street}
					error={formatFormError($errors.street)}
					required
					autocomplete="street-address"
				/>
				<Input
					id="create-employee-city"
					label={m.city()}
					placeholder={m.example_city_name()}
					bind:value={$form.city}
					error={formatFormError($errors.city)}
					required
					autocomplete="address-level2"
				/>
			</div>
			{#if isLookupLoading}
				<div class="text-xs font-medium text-text-muted">{m.looking_up_address()}</div>
			{/if}
			{#if lookupMessage}
				<div
					class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
				>
					{lookupMessage}
				</div>
			{/if}
		</section>

		<!-- Section: Employment & Role -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.employment_role()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<SearchSelect
					id="create-employee-role"
					label={m.role()}
					loadOptions={loadRoles}
					bind:value={$form.role_id}
					bind:displayValue={roleDisplayValue}
					error={formatFormError($errors.role_id)}
					item={roleItem}
					labelFn={(role) => role.role_name}
					valueFn={(role) => role.id}
					placeholder={m.search_role_placeholder()}
					loadErrorText={m.unable_to_load_roles()}
					retryLabel={m.retry()}
				/>
				<SearchSelect
					id="create-employee-location"
					label={m.assigned_location()}
					loadOptions={loadLocations}
					bind:value={$form.location_id}
					bind:displayValue={locationDisplayValue}
					error={formatFormError($errors.location_id)}
					item={locationItem}
					labelFn={(location) => `${location.name} (${location.city})`}
					valueFn={(location) => location.id}
					placeholder={m.search_location_placeholder()}
					loadErrorText={m.unable_to_load_locations()}
					retryLabel={m.retry()}
				/>
				<Input
					id="create-employee-number"
					label={m.employee_number()}
					placeholder={m.placeholder_employee_number()}
					bind:value={$form.employee_number}
					error={formatFormError($errors.employee_number)}
				/>
				<Input
					id="create-employee-position"
					label={m.position()}
					placeholder={m.placeholder_position()}
					bind:value={$form.position}
					error={formatFormError($errors.position)}
				/>
				<SearchSelect
					id="create-employee-department"
					label={m.department()}
					placeholder={m.placeholder_department()}
					loadOptions={loadDepartments}
					bind:value={$form.department_id}
					bind:displayValue={departmentDisplayValue}
					error={formatFormError($errors.department_id)}
					item={departmentItem}
					labelFn={(department) => department.name}
					valueFn={(department) => department.id}
					loadErrorText={m.unable_to_load_departments()}
					retryLabel={m.retry()}
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
					id="create-employee-contract-type"
					label={m.contract_type()}
					bind:value={$form.contract_type}
					options={contractTypeOptions}
					placeholder={m.select_contract_type()}
					error={formatFormError($errors.contract_type)}
				/>
				<Input
					id="create-employee-contract-hours"
					label={m.contract_hours()}
					type="number"
					placeholder={m.placeholder_contract_hours()}
					bind:value={$form.contract_hours}
					error={formatFormError($errors.contract_hours)}
				/>
				<Input
					id="create-employee-contract-rate"
					label={m.rate_salary()}
					type="number"
					placeholder={m.placeholder_amount_zero()}
					bind:value={$form.contract_rate}
					error={formatFormError($errors.contract_rate)}
				/>
			</div>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<DatePicker
					id="create-employee-contract-start"
					label={m.start_date()}
					bind:value={$form.contract_start_date}
					error={formatFormError($errors.contract_start_date)}
				/>
				<DatePicker
					id="create-employee-contract-end"
					label={m.end_date()}
					bind:value={$form.contract_end_date}
					error={formatFormError($errors.contract_end_date)}
				/>
			</div>
		</section>

		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex flex-wrap justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$submitting}>{m.cancel()}</Button>
			<Button
				class="gap-2"
				form={formId}
				type="submit"
				isLoading={$submitting}
				disabled={$submitting}
			>
				<Plus class="h-4 w-4" aria-hidden="true" />
				{$submitting ? m.creating_employee() : m.create_employee()}
			</Button>
		</div>
	{/snippet}
</Modal>
