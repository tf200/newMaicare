<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import { getSenderById, updateSender } from '$lib/api/senders';
	import { SenderSchema, type SenderSchemaInput } from '$lib/schemas/sender';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import type { UpdateSenderRequest } from '$lib/types/api';

	interface Props {
		open?: boolean;
		senderId: string | null;
		onUpdated?: () => void;
	}

	const typeOptions = [
		{ value: 'main_provider', label: 'Main provider' },
		{ value: 'local_authority', label: 'Local authority' },
		{ value: 'particular_party', label: 'Private individual' },
		{ value: 'healthcare_institution', label: 'Healthcare institution' }
	] as const;

	type SenderType = (typeof typeOptions)[number]['value'];
	const isSenderType = (value: string): value is SenderType =>
		typeOptions.some((option) => option.value === value);

	let { open = $bindable(false), senderId, onUpdated }: Props = $props();

	let isFetching = $state(false);
	let errorMessage = $state('');
	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;
	const formId = 'edit-sender-form';

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
				if (form.valid && senderId) {
					try {
						const postalCode = trimToUndefined(form.data.postal_code);
						const payload: UpdateSenderRequest = {
							name: form.data.name.trim(),
							types: form.data.types,
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
							email_address: trimToUndefined(form.data.email_address),
							is_archived: form.data.is_archived,
							contacts: form.data.contacts.map((c) => ({
								name: trimToUndefined(c.name),
								email: trimToUndefined(c.email),
								phone_number: trimToUndefined(c.phone_number)
							}))
						};
						await updateSender(senderId, payload);
						open = false;
						onUpdated?.();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : 'Failed to update sender.';
					}
				}
			}
		}
	);

	$effect(() => {
		if (open && senderId) {
			void fetchSender(senderId);
		}
	});

	async function fetchSender(id: string) {
		isFetching = true;
		errorMessage = '';
		try {
			const response = await getSenderById(id);
			const sender = response.data;

			// Map API response to our schema input
			const initialData: SenderSchemaInput = {
				name: sender.name,
				types: isSenderType(sender.types) ? sender.types : 'main_provider',
				street: sender.street ?? undefined,
				house_number: sender.house_number ?? undefined,
				house_number_addition: sender.house_number_addition ?? undefined,
				postal_code: sender.postal_code ?? undefined,
				city: sender.city ?? undefined,
				land: sender.land ?? undefined,
				KVKnumber: sender.KVKnumber ?? undefined,
				BTWnumber: sender.BTWnumber ?? undefined,
				phone_number: sender.phone_number ?? undefined,
				client_number: sender.client_number ?? undefined,
				email_address: sender.email_address ?? undefined,
				is_archived: sender.is_archived,
				contacts:
					sender.contacts && sender.contacts.length > 0
						? sender.contacts.map((c) => ({
								name: c.name ?? '',
								email: c.email ?? '',
								phone_number: c.phone_number ?? ''
							}))
						: [{ name: '', email: '', phone_number: '' }]
			};

			reset({ data: initialData });
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to fetch sender details.';
		} finally {
			isFetching = false;
		}
	}

	const normalizePostalCode = (value: string) => value.replace(/\s+/g, '').toUpperCase().trim();

	const formatPostalCode = (value: string) => {
		const normalized = normalizePostalCode(value);
		if (normalized.length <= 4) return normalized;
		return `${normalized.slice(0, 4)} ${normalized.slice(4, 6)}`;
	};

	const isPostalCodeValid = (value: string) => /^\d{4}\s?[A-Za-z]{2}$/.test(value.trim());

	const handleCancel = () => {
		open = false;
	};

	const runLookup = async (postcodeValue: string, numberValue: string) => {
		if (!isPostalCodeValid(postcodeValue)) return;
		isLookupLoading = true;
		lookupMessage = '';
		try {
			const result = await lookupAddressByPostcode(postcodeValue, numberValue);
			if (!result) {
				lookupMessage = 'Address not found. Please fill street and city manually.';
				return;
			}
			$form.street = result.street;
			$form.city = result.city;
		} catch (error) {
			lookupMessage = error instanceof Error ? error.message : 'Unable to fetch address from PDOK.';
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
	title="Edit Sender"
	description="Update sender information and contact details."
	class="max-w-3xl"
>
	<form id={formId} use:enhance class="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
		{#if isFetching}
			<div class="flex h-40 items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent"
				></div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Sender name"
					placeholder="Sender organization"
					bind:value={$form.name}
					error={formatFormError($errors.name)}
				/>
				<div class="space-y-2">
					<label for="sender-type" class="ml-1 text-sm font-semibold text-text-muted">
						Sender type
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
					label="Postal code"
					placeholder="1234 AB"
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
					label="House number"
					placeholder="10"
					bind:value={$form.house_number}
					oninput={() => {
						if ($form.postal_code && $form.house_number) {
							scheduleLookup($form.postal_code, $form.house_number);
						}
					}}
					error={formatFormError($errors.house_number)}
				/>
				<Input
					label="Addition (optional)"
					placeholder="A"
					bind:value={$form.house_number_addition}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Street"
					placeholder="Main street"
					bind:value={$form.street}
					error={formatFormError($errors.street)}
				/>
				<Input
					label="City"
					placeholder="Amsterdam"
					bind:value={$form.city}
					error={formatFormError($errors.city)}
				/>
			</div>

			{#if isLookupLoading}
				<div class="text-xs font-medium text-text-muted">Looking up address via PDOK...</div>
			{/if}
			{#if lookupMessage}
				<div
					class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
				>
					{lookupMessage}
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input label="Country" placeholder="Netherlands" bind:value={$form.land} />
				<Input label="Phone" placeholder="+31 20 123 4567" bind:value={$form.phone_number} />
				<Input label="Client number" placeholder="REF-2024-01" bind:value={$form.client_number} />
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input
					label="Email address"
					placeholder="info@sender.nl"
					bind:value={$form.email_address}
					error={formatFormError($errors.email_address)}
				/>
				<Input label="KVK number" placeholder="12345678" bind:value={$form.KVKnumber} />
				<Input label="BTW number" placeholder="NL123456789B01" bind:value={$form.BTWnumber} />
			</div>

			<div class="flex items-center gap-3 py-2">
				<input
					type="checkbox"
					id="is-archived"
					bind:checked={$form.is_archived}
					class="h-5 w-5 rounded border-border text-brand focus:ring-brand/20"
				/>
				<label for="is-archived" class="text-sm font-medium text-text"> Archive this sender </label>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-semibold text-text">Contacts</h3>
						<p class="text-xs text-text-muted">Add at least one contact if available.</p>
					</div>
					<Button variant="ghost" onclick={addContact} type="button">Add contact</Button>
				</div>
				<div class="space-y-4">
					{#each $form.contacts as contact, index (index)}
						<div class="rounded-2xl border border-border bg-surface/80 p-4">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
								<Input label="Contact name" placeholder="J. de Vries" bind:value={contact.name} />
								<Input
									label="Email"
									placeholder="contact@sender.nl"
									type="email"
									bind:value={contact.email}
									error={formatFormError($errors.contacts?.[index]?.email)}
								/>
								<Input
									label="Phone"
									placeholder="+31 6 123 456 78"
									bind:value={contact.phone_number}
								/>
							</div>
							<div class="mt-3 flex justify-end">
								<Button variant="ghost" onclick={() => removeContact(index)} type="button"
									>Remove</Button
								>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}

		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isFetching || $delayed}
				>Cancel</Button
			>
			<Button form={formId} type="submit" isLoading={$delayed} disabled={isFetching}>
				Save changes
			</Button>
		</div>
	{/snippet}
</Modal>
