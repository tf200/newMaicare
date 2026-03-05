<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import { createSender } from '$lib/api/senders';
	import { SenderSchema, type SenderSchemaInput } from '$lib/schemas/sender';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import type { CreateSenderRequest } from '$lib/types/api';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		open?: boolean;
		onCreated?: () => void;
	}

	const typeOptions = [
		{ value: 'main_provider', label: m.main_provider() },
		{ value: 'local_authority', label: m.local_authority() },
		{ value: 'particular_party', label: m.private_individual() },
		{ value: 'healthcare_institution', label: m.healthcare_institution() }
	] as const;

	let { open = $bindable(false), onCreated }: Props = $props();

	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let errorMessage = $state('');
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;
	const formId = 'create-sender-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				types: 'main_provider',
				contacts: [{ name: '', email: '', phone_number: '' }]
			} as unknown as SenderSchemaInput,
			valibotClient(SenderSchema)
		),
		{
			validators: valibotClient(SenderSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid) {
					try {
						const postalCode = trimToUndefined(form.data.postal_code);
						const contacts: CreateSenderRequest['contacts'] = form.data.contacts
							.map((contact) => ({
								name: trimToUndefined(contact.name),
								email: trimToUndefined(contact.email),
								phone_number: trimToUndefined(contact.phone_number)
							}))
							.filter((contact) => contact.name || contact.email || contact.phone_number);

						const payload: CreateSenderRequest = {
							types: form.data.types,
							name: form.data.name.trim(),
							street: trimToUndefined(form.data.street),
							house_number: trimToUndefined(form.data.house_number),
							house_number_addition: trimToUndefined(form.data.house_number_addition),
							postal_code: postalCode ? formatPostalCode(postalCode) : undefined,
							city: trimToUndefined(form.data.city),
							land: trimToUndefined(form.data.land),
							KVKnumber: trimToUndefined(form.data.KVKnumber),
							BTWnumber: trimToUndefined(form.data.BTWnumber),
							phone_number: trimToUndefined(form.data.phone_number),
							client_number: trimToUndefined(form.data.client_number),
							contacts
						};

						await createSender(payload);
						reset();
						open = false;
						onCreated?.();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : m.failed_create_sender();
					}
				}
			}
		}
	);

	const normalizePostalCode = (value: string) => value.replace(/\s+/g, '').toUpperCase().trim();

	const formatPostalCode = (value: string) => {
		const normalized = normalizePostalCode(value);
		if (normalized.length <= 4) return normalized;
		return `${normalized.slice(0, 4)} ${normalized.slice(4, 6)}`;
	};

	const isPostalCodeValid = (value: string) => /^\d{4}\s?[A-Za-z]{2}$/.test(value.trim());

	const handleCancel = () => {
		reset();
		open = false;
	};

	const runLookup = async (postcodeValue: string, numberValue: string) => {
		if (!isPostalCodeValid(postcodeValue)) return;
		isLookupLoading = true;
		lookupMessage = '';
		try {
			const result = await lookupAddressByPostcode(postcodeValue, numberValue);
			if (!result) {
				lookupMessage = m.address_not_found_manual();
				return;
			}
			$form.street = result.street;
			$form.city = result.city;
		} catch (error) {
			lookupMessage = error instanceof Error ? error.message : m.address_lookup_failed();
		} finally {
			isLookupLoading = false;
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

	const addContact = () => {
		$form.contacts = [...$form.contacts, { name: '', email: '', phone_number: '' }];
	};

	const removeContact = (index: number) => {
		$form.contacts = $form.contacts.filter((_, idx) => idx !== index);
		if ($form.contacts.length === 0) {
			$form.contacts = [{ name: '', email: '', phone_number: '' }];
		}
	};
</script>

<Modal
	bind:open
	title={m.create_sender()}
	description={m.create_sender_description()}
	class="max-w-3xl"
>
	<form id={formId} use:enhance class="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				label={m.sender_name()}
				placeholder={m.placeholder_sender_organization()}
				bind:value={$form.name}
				error={formatFormError($errors.name)}
			/>
			<div class="space-y-2">
				<label for="sender-type" class="ml-1 text-sm font-semibold text-text-muted">
					{m.sender_type()}
				</label>
				<select
					id="sender-type"
					bind:value={$form.types}
					class="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-text outline-hidden transition-all focus:ring-2 focus:ring-brand/20"
				>
					{#each typeOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
				{#if $errors.types}
					<p class="ml-1 text-xs font-medium text-error">{formatFormError($errors.types)}</p>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
			<Input
				label={m.postal_code()}
				placeholder={m.example_postal_code()}
				bind:value={$form.postal_code}
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
				error={formatFormError($errors.postal_code)}
			/>
			<Input
				label={m.house_number()}
				placeholder={m.example_house_number()}
				bind:value={$form.house_number}
				oninput={() => {
					if ($form.postal_code && $form.house_number) {
						scheduleLookup($form.postal_code, $form.house_number);
					}
				}}
				error={formatFormError($errors.house_number)}
			/>
			<Input
				label={m.addition_optional()}
				placeholder={m.example_house_number_addition()}
				bind:value={$form.house_number_addition}
			/>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				label={m.street()}
				placeholder={m.example_street_name()}
				bind:value={$form.street}
				error={formatFormError($errors.street)}
			/>
			<Input
				label={m.city()}
				placeholder={m.example_city_name()}
				bind:value={$form.city}
				error={formatFormError($errors.city)}
			/>
		</div>

		{#if isLookupLoading}
			<div class="text-xs font-medium text-text-muted">{m.looking_up_address()}</div>
		{/if}
		{#if lookupMessage}
			<div class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
				{lookupMessage}
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
			<Input label={m.country()} placeholder={m.example_country()} bind:value={$form.land} />
			<Input
				label={m.phone_number()}
				placeholder={m.example_phone_nl()}
				bind:value={$form.phone_number}
			/>
			<Input
				label={m.client_number()}
				placeholder={m.placeholder_client_number()}
				bind:value={$form.client_number}
			/>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				label={m.kvk_number()}
				placeholder={m.placeholder_kvk_number()}
				bind:value={$form.KVKnumber}
			/>
			<Input
				label={m.btw_number()}
				placeholder={m.placeholder_btw_number()}
				bind:value={$form.BTWnumber}
			/>
		</div>

		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-semibold text-text">{m.contacts()}</h3>
					<p class="text-xs text-text-muted">{m.contacts_hint()}</p>
				</div>
				<Button variant="ghost" onclick={addContact} type="button">{m.add_contact()}</Button>
			</div>
			<div class="space-y-4">
				{#each $form.contacts as contact, index (index)}
					<div class="rounded-2xl border border-border bg-surface/80 p-4">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<Input
								label={m.contact_name()}
								placeholder={m.placeholder_contact_name()}
								bind:value={contact.name}
							/>
							<Input
								label={m.email_address()}
								placeholder={m.placeholder_contact_email()}
								type="email"
								bind:value={contact.email}
								error={formatFormError($errors.contacts?.[index]?.email)}
							/>
							<Input
								label={m.phone_number()}
								placeholder={m.example_phone_nl()}
								bind:value={contact.phone_number}
							/>
						</div>
						<div class="mt-3 flex justify-end">
							<Button variant="ghost" onclick={() => removeContact(index)} type="button"
								>{m.remove()}</Button
							>
						</div>
					</div>
				{/each}
			</div>
		</div>

		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}

		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>{m.cancel()}</Button>
			<Button form={formId} type="submit" isLoading={$delayed}>{m.create_sender()}</Button>
		</div>
	{/snippet}
</Modal>
