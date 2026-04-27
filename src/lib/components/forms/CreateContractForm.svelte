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
	import { m } from '$lib/paraglide/messages';

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
				hours_type: 'weekly',
				financing_act: '',
				financing_option: ''
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
						errorMessage = error instanceof Error ? error.message : m.failed_create_contract();
					}
				}
			}
		}
	);

	// Options
	const careTypeOptions = [
		{ value: 'ambulante', label: m.ambulante() },
		{ value: 'accommodation', label: m.accommodation() }
	];

	const financingActOptions = [
		{ value: 'WMO', label: m.wmo() },
		{ value: 'ZVW', label: m.zvw() },
		{ value: 'WLZ', label: m.wlz() },
		{ value: 'JW', label: m.jw() },
		{ value: 'WPG', label: m.wpg() }
	];

	const financingOptionOptions = [
		{ value: 'ZIN', label: m.zin() },
		{ value: 'PGB', label: m.pgb() }
	];

	const hoursTypeOptions = [
		{ value: 'weekly', label: m.weekly() },
		{ value: 'all_period', label: m.all_period() }
	];

	const timeUnitOptions = $derived.by<TimeUnitOption[]>(() => {
		if ($form.care_type === 'ambulante') {
			return [
				{ value: 'minute', label: m.minute() },
				{ value: 'hourly', label: m.hourly() }
			];
		} else if ($form.care_type === 'accommodation') {
			return [
				{ value: 'daily', label: m.daily() },
				{ value: 'weekly', label: m.weekly() }
			];
		}
		return [];
	});

	// Reset dependent fields when care_type changes
	$effect(() => {
		if ($form.care_type === 'accommodation') {
			$form.hours = undefined;
			$form.hours_type = undefined;
		} else if (!$form.hours_type) {
			$form.hours_type = 'weekly';
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
			{ id: fileId, name: m.attachment_number({ number: uploadedAttachments.length + 1 }) }
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
			<span>{m.bsn()}: {option.bsn}</span>
			<span class="h-1 w-1 rounded-full bg-border"></span>
			<span>{m.file_number_label()}: {option.filenumber}</span>
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
	title={m.create_new_contract()}
	description={m.create_new_contract_description()}
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
				{m.parties()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<SearchSelect
					label={m.client()}
					loadOptions={loadClients}
					bind:value={$form.client_id}
					error={formatFormError($errors.client_id)}
					item={clientItem}
					labelFn={(client) => `${client.first_name} ${client.last_name}`}
					valueFn={(client) => client.id}
					placeholder={m.search_client_placeholder()}
				/>
				<SearchSelect
					label={m.sender()}
					loadOptions={loadSenders}
					bind:value={$form.sender_id}
					error={formatFormError($errors.sender_id)}
					item={senderItem}
					labelFn={(sender) => sender.name}
					valueFn={(sender) => sender.id}
					placeholder={m.search_sender_placeholder()}
				/>
			</div>
		</section>

		<!-- Section: Care & Terms -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.care_terms()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label={m.care_name()}
					placeholder={m.placeholder_care_name()}
					bind:value={$form.care_name}
					error={formatFormError($errors.care_name)}
					required
				/>
				<Select
					label={m.care_type()}
					bind:value={$form.care_type}
					options={careTypeOptions}
					placeholder={m.select_care_type()}
					error={formatFormError($errors.care_type)}
				/>
				<DatePicker
					label={m.start_date()}
					bind:value={$form.start_date}
					error={formatFormError($errors.start_date)}
				/>
				<DatePicker
					label={m.end_date()}
					bind:value={$form.end_date}
					error={formatFormError($errors.end_date)}
				/>
				<Input
					label={m.type_id_optional()}
					placeholder={m.placeholder_uuid()}
					bind:value={$form.type_id}
					error={formatFormError($errors.type_id)}
				/>
			</div>
		</section>

		<!-- Section: Financials -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.financials()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
				<Input
					label={m.price()}
					type="number"
					placeholder={m.placeholder_amount_zero()}
					bind:value={$form.price}
					error={formatFormError($errors.price)}
					required
				/>
				<Select
					label={m.time_unit()}
					bind:value={$form.price_time_unit}
					options={timeUnitOptions}
					placeholder={m.select_unit()}
					error={formatFormError($errors.price_time_unit)}
				/>
				<Input
					label={m.vat_percent_optional()}
					type="number"
					placeholder={m.placeholder_vat_percent()}
					bind:value={$form.VAT}
					error={formatFormError($errors.VAT)}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				{#if $form.care_type === 'ambulante'}
					<Input
						label={m.hours()}
						type="number"
						placeholder={m.placeholder_hours()}
						bind:value={$form.hours}
						error={formatFormError($errors.hours)}
						required
					/>
					<Select
						label={m.hours_type()}
						bind:value={$form.hours_type}
						options={hoursTypeOptions}
						placeholder={m.select_hours_type()}
						error={formatFormError($errors.hours_type)}
					/>
				{/if}
				<Select
					label={m.financing_act()}
					bind:value={$form.financing_act}
					options={financingActOptions}
					placeholder={m.select_financing_act()}
					error={formatFormError($errors.financing_act)}
				/>
				<Select
					label={m.financing_option()}
					bind:value={$form.financing_option}
					options={financingOptionOptions}
					placeholder={m.select_financing_option()}
					error={formatFormError($errors.financing_option)}
				/>
			</div>
		</section>

		<!-- Section: Optional Settings -->
		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.optional_settings()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label={m.reminder_period_days()}
					type="number"
					placeholder={m.placeholder_reminder_days()}
					bind:value={$form.reminder_period}
					error={formatFormError($errors.reminder_period)}
				/>
				<div class="space-y-3">
					<div class="ml-1 text-sm font-semibold text-text-muted">{m.attachments()}</div>
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
									{m.uploaded_files_count({ count: uploadedAttachments.length })}
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
												title={m.remove_attachment()}
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
						{m.contract_attachment_upload_hint()}
					</p>
				</div>
			</div>
		</section>
		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>{m.cancel()}</Button>
			<Button variant="secondary" class="gap-2" form={formId} type="submit" isLoading={$delayed}>
				<Plus class="h-4 w-4" />
				{$delayed ? m.creating_contract() : m.create_contract()}
			</Button>
		</div>
	{/snippet}
</Modal>
