<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import FileUpload from '$lib/components/ui/FileUpload.svelte';
	import { Trash2, Plus, Paperclip } from 'lucide-svelte';
	import { createContract } from '$lib/api/contracts';
	import { listClients } from '$lib/api/clients';
	import { listSenders } from '$lib/api/senders';
	import type { CreateContractRequest, ListClientsResponse, SenderListItem } from '$lib/types/api';

	let { open = $bindable(false), onCreated } = $props<{
		open?: boolean;
		onCreated?: () => void;
	}>();

	const createInitialFormData = () => ({
		client_id: '',
		sender_id: '',
		care_name: '',
		care_type: '' as 'ambulante' | 'accommodation' | '',
		start_date: '',
		end_date: '',
		price: '',
		price_time_unit: '' as 'minute' | 'hourly' | 'daily' | 'weekly' | '',
		hours: '',
		hours_type: '' as 'weekly' | 'all_period' | '',
		financing_act: '' as 'WMO' | 'ZVW' | 'WLZ' | 'JW' | 'WPG' | '',
		financing_option: '' as 'ZIN' | 'PGB' | '',
		type_id: '',
		reminder_period: '',
		VAT: ''
	});

	let formData = $state(createInitialFormData());
	let errors = $state<Record<string, string>>({});
	let errorMessage = $state('');
	let isLoading = $state(false);
	let uploadedAttachments = $state<Array<{ id: string; name: string }>>([]);
	let currentUploadFileId = $state<string | null>(null);
	let uploadKey = $state(0);

	// Options
	const careTypeOptions = [
		{ value: 'ambulante', label: 'Ambulante' },
		{ value: 'accommodation', label: 'Accommodation' }
	];

	const financingActOptions = [
		{ value: 'WMO', label: 'WMO' },
		{ value: 'ZVW', label: 'ZVW' },
		{ value: 'WLZ', label: 'WLZ' },
		{ value: 'JW', label: 'JW' },
		{ value: 'WPG', label: 'WPG' }
	];

	const financingOptionOptions = [
		{ value: 'ZIN', label: 'ZIN (Zorg in Natura)' },
		{ value: 'PGB', label: 'PGB (Persoonsgebonden Budget)' }
	];

	const hoursTypeOptions = [
		{ value: 'weekly', label: 'Weekly' },
		{ value: 'all_period', label: 'All Period' }
	];

	const timeUnitOptions = $derived.by(() => {
		if (formData.care_type === 'ambulante') {
			return [
				{ value: 'minute', label: 'Minute' },
				{ value: 'hourly', label: 'Hourly' }
			];
		} else if (formData.care_type === 'accommodation') {
			return [
				{ value: 'daily', label: 'Daily' },
				{ value: 'weekly', label: 'Weekly' }
			];
		}
		return [];
	});

	// Reset dependent fields when care_type changes
	$effect(() => {
		if (formData.care_type === 'accommodation') {
			formData.hours = '';
			formData.hours_type = '';
		}
		// Reset price_time_unit if it's no longer valid
		const validUnits = timeUnitOptions.map((o) => o.value);
		if (formData.price_time_unit && !validUnits.includes(formData.price_time_unit)) {
			formData.price_time_unit = '';
		}
	});

	// Validation
	const validate = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.client_id) newErrors.client_id = 'Client is required';
		if (!formData.sender_id) newErrors.sender_id = 'Sender is required';
		if (!formData.care_name.trim()) newErrors.care_name = 'Care name is required';
		if (!formData.care_type) newErrors.care_type = 'Care type is required';
		if (!formData.start_date) newErrors.start_date = 'Start date is required';
		if (!formData.end_date) newErrors.end_date = 'End date is required';

		if (formData.start_date && formData.end_date) {
			if (new Date(formData.end_date) <= new Date(formData.start_date)) {
				newErrors.end_date = 'End date must be after start date';
			}
		}

		if (!formData.price) {
			newErrors.price = 'Price is required';
		} else if (Number(formData.price) <= 0) {
			newErrors.price = 'Price must be greater than 0';
		}

		if (!formData.price_time_unit) newErrors.price_time_unit = 'Time unit is required';

		if (
			formData.care_type === 'ambulante' &&
			formData.price_time_unit &&
			!['minute', 'hourly'].includes(formData.price_time_unit)
		) {
			newErrors.price_time_unit = 'Ambulante care supports minute or hourly units only';
		}

		if (
			formData.care_type === 'accommodation' &&
			formData.price_time_unit &&
			!['daily', 'weekly'].includes(formData.price_time_unit)
		) {
			newErrors.price_time_unit = 'Accommodation care supports daily or weekly units only';
		}

		if (formData.care_type === 'ambulante') {
			if (!formData.hours) {
				newErrors.hours = 'Hours are required for ambulante care';
			} else if (Number(formData.hours) <= 0) {
				newErrors.hours = 'Hours must be greater than 0';
			}
			if (!formData.hours_type) newErrors.hours_type = 'Hours type is required';
		} else if (formData.care_type === 'accommodation') {
			if (toTrimmedString(formData.hours)) {
				newErrors.hours = 'Hours must be empty for accommodation care';
			}
			if (formData.hours_type) {
				newErrors.hours_type = 'Hours type must be empty for accommodation care';
			}
		}

		if (!formData.financing_act) newErrors.financing_act = 'Financing act is required';
		if (!formData.financing_option) newErrors.financing_option = 'Financing option is required';

		if (formData.VAT) {
			const vatNum = Number(formData.VAT);
			if (isNaN(vatNum) || vatNum < 0 || vatNum > 100) {
				newErrors.VAT = 'VAT must be between 0 and 100';
			}
		}

		if (formData.reminder_period) {
			const rpNum = Number(formData.reminder_period);
			if (isNaN(rpNum) || rpNum < 0) {
				newErrors.reminder_period = 'Reminder period must be 0 or more';
			}
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	};

	const toRFC3339 = (dateStr: string) => {
		if (!dateStr) return '';
		return `${dateStr}T00:00:00Z`;
	};

	const toTrimmedString = (value: unknown) => {
		if (value === null || value === undefined) return '';
		if (typeof value === 'string') return value.trim();
		return String(value).trim();
	};

	const toOptionalNumber = (value: string | number | null | undefined) => {
		const trimmed = toTrimmedString(value);
		if (!trimmed) return undefined;
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) ? parsed : undefined;
	};

	const handleAttachmentUploaded = (fileId: string) => {
		if (uploadedAttachments.some((file) => file.id === fileId)) {
			currentUploadFileId = null;
			uploadKey += 1;
			return;
		}

		uploadedAttachments = [
			...uploadedAttachments,
			{ id: fileId, name: `Attachment ${uploadedAttachments.length + 1}` }
		];
		currentUploadFileId = null;
		uploadKey += 1;
	};

	const removeUploadedAttachment = (index: number) => {
		uploadedAttachments = uploadedAttachments.filter((_, idx) => idx !== index);
	};

	const resetForm = () => {
		formData = createInitialFormData();
		uploadedAttachments = [];
		currentUploadFileId = null;
		uploadKey = 0;
		errors = {};
		errorMessage = '';
	};

	const handleSubmit = async () => {
		if (isLoading) return;
		errorMessage = '';
		if (!validate()) return;

		isLoading = true;
		try {
			const attachmentIds = Array.from(
				new Set(
					uploadedAttachments
						.map((attachment) => attachment.id)
						.filter((fileId): fileId is string => Boolean(fileId && fileId.trim()))
				)
			);

			const payload: CreateContractRequest = {
				client_id: formData.client_id,
				sender_id: formData.sender_id,
				care_name: formData.care_name.trim(),
				care_type: formData.care_type as 'ambulante' | 'accommodation',
				start_date: toRFC3339(formData.start_date),
				end_date: toRFC3339(formData.end_date),
				price: Number(formData.price),
				price_time_unit: formData.price_time_unit as CreateContractRequest['price_time_unit'],
				financing_act: formData.financing_act as CreateContractRequest['financing_act'],
				financing_option: formData.financing_option as CreateContractRequest['financing_option'],
				hours: formData.care_type === 'ambulante' ? Number(formData.hours) : null,
				hours_type:
					formData.care_type === 'ambulante'
						? (formData.hours_type as CreateContractRequest['hours_type'])
						: null,
				type_id: toTrimmedString(formData.type_id) || undefined,
				reminder_period: toOptionalNumber(formData.reminder_period),
				VAT: toOptionalNumber(formData.VAT),
				attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined
			};

			await createContract(payload);
			resetForm();
			onCreated?.();
			open = false;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to create contract';
		} finally {
			isLoading = false;
		}
	};

	const handleCancel = () => {
		resetForm();
		open = false;
	};

	const loadClients = async (query: string) => {
		const res = await listClients({ search: query, page: 1, pageSize: 50 });
		return res.data.results;
	};

	const loadSenders = async (query: string) => {
		const res = await listSenders({ search: query, page: 1, pageSize: 50 });
		return res.data.results;
	};
