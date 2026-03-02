<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { createClientMedicationOrder } from '$lib/api/clients';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import FileUpload from '$lib/components/ui/FileUpload.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { Paperclip, Pill, Trash2 } from 'lucide-svelte';
	import type {
		ClientDiagnosisResponse,
		CreateClientMedicationOrderRequest,
		MedicationAdminMode,
		MedicationOrderStatus,
		MedicationScheduleItem
	} from '$lib/types/api';
	import { MedicationOrderSchema, type MedicationOrderSchemaInput } from '$lib/schemas/medication';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';

	interface Props {
		clientId: string;
		diagnoses?: ClientDiagnosisResponse[];
		open?: boolean;
		onCreated?: () => void;
	}

	let { clientId, diagnoses = [], open = $bindable(false), onCreated }: Props = $props();

	let responsibleEmployeeName = $state('');
	let uploadedAttachment = $state<{ id: string; name: string } | null>(null);
	let currentUploadFileId = $state<string | null>(null);
	let uploadKey = $state(0);
	let errorMessage = $state('');

	// Local schedule string for the textarea
	let scheduleInput = $state('');
	const formId = `create-medication-order-${Math.random().toString(36).slice(2, 9)}`;

	const submitForm = () => {
		const formEl = document.getElementById(formId);
		if (formEl instanceof HTMLFormElement) formEl.requestSubmit();
	};

	const toOptionalNumber = (value: string | number | undefined): number | undefined => {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : undefined;
		}

		const normalized = value?.replace(',', '.').trim();
		if (!normalized) return undefined;

		const parsed = Number.parseFloat(normalized);
		return Number.isFinite(parsed) ? parsed : undefined;
	};

	const toOptionalInt = (value: string | number | undefined): number | undefined => {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : undefined;
		}

		const normalized = value?.trim();
		if (!normalized) return undefined;

		const parsed = Number.parseInt(normalized, 10);
		return Number.isFinite(parsed) ? parsed : undefined;
	};

	const toScheduleItems = (value: unknown): MedicationScheduleItem[] | null => {
		if (!Array.isArray(value)) return null;

		const normalized = value
			.map((item) => {
				if (typeof item === 'string') {
					const time = item.trim();
					return time ? { time } : null;
				}

				if (typeof item === 'object' && item !== null && 'time' in item) {
					const timeValue = (item as { time?: unknown }).time;
					if (typeof timeValue !== 'string') return null;
					const time = timeValue.trim();
					return time ? { time } : null;
				}

				return null;
			})
			.filter((item): item is MedicationScheduleItem => item !== null);

		return normalized;
	};

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				status: 'active',
				admin_mode: 'self',
				diagnosis_id: '',
				medication_name: '',
				dosage_text: '',
				route: '',
				dose_amount: null,
				dose_unit: '',
				frequency_text: '',
				start_date: '',
				end_date: '',
				schedule: [],
				is_prn: false,
				prn_indication: '',
				max_doses_per_24h: null,
				responsible_employee_id: '',
				notes: '',
				source_attachment_uuid: '',
				is_critical: false
			} as unknown as MedicationOrderSchemaInput,
			valibotClient(MedicationOrderSchema)
		),
		{
			validators: valibotClient(MedicationOrderSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid) {
					try {
						const payload: CreateClientMedicationOrderRequest = {
							diagnosis_id: trimToUndefined(form.data.diagnosis_id) ?? null,
							medication_name: form.data.medication_name.trim(),
							dosage_text: form.data.dosage_text.trim(),
							dose_amount: toOptionalNumber(form.data.dose_amount) ?? null,
							dose_unit: trimToUndefined(form.data.dose_unit) ?? null,
							route: trimToUndefined(form.data.route) ?? null,
							frequency_text: trimToUndefined(form.data.frequency_text) ?? null,
							schedule: form.data.schedule,
							is_prn: form.data.is_prn,
							prn_indication: trimToUndefined(form.data.prn_indication) ?? null,
							max_doses_per_24h: toOptionalInt(form.data.max_doses_per_24h) ?? null,
							start_date: toRfc3339Date(form.data.start_date) ?? '',
							end_date: toRfc3339Date(form.data.end_date),
							status: form.data.status,
							admin_mode: form.data.admin_mode,
							responsible_employee_id: trimToUndefined(form.data.responsible_employee_id) ?? null,
							is_critical: form.data.is_critical,
							notes: trimToUndefined(form.data.notes) ?? null,
							source_attachment_uuid: trimToUndefined(form.data.source_attachment_uuid) ?? null
						};

						await createClientMedicationOrder(clientId, payload);
						reset();
						scheduleInput = '';
						uploadedAttachment = null;
						open = false;
						onCreated?.();
					} catch (error) {
						errorMessage =
							error instanceof Error ? error.message : 'Failed to create medication order.';
					}
				}
			}
		}
	);

	// Sync local scheduleInput with $form.schedule
	$effect(() => {
		try {
			const parsed = JSON.parse(scheduleInput);
			const nextSchedule = toScheduleItems(parsed);
			if (nextSchedule) {
				$form.schedule = nextSchedule;
			}
		} catch {
			// Silently wait for valid JSON
		}
	});

	const statusOptions: Array<{ label: string; value: MedicationOrderStatus }> = [
		{ label: 'Active', value: 'active' },
		{ label: 'Paused', value: 'paused' },
		{ label: 'Stopped', value: 'stopped' },
		{ label: 'Completed', value: 'completed' }
	];

	const adminModeOptions: Array<{
		value: MedicationAdminMode;
		label: string;
		activeClass: string;
	}> = [
		{
			value: 'self',
			label: 'Self',
			activeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
		},
		{
			value: 'staff',
			label: 'Staff',
			activeClass: 'border-sky-500/20 bg-sky-500/10 text-sky-700'
		},
		{
			value: 'shared',
			label: 'Shared',
			activeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-700'
		}
	];

	const routeOptions = [
		{ label: 'Oral', value: 'oral' },
		{ label: 'Intravenous (IV)', value: 'iv' },
		{ label: 'Intramuscular (IM)', value: 'im' },
		{ label: 'Subcutaneous (SC)', value: 'sc' },
		{ label: 'Topical', value: 'topical' },
		{ label: 'Inhalation', value: 'inhalation' },
		{ label: 'Other', value: 'other' }
	];

	const doseUnitOptions = [
		{ label: 'mg', value: 'mg' },
		{ label: 'mcg', value: 'mcg' },
		{ label: 'g', value: 'g' },
		{ label: 'ml', value: 'ml' },
		{ label: 'tablet', value: 'tablet' },
		{ label: 'capsule', value: 'capsule' },
		{ label: 'drop', value: 'drop' }
	];

	const diagnosisOptions = $derived.by(() => [
		{ label: 'No linked diagnosis', value: '' },
		...diagnoses.map((diagnosis) => ({
			label: `${diagnosis.code_system} ${diagnosis.code}${diagnosis.title ? ` - ${diagnosis.title}` : ''}`,
			value: diagnosis.id
		}))
	]);

	const badgeBase =
		'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors';

	const showResponsibleEmployee = $derived($form.admin_mode !== 'self');

	$effect(() => {
		if (!showResponsibleEmployee) {
			if ($form.responsible_employee_id !== '') $form.responsible_employee_id = '';
			if (responsibleEmployeeName !== '') responsibleEmployeeName = '';
		}
	});

	$effect(() => {
		if (!$form.is_prn) {
			if ($form.prn_indication !== '') $form.prn_indication = '';
			if ($form.max_doses_per_24h !== undefined) $form.max_doses_per_24h = undefined;
		}
	});

	const handleAttachmentUploaded = (fileId: string, fileName: string) => {
		$form.source_attachment_uuid = fileId;
		uploadedAttachment = { id: fileId, name: fileName };
		currentUploadFileId = null;
		uploadKey += 1;
	};

	const clearAttachment = () => {
		$form.source_attachment_uuid = '';
		uploadedAttachment = null;
		currentUploadFileId = null;
		uploadKey += 1;
	};

	const toRfc3339Date = (value: string | null | undefined) => {
		if (!value) return null;
		return `${value}T00:00:00Z`;
	};

	const loadEmployeeOptions = async (query: string): Promise<EmployeeListItem[]> => {
		const response = await listEmployees({
			page: 1,
			pageSize: 50,
			isArchived: false,
			outOfService: false,
			search: query
		});

		return response.data.results;
	};
