<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { onDestroy } from 'svelte';
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

	const typeOptions = $derived([
		{ value: 'main_provider', label: m.main_provider() },
		{ value: 'local_authority', label: m.local_authority() },
		{ value: 'particular_party', label: m.private_individual() },
		{ value: 'healthcare_institution', label: m.healthcare_institution() }
	] as const);

	let { open = $bindable(false), onCreated }: Props = $props();

	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let errorMessage = $state('');
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;
	let lookupSequence = 0;
	const formId = 'create-sender-form';

	const { form, errors, enhance, submitting, reset } = superForm(
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
					errorMessage = '';
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
						clearTransientState();
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
		clearTransientState();
		open = false;
	};

	const clearTransientState = () => {
		if (lookupTimer) {
			clearTimeout(lookupTimer);
			lookupTimer = null;
		}
		lookupSequence += 1;
		lookupMessage = '';
		isLookupLoading = false;
		errorMessage = '';
		reset();
	};

	onDestroy(() => {
		if (lookupTimer) clearTimeout(lookupTimer);
		lookupSequence += 1;
	});

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
		if (lookupTimer) clearTimeout(lookupTimer);
		lookupTimer = null;
		lookupSequence += 1;
		isLookupLoading = false;
		if (!postcodeValue.trim() || !numberValue.trim()) return;
		lookupTimer = setTimeout(() => {
			lookupTimer = null;
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
	closeLabel={m.close()}
	dismissible={!$submitting}
	onClose={clearTransientState}
>
	<form id={formId} use:enhance class="space-y-6">
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				id="create-sender-name"
				label={m.sender_name()}
				placeholder={m.placeholder_sender_organization()}
				autocomplete="organization"
				required
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
					aria-invalid={$errors.types ? 'true' : undefined}
					aria-describedby={$errors.types ? 'sender-type-error' : undefined}
					class="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-text outline-hidden transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/20"
				>
					{#each typeOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
				{#if $errors.types}
					<p id="sender-type-error" class="ml-1 text-xs font-medium text-error">
						{formatFormError($errors.types)}
					</p>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
			<Input
				id="create-sender-postal-code"
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
				autocomplete="postal-code"
			/>
			<Input
				id="create-sender-house-number"
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
				id="create-sender-house-number-addition"
				label={m.addition_optional()}
				placeholder={m.example_house_number_addition()}
				bind:value={$form.house_number_addition}
				error={formatFormError($errors.house_number_addition)}
			/>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				id="create-sender-street"
				label={m.street()}
				placeholder={m.example_street_name()}
				bind:value={$form.street}
				error={formatFormError($errors.street)}
				autocomplete="street-address"
			/>
			<Input
				id="create-sender-city"
				label={m.city()}
				placeholder={m.example_city_name()}
				bind:value={$form.city}
				error={formatFormError($errors.city)}
				autocomplete="address-level2"
			/>
		</div>

		{#if isLookupLoading}
			<div class="text-xs font-medium text-text-muted" role="status" aria-live="polite">
				{m.looking_up_address()}
			</div>
		{/if}
		{#if lookupMessage}
			<div
				class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
				role="status"
				aria-live="polite"
			>
				{lookupMessage}
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
			<Input
				id="create-sender-country"
				label={m.country()}
				placeholder={m.example_country()}
				bind:value={$form.land}
				error={formatFormError($errors.land)}
				autocomplete="country-name"
			/>
			<Input
				id="create-sender-phone"
				label={m.phone_number()}
				placeholder={m.example_phone_nl()}
				bind:value={$form.phone_number}
				error={formatFormError($errors.phone_number)}
				type="tel"
				autocomplete="tel"
			/>
			<Input
				id="create-sender-client-number"
				label={m.client_number()}
				placeholder={m.placeholder_client_number()}
				bind:value={$form.client_number}
				error={formatFormError($errors.client_number)}
			/>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				id="create-sender-kvk"
				label={m.kvk_number()}
				placeholder={m.placeholder_kvk_number()}
				bind:value={$form.KVKnumber}
				error={formatFormError($errors.KVKnumber)}
			/>
			<Input
				id="create-sender-btw"
				label={m.btw_number()}
				placeholder={m.placeholder_btw_number()}
				bind:value={$form.BTWnumber}
				error={formatFormError($errors.BTWnumber)}
			/>
		</div>

		<div class="space-y-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0">
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
								id={`create-sender-contact-${index}-name`}
								label={m.contact_name()}
								placeholder={m.placeholder_contact_name()}
								bind:value={contact.name}
								error={formatFormError($errors.contacts?.[index]?.name)}
								autocomplete="name"
							/>
							<Input
								id={`create-sender-contact-${index}-email`}
								label={m.email_address()}
								placeholder={m.placeholder_contact_email()}
								type="email"
								bind:value={contact.email}
								error={formatFormError($errors.contacts?.[index]?.email)}
								autocomplete="email"
							/>
							<Input
								id={`create-sender-contact-${index}-phone`}
								label={m.phone_number()}
								placeholder={m.example_phone_nl()}
								bind:value={contact.phone_number}
								error={formatFormError($errors.contacts?.[index]?.phone_number)}
								type="tel"
								autocomplete="tel"
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
			<div
				class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
				role="alert"
			>
				{errorMessage}
			</div>
		{/if}
	</form>

	{#snippet footer()}
		<div class="flex flex-wrap justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$submitting}>{m.cancel()}</Button>
			<Button form={formId} type="submit" isLoading={$submitting} disabled={$submitting}>
				{m.create_sender()}
			</Button>
		</div>
	{/snippet}
</Modal>
