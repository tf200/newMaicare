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
	import { formatFormError } from '$lib/utils/form-errors';
	import { Trash2, Plus, Paperclip } from 'lucide-svelte';
	import { createContract } from '$lib/api/contracts';
	import { listClients } from '$lib/api/clients';
	import { listSenders } from '$lib/api/senders';
	import type { ListClientsResponse, SenderListItem, CreateContractRequest } from '$lib/types/api';
	import { ContractSchema, type ContractInput } from '$lib/schemas/contract';

	let { open = $bindable(false), onCreated } = $props<{
		open?: boolean;
		onCreated?: () => void;
	}>();

	let errorMessage = $state('');
	let uploadedAttachments = $state<Array<{ id: string; name: string }>>([]);
	let currentUploadFileId = $state<string | null>(null);
	let uploadKey = $state(0);
	const formId = 'create-contract-form';
	type TimeUnitOption = { value: CreateContractRequest['price_time_unit']; label: string };

	const { form, errors, enhance, delayed, reset } = superForm<ContractInput>(
		defaults(
			{
				attachment_ids: [],
				care_type: 'ambulante',
				price_time_unit: 'hourly',
				hours_type: 'weekly'
			} as unknown as ContractInput,
			valibotClient(ContractSchema)
		),
		{
			validators: valibotClient(ContractSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid) {
					try {
						const payload: CreateContractRequest = {
							...form.data,
							start_date: toRFC3339(form.data.start_date),
							end_date: toRFC3339(form.data.end_date),
							attachment_ids: uploadedAttachments.map((a) => a.id)
						};

						await createContract(payload);
						reset();
						uploadedAttachments = [];
						onCreated?.();
						open = false;
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : 'Failed to create contract';
					}
				}
			}
		}
	);

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

	const timeUnitOptions = $derived.by<TimeUnitOption[]>(() => {
		if ($form.care_type === 'ambulante') {
			return [
				{ value: 'minute', label: 'Minute' },
				{ value: 'hourly', label: 'Hourly' }
			];
		} else if ($form.care_type === 'accommodation') {
			return [
				{ value: 'daily', label: 'Daily' },
				{ value: 'weekly', label: 'Weekly' }
			];
		}
		return [];
	});

	// Reset dependent fields when care_type changes
	$effect(() => {
		if ($form.care_type === 'accommodation') {
			$form.hours = undefined;
			$form.hours_type = undefined;
		}
		// Reset price_time_unit if it's no longer valid
		const validUnits = timeUnitOptions.map((o) => o.value);
		if ($form.price_time_unit && !validUnits.includes($form.price_time_unit)) {
			if (validUnits.length > 0) {
				$form.price_time_unit = validUnits[0];
			}
		}
	});

	const toRFC3339 = (dateStr: string) => {
		if (!dateStr) return '';
		return `${dateStr}T00:00:00Z`;
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

	const handleCancel = () => {
		reset();
		uploadedAttachments = [];
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
	<form id={formId} use:enhance class="space-y-6">
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
					bind:value={$form.client_id}
					error={formatFormError($errors.client_id)}
					item={clientItem}
					labelFn={(client) => `${client.first_name} ${client.last_name}`}
					valueFn={(client) => client.id}
					placeholder="Search for a client..."
				/>
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
					bind:value={$form.care_name}
					error={formatFormError($errors.care_name)}
					required
				/>
				<Select
					label="Care Type"
					bind:value={$form.care_type}
					options={careTypeOptions}
					placeholder="Select care type..."
					error={formatFormError($errors.care_type)}
				/>
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
					bind:value={$form.reminder_period}
					error={formatFormError($errors.reminder_period)}
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
					<p class="ml-1 text-xs font-medium text-text-subtle">
						Upload directly. Each completed upload is added automatically to this contract.
					</p>
				</div>
			</div>
		</section>
		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>Cancel</Button>
			<Button variant="secondary" class="gap-2" form={formId} type="submit" isLoading={$delayed}>
				<Plus class="h-4 w-4" />
				{$delayed ? 'Creating Contract...' : 'Create Contract'}
			</Button>
		</div>
	{/snippet}
</Modal>
