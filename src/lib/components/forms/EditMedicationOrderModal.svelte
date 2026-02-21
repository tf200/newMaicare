<script lang="ts">
	import { onMount } from 'svelte';
	import { getClientMedicationOrder, updateClientMedicationOrder } from '$lib/api/clients';
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
		ClientMedicationOrderResponse,
		MedicationAdminMode,
		MedicationOrderStatus,
		MedicationScheduleItem,
		UpdateClientMedicationOrderRequest
	} from '$lib/types/api';

	interface Props {
		clientId: string;
		orderId: string | null;
		diagnoses?: ClientDiagnosisResponse[];
		open?: boolean;
		onUpdated?: () => void;
	}

	let { clientId, orderId, diagnoses = [], open = $bindable(false), onUpdated }: Props = $props();

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

	let diagnosisId = $state('');
	let medicationName = $state('');
	let dosageText = $state('');
	let doseAmount = $state<number | undefined>(undefined);
	let doseUnit = $state('');
	let route = $state('');
	let frequencyText = $state('');
	let scheduleInput = $state('');
	let isPrn = $state(false);
	let prnIndication = $state('');
	let maxDosesPer24h = $state<number | undefined>(undefined);
	let startDate = $state('');
	let endDate = $state('');
	let status = $state<MedicationOrderStatus>('active');
	let adminMode = $state<MedicationAdminMode>('self');
	let responsibleEmployeeId = $state('');
	let responsibleEmployeeName = $state('');
	let isCritical = $state(false);
	let notes = $state('');
	let sourceAttachmentUuid = $state('');
	let uploadedAttachment = $state<{ id: string; name: string } | null>(null);
	let currentUploadFileId = $state<string | null>(null);
	let uploadKey = $state(0);

	let isLoading = $state(false);
	let isFetchingOrder = $state(false);
	let errorMessage = $state('');
	let fieldErrors = $state<{
		medication_name?: string;
		dosage_text?: string;
		schedule?: string;
		prn_indication?: string;
		max_doses_per_24h?: string;
		start_date?: string;
		end_date?: string;
		responsible_employee_id?: string;
	}>({});

	const badgeBase =
		'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors';

	const showResponsibleEmployee = $derived(adminMode !== 'self');

	const handleAttachmentUploaded = (fileId: string, fileName: string) => {
		sourceAttachmentUuid = fileId;
		uploadedAttachment = { id: fileId, name: fileName };
		currentUploadFileId = null;
		uploadKey += 1;
	};

	const clearAttachment = () => {
		sourceAttachmentUuid = '';
		uploadedAttachment = null;
		currentUploadFileId = null;
		uploadKey += 1;
	};

	const toNullable = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	};

	const toNumberOrNull = (value: number | null | undefined) => {
		if (value === null || value === undefined) return null;
		return Number.isFinite(value) ? value : null;
	};

	const toRfc3339Date = (value: string) => {
		if (!value) return null;
		return `${value}T00:00:00Z`;
	};

	const toInputDate = (value: string | null) => {
		if (!value) return '';
		return value.slice(0, 10);
	};

	const parseSchedule = (): MedicationScheduleItem[] | null => {
		if (!scheduleInput.trim()) return [];

		try {
			const parsed = JSON.parse(scheduleInput) as unknown;
			if (!Array.isArray(parsed)) return null;

			const normalized = parsed
				.map((entry) => {
					if (!entry || typeof entry !== 'object') return null;
					const maybeTime = (entry as { time?: unknown }).time;
					if (typeof maybeTime !== 'string' || !maybeTime.trim()) return null;
					return { time: maybeTime.trim() };
				})
				.filter((entry): entry is MedicationScheduleItem => entry !== null);

			return normalized;
		} catch {
			return null;
		}
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

	const isMedicationOrderStatus = (value: string): value is MedicationOrderStatus =>
		statusOptions.some((option) => option.value === value);

	const populateForm = (order: ClientMedicationOrderResponse) => {
		diagnosisId = order.diagnosis_id ?? '';
		medicationName = order.medication_name;
		dosageText = order.dosage_text;
		doseAmount = order.dose_amount ?? undefined;
		doseUnit = order.dose_unit ?? '';
		route = order.route ?? '';
		frequencyText = order.frequency_text ?? '';
		scheduleInput = order.schedule.length > 0 ? JSON.stringify(order.schedule, null, 2) : '';
		isPrn = order.is_prn;
		prnIndication = order.prn_indication ?? '';
		maxDosesPer24h = order.max_doses_per_24h ?? undefined;
		startDate = toInputDate(order.start_date);
		endDate = toInputDate(order.end_date);
		status = isMedicationOrderStatus(order.status) ? order.status : 'active';
		adminMode = order.admin_mode;
		responsibleEmployeeId = order.responsible_employee_id ?? '';
		responsibleEmployeeName = [
			order.responsible_employee_first_name,
			order.responsible_employee_last_name
		]
			.filter(Boolean)
			.join(' ');
		isCritical = order.is_critical;
		notes = order.notes ?? '';
		sourceAttachmentUuid = order.source_attachment_uuid ?? '';
		uploadedAttachment = order.source_attachment_uuid
			? {
					id: order.source_attachment_uuid,
					name: order.source_attachment_uuid
				}
			: null;
		currentUploadFileId = null;
		uploadKey += 1;
		errorMessage = '';
		fieldErrors = {};
	};

	const validate = () => {
		const nextErrors: {
			medication_name?: string;
			dosage_text?: string;
			schedule?: string;
			prn_indication?: string;
			max_doses_per_24h?: string;
			start_date?: string;
			end_date?: string;
			responsible_employee_id?: string;
		} = {};

		if (!medicationName.trim()) nextErrors.medication_name = 'Medication name is required.';
		if (!dosageText.trim()) nextErrors.dosage_text = 'Dosage text is required.';
		if (!startDate) nextErrors.start_date = 'Start date is required.';

		if (endDate && startDate && endDate < startDate) {
			nextErrors.end_date = 'End date cannot be before start date.';
		}

		if (showResponsibleEmployee && !responsibleEmployeeId.trim()) {
			nextErrors.responsible_employee_id =
				'Responsible employee is required for staff/shared admin mode.';
		}

		if (isPrn && !prnIndication.trim()) {
			nextErrors.prn_indication = 'PRN indication is required when medication is PRN.';
		}

		if (isPrn && maxDosesPer24h !== null && maxDosesPer24h !== undefined) {
			if (!Number.isInteger(maxDosesPer24h) || maxDosesPer24h <= 0) {
				nextErrors.max_doses_per_24h = 'Max doses per 24h must be a positive integer.';
			}
		}

		if (scheduleInput.trim() && parseSchedule() === null) {
			nextErrors.schedule = 'Schedule must be a JSON array like [{"time":"08:00"}].';
		}

		fieldErrors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	};

	onMount(() => {
		if (!orderId) {
			errorMessage = 'No medication order selected.';
			return;
		}

		isFetchingOrder = true;
		errorMessage = '';

		const loadOrder = async () => {
			try {
				const response = await getClientMedicationOrder(clientId, orderId);
				populateForm(response.data);
			} catch (error) {
				errorMessage =
					error instanceof Error ? error.message : 'Failed to load medication order details.';
			} finally {
				isFetchingOrder = false;
			}
		};

		void loadOrder();
	});

	const handleCancel = () => {
		open = false;
	};

	const handleUpdate = async () => {
		errorMessage = '';
		if (!orderId) {
			errorMessage = 'No medication order selected.';
			return;
		}

		if (!validate()) return;

		const parsedSchedule = parseSchedule();
		if (parsedSchedule === null) return;

		const payload: UpdateClientMedicationOrderRequest = {
			diagnosis_id: toNullable(diagnosisId),
			medication_name: medicationName.trim(),
			dosage_text: dosageText.trim(),
			dose_amount: toNumberOrNull(doseAmount),
			dose_unit: toNullable(doseUnit),
			route: toNullable(route),
			frequency_text: toNullable(frequencyText),
			schedule: parsedSchedule,
			is_prn: isPrn,
			prn_indication: isPrn ? toNullable(prnIndication) : null,
			max_doses_per_24h: isPrn ? toNumberOrNull(maxDosesPer24h) : null,
			start_date: toRfc3339Date(startDate) ?? undefined,
			end_date: toRfc3339Date(endDate),
			status,
			admin_mode: adminMode,
			responsible_employee_id: adminMode === 'self' ? null : toNullable(responsibleEmployeeId),
			is_critical: isCritical,
			notes: toNullable(notes),
			source_attachment_uuid: toNullable(sourceAttachmentUuid)
		};

		isLoading = true;

		try {
			await updateClientMedicationOrder(clientId, orderId, payload);
			open = false;
			onUpdated?.();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to update medication order.';
		} finally {
			isLoading = false;
		}
	};
</script>

<Modal
	bind:open
	title="Edit Medication Order"
	description="Update medication details, administration mode, and safeguards for this client."
	size="xl"
>
	{#if isFetchingOrder}
		<div class="rounded-xl border border-border/60 bg-surface/80 px-4 py-10 text-center">
			<p class="text-sm font-medium text-text-muted">Loading medication order...</p>
		</div>
	{:else}
		<div class="space-y-6">
			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Medication identity
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Input
						label="Medication name"
						placeholder="Sertraline"
						bind:value={medicationName}
						error={fieldErrors.medication_name}
					/>
					<Select
						label="Route"
						options={routeOptions}
						bind:value={route}
						placeholder="Select route"
					/>
				</div>
				<Input
					label="Dosage text"
					placeholder="50 mg once daily in the morning"
					bind:value={dosageText}
					error={fieldErrors.dosage_text}
				/>
				<Checkbox label="Mark as critical medication" bind:checked={isCritical} />
			</section>

			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Dosing and schedule
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
					<Input label="Dose amount" type="number" step="0.01" bind:value={doseAmount} />
					<Select
						label="Dose unit"
						options={doseUnitOptions}
						bind:value={doseUnit}
						placeholder="Select unit"
					/>
					<Input label="Frequency text" placeholder="Once daily" bind:value={frequencyText} />
				</div>

				<Textarea
					label="Structured schedule (JSON)"
					placeholder="JSON array with time entries"
					rows={3}
					bind:value={scheduleInput}
					error={fieldErrors.schedule}
				/>

				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Checkbox label="PRN (as needed)" bind:checked={isPrn} />
					{#if isPrn}
						<Input
							label="Max doses per 24h"
							type="number"
							step="1"
							bind:value={maxDosesPer24h}
							error={fieldErrors.max_doses_per_24h}
						/>
					{/if}
				</div>

				{#if isPrn}
					<Textarea
						label="PRN indication"
						placeholder="Acute panic symptoms"
						rows={2}
						bind:value={prnIndication}
						error={fieldErrors.prn_indication}
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
								onclick={() => (adminMode = option.value)}
								class="{badgeBase} {adminMode === option.value
									? option.activeClass
									: 'border-border bg-surface text-text-muted hover:bg-border/30'}"
							>
								{option.label}
							</button>
						{/each}
					</div>
				</div>

				{#if showResponsibleEmployee}
					<SearchSelect
						label="Responsible employee"
						bind:value={responsibleEmployeeId}
						bind:displayValue={responsibleEmployeeName}
						loadOptions={loadEmployeeOptions}
						labelFn={(employee) => `${employee.first_name} ${employee.last_name}`}
						valueFn={(employee) => employee.id}
						placeholder="Search employee"
						searchPlaceholder="Search employees..."
						error={fieldErrors.responsible_employee_id}
					/>
				{/if}

				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Select
						label="Linked diagnosis"
						options={diagnosisOptions}
						bind:value={diagnosisId}
						placeholder="Select diagnosis"
					/>
					<Select label="Order status" options={statusOptions} bind:value={status} />
				</div>
			</section>

			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Timeline and notes
				</h3>

				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<DatePicker label="Start date" bind:value={startDate} error={fieldErrors.start_date} />
					<DatePicker label="End date" bind:value={endDate} error={fieldErrors.end_date} />
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
								<div
									class="rounded-xl border border-border/60 bg-zinc-50/70 p-3 dark:bg-zinc-900/30"
								>
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
										<Button
											variant="ghost"
											class="h-8 w-8 px-0 text-text-subtle hover:text-error"
											onclick={clearAttachment}
											title="Remove attachment"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
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
						bind:value={notes}
					/>
				</div>
			</section>

			{#if errorMessage}
				<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
					{errorMessage}
				</div>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isLoading || isFetchingOrder}
				>Cancel</Button
			>
			<Button class="gap-2" onclick={handleUpdate} isLoading={isLoading || isFetchingOrder}>
				<Pill class="h-4 w-4" />
				Update medication
			</Button>
		</div>
	{/snippet}
</Modal>