</script>

<Modal
	bind:open
	title="Create Medication Order"
	description="Record medication details, administration mode, and safeguards for this client."
	size="xl"
>
	<form id={formId} use:enhance class="space-y-6">
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Medication identity
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Medication name"
					placeholder="Sertraline"
					bind:value={$form.medication_name}
					error={formatFormError($errors.medication_name)}
				/>
				<Select
					label="Route"
					options={routeOptions}
					bind:value={$form.route}
					placeholder="Select route"
					error={formatFormError($errors.route)}
				/>
			</div>
			<Input
				label="Dosage text"
				placeholder="50 mg once daily in the morning"
				bind:value={$form.dosage_text}
				error={formatFormError($errors.dosage_text)}
			/>
			<Checkbox label="Mark as critical medication" bind:checked={$form.is_critical} />
		</section>

		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Dosing and schedule
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input
					label="Dose amount"
					type="number"
					step="0.01"
					bind:value={$form.dose_amount}
					error={formatFormError($errors.dose_amount)}
				/>
				<Select
					label="Dose unit"
					options={doseUnitOptions}
					bind:value={$form.dose_unit}
					placeholder="Select unit"
					error={formatFormError($errors.dose_unit)}
				/>
				<Input
					label="Frequency text"
					placeholder="Once daily"
					bind:value={$form.frequency_text}
					error={formatFormError($errors.frequency_text)}
				/>
			</div>

			<Textarea
				label="Structured schedule (JSON)"
				placeholder={`[{"time":"08:00"}]`}
				rows={3}
				bind:value={scheduleInput}
				error={formatFormError($errors.schedule)}
			/>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Checkbox label="PRN (as needed)" bind:checked={$form.is_prn} />
				{#if $form.is_prn}
					<Input
						label="Max doses per 24h"
						type="number"
						step="1"
						bind:value={$form.max_doses_per_24h}
						error={formatFormError($errors.max_doses_per_24h)}
					/>
				{/if}
			</div>

			{#if $form.is_prn}
				<Textarea
					label="PRN indication"
					placeholder="Acute panic symptoms"
					rows={2}
					bind:value={$form.prn_indication}
					error={formatFormError($errors.prn_indication)}
				/>
			{/if}
		</section>

		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Administration
			</h3>

			<div class="space-y-2">
				<p class="ml-1 text-sm font-semibold text-text-muted">Admin mode</p>
				<div class="flex flex-wrap gap-2">
					{#each adminModeOptions as option (option.value)}
						<button
							type="button"
							onclick={() => ($form.admin_mode = option.value)}
							class="{badgeBase} {$form.admin_mode === option.value
								? option.activeClass
								: 'border-border bg-surface text-text-muted hover:bg-border/30'}"
						>
							{option.label}
						</button>
					{/each}
				</div>
				{#if $errors.admin_mode}
					<p class="ml-1 text-xs font-medium text-error">{formatFormError($errors.admin_mode)}</p>
				{/if}
			</div>

			{#if showResponsibleEmployee}
				<SearchSelect
					label="Responsible employee"
					bind:value={$form.responsible_employee_id}
					bind:displayValue={responsibleEmployeeName}
					loadOptions={loadEmployeeOptions}
					labelFn={(employee) => `${employee.first_name} ${employee.last_name}`}
					valueFn={(employee) => employee.id}
					placeholder="Search employee"
					searchPlaceholder="Search employees..."
					error={formatFormError($errors.responsible_employee_id)}
				/>
			{/if}

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Select
					label="Linked diagnosis"
					options={diagnosisOptions}
					bind:value={$form.diagnosis_id}
					placeholder="Select diagnosis"
					error={formatFormError($errors.diagnosis_id)}
				/>
				<Select
					label="Order status"
					options={statusOptions}
					bind:value={$form.status}
					error={formatFormError($errors.status)}
				/>
			</div>
		</section>

		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Timeline and notes
			</h3>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<DatePicker
					label="Start date"
					bind:value={$form.start_date}
					error={formatFormError($errors.start_date)}
				/>
				<DatePicker
					label="End date"
					bind:value={$form.end_date}
					error={formatFormError($errors.end_date)}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<div class="space-y-3">
					<div class="ml-1 text-sm font-semibold text-text-muted">Source attachment</div>
					<div class="space-y-4 rounded-2xl border border-border bg-surface/60 p-4">
						{#key uploadKey}
							<FileUpload
								bind:fileId={currentUploadFileId}
								onUpload={handleAttachmentUploaded}
								accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
							/>
						{/key}

						{#if uploadedAttachment}
							<div class="rounded-xl border border-border/60 bg-zinc-50/70 p-3 dark:bg-zinc-900/30">
								<p class="mb-2 text-xs font-bold tracking-wide text-text-subtle uppercase">
									Uploaded file
								</p>
								<div
									class="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
								>
									<div class="flex items-center gap-2 text-sm text-text">
										<Paperclip class="h-4 w-4 text-text-subtle" />
										<span class="font-medium">{uploadedAttachment.name}</span>
									</div>
									<button
										type="button"
										class="rounded p-1 text-text-subtle transition-colors hover:bg-error/10 hover:text-error"
										onclick={clearAttachment}
										title="Remove attachment"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
							</div>
						{/if}
					</div>
					<p class="ml-1 text-xs font-medium text-text-subtle">
						Upload a source file. The uploaded attachment ID is linked automatically.
					</p>
				</div>
				<Textarea
					label="Notes"
					placeholder="Take with food if nausea occurs."
					rows={3}
					bind:value={$form.notes}
					error={formatFormError($errors.notes)}
				/>
			</div>
		</section>

		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}
		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button
				variant="ghost"
				onclick={() => {
					reset();
					open = false;
				}}
				disabled={$delayed}>Cancel</Button
			>
			<Button class="gap-2" type="button" onclick={submitForm} isLoading={$delayed}>
				<Pill class="h-4 w-4" />
				Create medication
			</Button>
		</div>
	{/snippet}
</Modal>
