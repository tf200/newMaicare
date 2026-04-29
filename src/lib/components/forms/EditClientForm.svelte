<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { getClientById, updateClient } from '$lib/api/clients';
	import { listLocations } from '$lib/api/locations';
	import { listEmployees } from '$lib/api/employees';
	import { listSenders } from '$lib/api/senders';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { EditClientSchema, type EditClientSchemaInput } from '$lib/schemas/client';
	import { m } from '$lib/paraglide/messages';
	import type { GetClientResponse, UpdateClientRequest } from '$lib/types/api';

	interface Props {
		open?: boolean;
		clientId?: string | null;
		onUpdated?: () => void;
	}

	let { open = $bindable(false), clientId = null, onUpdated }: Props = $props();

	let errorMessage = $state('');
	let isLoadingData = $state(false);
	let initializedId = $state<string | null>(null);
	const formId = 'edit-client-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				first_name: '',
				last_name: '',
				date_of_birth: '',
				identity: false,
				bsn: '',
				bsn_verified_by: '',
				nationality: '',
				email: '',
				phone_number: '',
				gender: undefined as string | undefined,
				filenumber: '',
				sender_id: '',
				location_id: '',
				education_currently_enrolled: false,
				education_institution: '',
				education_mentor_name: '',
				education_mentor_phone: '',
				education_mentor_email: '',
				education_additional_notes: '',
				education_level: 'none',
				work_currently_employed: false,
				work_current_employer: '',
				work_employer_phone: '',
				work_employer_email: '',
				work_current_position: '',
				work_start_date: '',
				work_additional_notes: ''
			} as EditClientSchemaInput,
			valibotClient(EditClientSchema)
		),
		{
			validators: valibotClient(EditClientSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && clientId) {
					try {
						const toRFC3339 = (dateStr: string | undefined) =>
							dateStr ? `${dateStr}T00:00:00Z` : '';

						const payload: UpdateClientRequest = {
							first_name: form.data.first_name?.trim() ?? '',
							last_name: form.data.last_name?.trim() ?? '',
							date_of_birth: toRFC3339(form.data.date_of_birth) || null,
							identity: form.data.identity,
							bsn: trimToUndefined(form.data.bsn) ?? null,
							bsn_verified_by: trimToUndefined(form.data.bsn_verified_by) ?? null,
							nationality: trimToUndefined(form.data.nationality) ?? null,
							email: trimToUndefined(form.data.email) ?? null,
							phone_number: trimToUndefined(form.data.phone_number) ?? null,
							gender: (form.data.gender as UpdateClientRequest['gender']) ?? null,
							filenumber: trimToUndefined(form.data.filenumber) ?? null,
							sender_id: trimToUndefined(form.data.sender_id) ?? null,
							location_id: trimToUndefined(form.data.location_id) ?? null,
							education_currently_enrolled: form.data.education_currently_enrolled,
							education_institution: trimToUndefined(form.data.education_institution) ?? null,
							education_mentor_name: trimToUndefined(form.data.education_mentor_name) ?? null,
							education_mentor_phone: trimToUndefined(form.data.education_mentor_phone) ?? null,
							education_mentor_email: trimToUndefined(form.data.education_mentor_email) ?? null,
							education_additional_notes:
								trimToUndefined(form.data.education_additional_notes) ?? null,
							education_level: form.data.education_level ?? null,
							work_currently_employed: form.data.work_currently_employed,
							work_current_employer: trimToUndefined(form.data.work_current_employer) ?? null,
							work_employer_phone: trimToUndefined(form.data.work_employer_phone) ?? null,
							work_employer_email: trimToUndefined(form.data.work_employer_email) ?? null,
							work_current_position: trimToUndefined(form.data.work_current_position) ?? null,
							work_start_date:
								form.data.work_currently_employed && form.data.work_start_date
									? toRFC3339(form.data.work_start_date)
									: null,
							work_additional_notes: trimToUndefined(form.data.work_additional_notes) ?? null
						};

						await updateClient(clientId, payload);
						open = false;
						initializedId = null;
						onUpdated?.();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : m.failed_update_client();
					}
				}
			}
		}
	);

	const toDateInput = (value: string | null | undefined) => {
		if (!value) return '';
		return value.split('T')[0] ?? '';
	};

	const fetchAndPopulate = async () => {
		if (!clientId) return;
		isLoadingData = true;
		errorMessage = '';

		try {
			const response = await getClientById(clientId);
			const data = response.data;

			const initialData: EditClientSchemaInput = {
				first_name: data.client.first_name ?? '',
				last_name: data.client.last_name ?? '',
				date_of_birth: toDateInput(data.client.date_of_birth),
				identity: false,
				bsn: typeof data.client.bsn === 'string' ? data.client.bsn : String(data.client.bsn ?? ''),
				bsn_verified_by: '',
				nationality: '',
				email: data.sender?.email_address ?? '',
				phone_number: data.sender?.phone_number ?? '',
				gender: data.client.gender ?? undefined,
				filenumber: String(data.client.file_number ?? ''),
				sender_id: '',
				location_id: data.client.location?.id ?? '',
				education_currently_enrolled: data.client.education?.currently_enrolled ?? false,
				education_institution: data.client.education?.institution ?? '',
				education_mentor_name: data.client.education?.mentor_name ?? '',
				education_mentor_phone: data.client.education?.mentor_phone ?? '',
				education_mentor_email: data.client.education?.mentor_email ?? '',
				education_additional_notes: data.client.education?.additional_notes ?? '',
				education_level: (data.client.education?.level as EditClientSchemaInput['education_level']) ?? 'none',
				work_currently_employed: data.client.work?.currently_employed ?? false,
				work_current_employer: data.client.work?.current_employer ?? '',
				work_employer_phone: data.client.work?.employer_phone ?? '',
				work_employer_email: data.client.work?.employer_email ?? '',
				work_current_position: data.client.work?.current_position ?? '',
				work_start_date: toDateInput(data.client.work?.start_date),
				work_additional_notes: data.client.work?.additional_notes ?? ''
			};

			reset({ data: initialData });
			initializedId = clientId;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : m.failed_load_client();
		} finally {
			isLoadingData = false;
		}
	};

	$effect(() => {
		if (!open || !clientId) return;
		if (initializedId === clientId) return;
		fetchAndPopulate();
	});

	const handleCancel = () => {
		errorMessage = '';
		initializedId = null;
		open = false;
	};

	const genderOptions = [
		{ value: 'male', label: m.male() },
		{ value: 'female', label: m.female() },
		{ value: 'other', label: m.other() }
	];

	const educationLevelOptions = [
		{ value: 'primary', label: m.education_primary() },
		{ value: 'secondary', label: m.education_secondary() },
		{ value: 'higher', label: m.education_higher() },
		{ value: 'none', label: m.education_none() }
	];

	const loadLocations = async (query: string) => {
		const res = await listLocations({ search: query, pageSize: 50 });
		return res.data.results.map((loc) => ({
			label: loc.name,
			value: loc.id
		}));
	};

	const loadSenders = async (query: string) => {
		const res = await listSenders({ search: query, page: 1, pageSize: 50 });
		return res.data.results.map((sender) => ({
			label: sender.name,
			value: sender.id
		}));
	};

	const loadEmployees = async (query: string) => {
		const res = await listEmployees({ search: query, page: 1, pageSize: 50 });
		return res.data.results.map((emp) => ({
			label: `${emp.first_name} ${emp.last_name}`.trim(),
			value: emp.id
		}));
	};
