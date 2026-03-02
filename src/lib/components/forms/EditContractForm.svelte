<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
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
	import { ContractSchema, type ContractSchemaInput } from '$lib/schemas/contract';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';

	interface EditableContractData {
		id: string;
		clientId: string;
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

	let errorMessage = $state('');
	let uploadedAttachments = $state<Array<{ id: string; name: string }>>([]);
	let currentUploadFileId = $state<string | null>(null);
	let uploadKey = $state(0);
	let initializedContractId = $state<string | null>(null);
	const formId = 'edit-contract-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				attachment_ids: [],
				care_type: 'ambulante',
				price_time_unit: 'hourly',
				hours_type: 'weekly'
			} as unknown as ContractSchemaInput,
			valibotClient(ContractSchema)
		),
		{
			validators: valibotClient(ContractSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && contract) {
					try {
						const typeId = trimToUndefined(form.data.type_id);
						const hours =
							form.data.care_type === 'ambulante'
								? typeof form.data.hours === 'number'
									? form.data.hours
									: Number.parseFloat(String(form.data.hours ?? ''))
								: null;

						const payload: UpdateContractRequest = {
							sender_id: form.data.sender_id,
							care_name: form.data.care_name.trim(),
							price:
								typeof form.data.price === 'number'
									? form.data.price
									: Number.parseFloat(String(form.data.price)),
							price_time_unit: form.data.price_time_unit,
							financing_act: form.data.financing_act,
							financing_option: form.data.financing_option,
							start_date: toRFC3339(form.data.start_date),
							end_date: toRFC3339(form.data.end_date),
							type_id: typeId,
							reminder_period:
								typeof form.data.reminder_period === 'number'
									? form.data.reminder_period
									: form.data.reminder_period
										? Number.parseInt(String(form.data.reminder_period), 10)
										: undefined,
							VAT:
								typeof form.data.VAT === 'number'
									? form.data.VAT
									: form.data.VAT
										? Number.parseFloat(String(form.data.VAT))
										: undefined,
							hours: form.data.care_type === 'ambulante' && Number.isFinite(hours) ? hours : null,
							hours_type:
								form.data.care_type === 'ambulante' ? (form.data.hours_type ?? null) : null,
							attachment_ids: uploadedAttachments.map((attachment) => attachment.id)
						};

						await updateContract(contract.id, payload);
						open = false;
						initializedContractId = null;
						onUpdated?.();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : 'Failed to update contract';
					}
				}
			}
		}
	);

	const toDateInput = (value: string) => {
		if (!value) return '';
		return value.split('T')[0] ?? '';
	};

	$effect(() => {
		if (!open || !contract) return;
		if (initializedContractId === contract.id) return;

		const initialData: ContractSchemaInput = {
			client_id: contract.clientId || '',
			sender_id: contract.sender.id,
			care_name: contract.careName,
			care_type: contract.careType,
			start_date: toDateInput(contract.startDate),
			end_date: toDateInput(contract.endDate),
			price: contract.price,
			price_time_unit: contract.priceTimeUnit,
			hours: contract.hours ?? undefined,
			hours_type: contract.hoursType ?? undefined,
			financing_act: contract.financingAct,
			financing_option: contract.financingOption,
			type_id: contract.typeId ?? undefined,
			reminder_period: contract.reminderPeriod,
			VAT: contract.vat ?? undefined,
			attachment_ids: contract.attachments.map(
				(attachment: { id: string; name: string }) => attachment.id
			)
		};

		reset({ data: initialData });
		uploadedAttachments = contract.attachments.map((attachment: { id: string; name: string }) => ({
			id: attachment.id,
			name: attachment.name
		}));
		errorMessage = '';
		currentUploadFileId = null;
		uploadKey = 0;
		initializedContractId = contract.id;
	});

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
		if ($form.care_type === 'ambulante') {
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
		initializedContractId = null;
		open = false;
	};

	const loadSenders = async (query: string) => {
		const res = await listSenders({ search: query, page: 1, pageSize: 50 });
		return res.data.results;
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
	{#if contract}
		<form id={formId} use:enhance class="space-y-6">
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
						bind:value={$form.care_name}
						error={formatFormError($errors.care_name)}
						required
					/>
					<div class="space-y-2">
						<p class="ml-1 text-sm font-semibold text-text-muted">Care Type</p>
						<div
							class="rounded-xl border border-border bg-bg px-4 py-3.5 text-sm font-semibold text-text capitalize"
						>
							{$form.care_type}
						</div>
					</div>
					<DatePicker
						label="Start Date"
						bind:value={$form.start_date}
						error={formatFormError($errors.start_date)}
					/>
					<DatePicker
						label="End Date"
						bind:value={$form.end_date}
						error={formatFormError($errors.end_date)}
					/>
					<Input
						label="Type ID (Optional)"
						placeholder="UUID"
						bind:value={$form.type_id}
						error={formatFormError($errors.type_id)}
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
						bind:value={$form.price}
						error={formatFormError($errors.price)}
						required
					/>
					<Select
						label="Time Unit"
						bind:value={$form.price_time_unit}
						options={timeUnitOptions}
						placeholder="Select unit..."
						error={formatFormError($errors.price_time_unit)}
					/>
					<Input
						label="VAT % (Optional)"
						type="number"
						placeholder="21"
						bind:value={$form.VAT}
						error={formatFormError($errors.VAT)}
					/>
				</div>

				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					{#if $form.care_type === 'ambulante'}
						<Input
							label="Hours"
							type="number"
							placeholder="40"
							bind:value={$form.hours}
							error={formatFormError($errors.hours)}
							required
						/>
						<Select
							label="Hours Type"
							bind:value={$form.hours_type}
							options={hoursTypeOptions}
							placeholder="Select hours type..."
							error={formatFormError($errors.hours_type)}
						/>
					{/if}
					<Select
						label="Financing Act"
						bind:value={$form.financing_act}
						options={financingActOptions}
						placeholder="Select act..."
						error={formatFormError($errors.financing_act)}
					/>
					<Select
						label="Financing Option"
						bind:value={$form.financing_option}
						options={financingOptionOptions}
						placeholder="Select option..."
						error={formatFormError($errors.financing_option)}
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
						bind:value={$form.sender_id}
						error={formatFormError($errors.sender_id)}
						item={senderItem}
						labelFn={(sender) => sender.name}
						valueFn={(sender) => sender.id}
						placeholder="Search for a sender..."
					/>
					<Input
						label="Reminder Period (Days)"
						type="number"
						placeholder="30"
						bind:value={$form.reminder_period}
						error={formatFormError($errors.reminder_period)}
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
												type="button"
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
			<button type="submit" class="hidden" aria-hidden="true"></button>
		</form>
	{:else}
		<div class="rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text-muted">
			Contract details are not available yet.
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>Cancel</Button>
			<Button
				variant="secondary"
				class="gap-2"
				form={formId}
				type="submit"
				isLoading={$delayed}
				disabled={!contract}
			>
				<Plus class="h-4 w-4" />
				{$delayed ? 'Updating Contract...' : 'Update Contract'}
			</Button>
		</div>
	{/snippet}
</Modal>