</script>

{#snippet clientItem(option: ListClientsResponse)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.first_name} {option.last_name}</span>
		<div class="flex items-center gap-2 text-xs text-text-muted">
			<span>BSN: {option.bsn}</span>
			<span class="h-1 w-1 rounded-full bg-border"></span>
			<span>File: {option.filenumber}</span>
		</div>
	</div>
{/snippet}

{#snippet senderItem(option: SenderListItem)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex items-center gap-2 text-xs text-text-muted">
			<span class="capitalize">{option.types.replace(/_/g, ' ')}</span>
			{#if option.city}
				<span class="h-1 w-1 rounded-full bg-border"></span>
				<span>{option.city}</span>
			{/if}
		</div>
	</div>
{/snippet}

<Modal
	bind:open
	title="Create New Contract"
	description="Define care terms, financial details, and periods for a client contract."
	size="4xl"
>
	<div class="space-y-6">
		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}

		<!-- Section: Parties -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Parties
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<SearchSelect
					label="Client"
					loadOptions={loadClients}
					bind:value={formData.client_id}
					error={errors.client_id}
					item={clientItem}
					labelFn={(client) => `${client.first_name} ${client.last_name}`}
					valueFn={(client) => client.id}
					placeholder="Search for a client..."
				/>
				<SearchSelect
					label="Sender"
					loadOptions={loadSenders}
					bind:value={formData.sender_id}
					error={errors.sender_id}
					item={senderItem}
					labelFn={(sender) => sender.name}
					valueFn={(sender) => sender.id}
					placeholder="Search for a sender..."
				/>
			</div>
		</section>

		<!-- Section: Care & Terms -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Care & Terms
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Care Name"
					placeholder="e.g. Individual Support"
					bind:value={formData.care_name}
					error={errors.care_name}
					required
				/>
				<Select
					label="Care Type"
					bind:value={formData.care_type}
					options={careTypeOptions}
					placeholder="Select care type..."
					error={errors.care_type}
				/>
				<DatePicker label="Start Date" bind:value={formData.start_date} error={errors.start_date} />
				<DatePicker label="End Date" bind:value={formData.end_date} error={errors.end_date} />
				<Input
					label="Type ID (Optional)"
					placeholder="UUID"
					bind:value={formData.type_id}
					error={errors.type_id}
				/>
			</div>
		</section>

		<!-- Section: Financials -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Financials
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
				<Input
					label="Price"
					type="number"
					placeholder="0.00"
					bind:value={formData.price}
					error={errors.price}
					required
				/>
				<Select
					label="Time Unit"
					bind:value={formData.price_time_unit}
					options={timeUnitOptions}
					placeholder="Select unit..."
					error={errors.price_time_unit}
				/>
				<Input
					label="VAT % (Optional)"
					type="number"
					placeholder="21"
					bind:value={formData.VAT}
					error={errors.VAT}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				{#if formData.care_type === 'ambulante'}
					<Input
						label="Hours"
						type="number"
						placeholder="40"
						bind:value={formData.hours}
						error={errors.hours}
						required
					/>
					<Select
						label="Hours Type"
						bind:value={formData.hours_type}
						options={hoursTypeOptions}
						placeholder="Select hours type..."
						error={errors.hours_type}
					/>
				{/if}
				<Select
					label="Financing Act"
					bind:value={formData.financing_act}
					options={financingActOptions}
					placeholder="Select act..."
					error={errors.financing_act}
				/>
				<Select
					label="Financing Option"
					bind:value={formData.financing_option}
					options={financingOptionOptions}
					placeholder="Select option..."
					error={errors.financing_option}
				/>
			</div>
		</section>

		<!-- Section: Optional Settings -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Optional Settings
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Reminder Period (Days)"
					type="number"
					placeholder="30"
					bind:value={formData.reminder_period}
					error={errors.reminder_period}
				/>
				<div class="space-y-3">
					<div class="ml-1 text-sm font-semibold text-text-muted">Attachments</div>
					<div class="space-y-4 rounded-2xl border border-border bg-surface/60 p-4">
						{#key uploadKey}
							<FileUpload
								bind:fileId={currentUploadFileId}
								onUpload={handleAttachmentUploaded}
								accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
							/>
						{/key}

						{#if uploadedAttachments.length > 0}
							<div
								class="space-y-2 rounded-xl border border-border/60 bg-zinc-50/70 p-3 dark:bg-zinc-900/30"
							>
								<p class="text-xs font-bold tracking-wide text-text-subtle uppercase">
									Uploaded files ({uploadedAttachments.length})
								</p>
								<div class="space-y-2">
									{#each uploadedAttachments as attachment, index (attachment.id)}
										<div
											class="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
										>
											<div class="flex items-center gap-2 text-sm text-text">
												<Paperclip class="h-4 w-4 text-text-subtle" />
												<span class="font-medium">{attachment.name}</span>
											</div>
											<Button
												variant="ghost"
												class="h-8 w-8 px-0 text-text-subtle hover:text-error"
												onclick={() => removeUploadedAttachment(index)}
												title="Remove attachment"
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
					<p class="ml-1 text-xs font-medium text-text-subtle">
						Upload directly. Each completed upload is added automatically to this contract.
					</p>
				</div>
			</div>
		</section>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isLoading}>Cancel</Button>
			<Button variant="secondary" class="gap-2" onclick={handleSubmit} {isLoading}>
				<Plus class="h-4 w-4" />
				{isLoading ? 'Creating Contract...' : 'Create Contract'}
			</Button>
		</div>
	{/snippet}
</Modal>
