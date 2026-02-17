<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import FileUpload from '$lib/components/ui/FileUpload.svelte';
	import { Plus, Paperclip, Trash2 } from 'lucide-svelte';
	import { listSenders } from '$lib/api/senders';
	import { updateContract } from '$lib/api/contracts';
	import type {
		ContractCareType,
		ContractFinancingAct,
		ContractFinancingOption,
		ContractHoursType,
		ContractPriceTimeUnit,
		SenderListItem,
		UpdateContractRequest
	} from '$lib/types/api';

	interface EditableContractData {
		id: string;
		typeId: string | null;
		startDate: string;
		endDate: string;
		reminderPeriod: number;
		vat: number | null;
		price: number;
		priceTimeUnit: ContractPriceTimeUnit;
		hours: number | null;
		hoursType: ContractHoursType | null;
		careName: string;
		careType: ContractCareType;
		sender: { id: string };
		financingAct: ContractFinancingAct;
		financingOption: ContractFinancingOption;
		attachments: Array<{ id: string; name: string }>;
	}

	let {
		open = $bindable(false),
		contract = null,
		onUpdated
	} = $props<{
		open?: boolean;
		contract?: EditableContractData | null;
		onUpdated?: () => void;
	}>();

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

	const toDateInput = (value: string) => {
		if (!value) return '';
		return value.split('T')[0] ?? '';
	};

	const createInitialFormData = (source: EditableContractData) => ({
		sender_id: source.sender.id,
		care_name: source.careName,
		care_type: source.careType,
		start_date: toDateInput(source.startDate),
		end_date: toDateInput(source.endDate),
		price: String(source.price),
		price_time_unit: source.priceTimeUnit,
		hours: source.hours === null ? '' : String(source.hours),
		hours_type: source.hoursType ?? '',
		financing_act: source.financingAct,
		financing_option: source.financingOption,
		type_id: source.typeId ?? '',
		reminder_period: String(source.reminderPeriod),
		VAT: source.vat === null ? '' : String(source.vat)
	});

	let formData = $state<ReturnType<typeof createInitialFormData> | null>(null);
	let initializedContractId = $state<string | null>(null);
	let errors = $state<Record<string, string>>({});
	let errorMessage = $state('');
	let isLoading = $state(false);
	let uploadedAttachments = $state<Array<{ id: string; name: string }>>([]);
	let currentUploadFileId = $state<string | null>(null);
	let uploadKey = $state(0);

	$effect(() => {
		if (!open || !contract) return;
		if (initializedContractId === contract.id) return;

		formData = createInitialFormData(contract);
		uploadedAttachments = contract.attachments.map((attachment: { id: string; name: string }) => ({
			id: attachment.id,
			name: attachment.name
		}));
		errors = {};
		errorMessage = '';
		currentUploadFileId = null;
		uploadKey = 0;
		initializedContractId = contract.id;
	});

	const timeUnitOptions = $derived.by(() => {
		if (!formData) return [];
		if (formData.care_type === 'ambulante') {
			return [
				{ value: 'minute', label: 'Minute' },
				{ value: 'hourly', label: 'Hourly' }
			];
		}
		return [
			{ value: 'daily', label: 'Daily' },
			{ value: 'weekly', label: 'Weekly' }
		];
	});

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

	const validate = () => {
		if (!formData) return false;
		const newErrors: Record<string, string> = {};

		if (!formData.sender_id) newErrors.sender_id = 'Sender is required';
		if (!formData.care_name.trim()) newErrors.care_name = 'Care name is required';
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
		} else {
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

	const handleAttachmentUploaded = (fileId: string, fileName: string) => {
		if (uploadedAttachments.some((file) => file.id === fileId)) {
			currentUploadFileId = null;
			uploadKey += 1;
			return;
		}

		uploadedAttachments = [...uploadedAttachments, { id: fileId, name: fileName }];
		currentUploadFileId = null;
		uploadKey += 1;
	};

	const removeUploadedAttachment = (index: number) => {
		uploadedAttachments = uploadedAttachments.filter((_, idx) => idx !== index);
	};

	const handleCancel = () => {
		errorMessage = '';
		errors = {};
		initializedContractId = null;
		open = false;
	};

	const loadSenders = async (query: string) => {
		const res = await listSenders({ search: query, page: 1, pageSize: 50 });
		return res.data.results;
	};

	const handleSubmit = async () => {
		if (isLoading || !contract || !formData) return;
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

			const payload: UpdateContractRequest = {
				type_id: toTrimmedString(formData.type_id) || undefined,
				start_date: toRFC3339(formData.start_date),
				end_date: toRFC3339(formData.end_date),
				reminder_period: toOptionalNumber(formData.reminder_period),
				VAT: toOptionalNumber(formData.VAT),
				price: Number(formData.price),
				price_time_unit: formData.price_time_unit,
				hours: formData.care_type === 'ambulante' ? Number(formData.hours) : null,
				hours_type:
					formData.care_type === 'ambulante' ? (formData.hours_type as ContractHoursType) : null,
				care_name: formData.care_name.trim(),
				sender_id: formData.sender_id,
				attachment_ids: attachmentIds,
				financing_act: formData.financing_act,
				financing_option: formData.financing_option
			};

			await updateContract(contract.id, payload);
			open = false;
			initializedContractId = null;
			onUpdated?.();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to update contract';
		} finally {
			isLoading = false;
		}
	};
</script>

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
	title="Update Contract"
	description="Adjust contract terms and pricing. Care type remains fixed."
	size="4xl"
>
	{#if formData}
		<div class="space-y-6">
			{#if errorMessage}
				<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
					{errorMessage}
				</div>
			{/if}

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
					<div class="space-y-2">
						<p class="ml-1 text-sm font-semibold text-text-muted">Care Type</p>
						<div
							class="rounded-xl border border-border bg-bg px-4 py-3.5 text-sm font-semibold text-text capitalize"
						>
							{formData.care_type}
						</div>
					</div>
					<DatePicker
						label="Start Date"
						bind:value={formData.start_date}
						error={errors.start_date}
					/>
					<DatePicker label="End Date" bind:value={formData.end_date} error={errors.end_date} />
					<Input
						label="Type ID (Optional)"
						placeholder="UUID"
						bind:value={formData.type_id}
						error={errors.type_id}
					/>
				</div>
			</section>

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

			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Parties & Attachments
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
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
					<Input
						label="Reminder Period (Days)"
						type="number"
						placeholder="30"
						bind:value={formData.reminder_period}
						error={errors.reminder_period}
					/>
				</div>

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
									Attached files ({uploadedAttachments.length})
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
				</div>
			</section>
		</div>
	{:else}
		<div class="rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text-muted">
			Contract details are not available yet.
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isLoading}>Cancel</Button>
			<Button
				variant="secondary"
				class="gap-2"
				onclick={handleSubmit}
				{isLoading}
				disabled={!formData}
			>
				<Plus class="h-4 w-4" />
				{isLoading ? 'Updating Contract...' : 'Update Contract'}
			</Button>
		</div>
	{/snippet}
</Modal>