</script>

<Modal
	bind:open
	title={m.edit_client_title()}
	description={m.edit_client_description()}
	size="2xl"
>
	{#if isLoadingData}
		<div class="flex items-center justify-center py-16">
			<div class="flex flex-col items-center gap-3">
				<div
					class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand"
				></div>
				<p class="text-sm text-text-muted">{m.loading()}</p>
			</div>
		</div>
	{:else if initializedId === clientId}
		<form id={formId} use:enhance class="space-y-8">
			{#if errorMessage}
				<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
					{errorMessage}
				</div>
			{/if}

			<!-- Personal Information -->
			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					{m.personal_info()}
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Input
						label={m.first_name()}
						bind:value={$form.first_name}
						error={formatFormError($errors.first_name)}
						required
					/>
					<Input
						label={m.last_name()}
						bind:value={$form.last_name}
						error={formatFormError($errors.last_name)}
						required
					/>
					<DatePicker
						label={m.date_of_birth()}
						bind:value={$form.date_of_birth}
						error={formatFormError($errors.date_of_birth)}
					/>
					<Select
						label={m.gender()}
						bind:value={$form.gender}
						options={genderOptions}
						placeholder={m.select_placeholder()}
						error={formatFormError($errors.gender)}
					/>
					<Input
						label={m.nationality()}
						bind:value={$form.nationality}
						error={formatFormError($errors.nationality)}
					/>
					<Input
						label={m.email()}
						type="email"
						bind:value={$form.email}
						error={formatFormError($errors.email)}
					/>
					<Input
						label={m.phone_number()}
						type="tel"
						bind:value={$form.phone_number}
						error={formatFormError($errors.phone_number)}
					/>
				</div>
			</section>

			<!-- Identification -->
			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					{m.identification()}
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Input
						label={m.file_number()}
						bind:value={$form.filenumber}
						error={formatFormError($errors.filenumber)}
					/>
					<Input
						label={m.bsn()}
						bind:value={$form.bsn}
						error={formatFormError($errors.bsn)}
					/>
					<Checkbox
						label={m.identity_verified()}
						bind:checked={$form.identity}
					/>
					{#if $form.identity}
						<SearchSelect
							label={m.bsn_verified_by()}
							loadOptions={loadEmployees}
							bind:value={$form.bsn_verified_by}
							placeholder={m.search_employee_placeholder()}
						/>
					{/if}
				</div>
			</section>

			<!-- Placement -->
			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					{m.placement()}
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<SearchSelect
						label={m.location()}
						loadOptions={loadLocations}
						bind:value={$form.location_id}
						placeholder={m.search_location_placeholder()}
					/>
					<SearchSelect
						label={m.sender()}
						loadOptions={loadSenders}
						bind:value={$form.sender_id}
						placeholder={m.search_sender_placeholder()}
					/>
				</div>
			</section>

			<!-- Education -->
			<section class="space-y-4">
				<h3
					class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase"
				>
					{m.education_section()}
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Checkbox
						label={m.currently_enrolled()}
						bind:checked={$form.education_currently_enrolled}
					/>
					<Select
						label={m.education_level()}
						bind:value={$form.education_level}
						options={educationLevelOptions}
						placeholder={m.select_placeholder()}
						error={formatFormError($errors.education_level)}
					/>
					{#if $form.education_currently_enrolled}
						<Input
							label={m.institution()}
							bind:value={$form.education_institution}
							error={formatFormError($errors.education_institution)}
						/>
						<div></div>
						<Input
							label={m.mentor()}
							bind:value={$form.education_mentor_name}
							error={formatFormError($errors.education_mentor_name)}
						/>
						<Input
							label={m.phone()}
							type="tel"
							bind:value={$form.education_mentor_phone}
							error={formatFormError($errors.education_mentor_phone)}
						/>
						<Input
							label={m.email()}
							type="email"
							bind:value={$form.education_mentor_email}
							error={formatFormError($errors.education_mentor_email)}
						/>
					{/if}
				</div>
				{#if $form.education_currently_enrolled}
					<Textarea
						label={m.additional_notes()}
						bind:value={$form.education_additional_notes}
						rows={3}
					/>
				{/if}
			</section>

			<!-- Work -->
			<section class="space-y-4">
				<h3
					class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase"
				>
					{m.work_section()}
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Checkbox
						label={m.currently_employed()}
						bind:checked={$form.work_currently_employed}
					/>
					{#if $form.work_currently_employed}
						<div></div>
						<Input
							label={m.employer()}
							bind:value={$form.work_current_employer}
							error={formatFormError($errors.work_current_employer)}
						/>
						<Input
							label={m.phone()}
							type="tel"
							bind:value={$form.work_employer_phone}
							error={formatFormError($errors.work_employer_phone)}
						/>
						<Input
							label={m.email()}
							type="email"
							bind:value={$form.work_employer_email}
							error={formatFormError($errors.work_employer_email)}
						/>
						<Input
							label={m.position()}
							bind:value={$form.work_current_position}
							error={formatFormError($errors.work_current_position)}
						/>
						<DatePicker
							label={m.start_date()}
							bind:value={$form.work_start_date}
							error={formatFormError($errors.work_start_date)}
						/>
					{/if}
				</div>
				{#if $form.work_currently_employed}
					<Textarea
						label={m.additional_notes()}
						bind:value={$form.work_additional_notes}
						rows={3}
					/>
				{/if}
			</section>

			<button type="submit" class="hidden" aria-hidden="true"></button>
		</form>
	{:else}
		<div class="rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text-muted">
			{m.not_available()}
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed || isLoadingData}>
				{m.cancel()}
			</Button>
			<Button
				variant="secondary"
				form={formId}
				type="submit"
				isLoading={$delayed}
				disabled={isLoadingData || initializedId !== clientId}
			>
				{$delayed ? m.saving() : m.save_changes()}
			</Button>
		</div>
	{/snippet}
</Modal>
