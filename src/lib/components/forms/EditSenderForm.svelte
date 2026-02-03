<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import { getSenderById, updateSender } from '$lib/api/senders';
	import type { UpdateSenderRequest, SenderContact, GetSenderByIdResponse } from '$lib/types/api';
	import { onMount } from 'svelte';

	interface Props {
		open?: boolean;
		senderId: string | null;
		onUpdated?: () => void;
	}

	interface ContactForm {
		name: string;
		email: string;
		phoneNumber: string;
	}

	const typeOptions = [
		{ value: 'main_provider', label: 'Main provider' },
		{ value: 'local_authority', label: 'Local authority' },
		{ value: 'particular_party', label: 'Private individual' },
		{ value: 'healthcare_institution', label: 'Healthcare institution' }
	] as const;

	type SenderType = (typeof typeOptions)[number]['value'];

	let { open = $bindable(false), senderId, onUpdated }: Props = $props();

	let types = $state<SenderType>('main_provider');
	let name = $state('');
	let street = $state('');
	let houseNumber = $state('');
	let houseNumberAddition = $state('');
	let postalCode = $state('');
	let city = $state('');
	let land = $state('');
	let kvkNumber = $state('');
	let btwNumber = $state('');
	let phoneNumber = $state('');
	let clientNumber = $state('');
	let emailAddress = $state('');
	let isArchived = $state(false);
	let contacts = $state<ContactForm[]>([{ name: '', email: '', phoneNumber: '' }]);

	let errorMessage = $state('');
	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let isLoading = $state(false);
	let isFetching = $state(false);
	let fieldErrors = $state<{ name?: string; types?: string }>({});
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;

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

			name = sender.name;
			types = sender.types as SenderType;
			street = sender.street ?? '';
			houseNumber = sender.house_number ?? '';
			houseNumberAddition = sender.house_number_addition ?? '';
			postalCode = sender.postal_code ?? '';
			city = sender.city ?? '';
			land = sender.land ?? '';
			kvkNumber = sender.KVKnumber ?? '';
			btwNumber = sender.BTWnumber ?? '';
			phoneNumber = sender.phone_number ?? '';
			clientNumber = sender.client_number ?? '';
			emailAddress = sender.email_address ?? '';
			isArchived = sender.is_archived;

			if (sender.contacts && sender.contacts.length > 0) {
				contacts = sender.contacts.map((c: SenderContact) => ({
					name: c.name ?? '',
					email: c.email ?? '',
					phoneNumber: c.phone_number ?? ''
				}));
			} else {
				contacts = [{ name: '', email: '', phoneNumber: '' }];
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to fetch sender details.';
		} finally {
			isFetching = false;
		}
	}

	const toOptional = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	};

	const normalizePostalCode = (value: string) => value.replace(/\s+/g, '').toUpperCase().trim();

	const formatPostalCode = (value: string) => {
		const normalized = normalizePostalCode(value);
		if (normalized.length <= 4) return normalized;
		return `${normalized.slice(0, 4)} ${normalized.slice(4, 6)}`;
	};

	const isPostalCodeValid = (value: string) => /^\d{4}\s?[A-Za-z]{2}$/.test(value.trim());

	const toContactPayload = (contact: ContactForm): SenderContact | null => {
		const nameValue = toOptional(contact.name);
		const emailValue = toOptional(contact.email);
		const phoneValue = toOptional(contact.phoneNumber);
		if (!nameValue && !emailValue && !phoneValue) return null;
		return {
			name: nameValue,
			email: emailValue,
			phone_number: phoneValue
		};
	};

	const validate = () => {
		const nextErrors: { name?: string; types?: string } = {};
		if (!name.trim()) nextErrors.name = 'Sender name is required.';
		if (!types) nextErrors.types = 'Type is required.';
		fieldErrors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	};

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
			street = result.street;
			city = result.city;
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
		contacts = [...contacts, { name: '', email: '', phoneNumber: '' }];
	};

	const removeContact = (index: number) => {
		contacts = contacts.filter((_, idx) => idx !== index);
		if (contacts.length === 0) {
			contacts = [{ name: '', email: '', phoneNumber: '' }];
		}
	};

	async function handleSubmit() {
		if (!senderId) return;
		errorMessage = '';
		if (!validate()) return;
		isLoading = true;
		try {
			const payload: UpdateSenderRequest = {
				types,
				name: name.trim(),
				street: toOptional(street),
				house_number: toOptional(houseNumber),
				house_number_addition: toOptional(houseNumberAddition),
				postal_code: toOptional(formatPostalCode(postalCode)),
				city: toOptional(city),
				land: toOptional(land),
				KVKnumber: toOptional(kvkNumber),
				BTWnumber: toOptional(btwNumber),
				phone_number: toOptional(phoneNumber),
				client_number: toOptional(clientNumber),
				email_address: toOptional(emailAddress),
				is_archived: isArchived,
				contacts: contacts
					.map((contact) => toContactPayload(contact))
					.filter((contact): contact is SenderContact => Boolean(contact))
			};
			await updateSender(senderId, payload);
			open = false;
			onUpdated?.();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to update sender.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Modal
	bind:open
	title="Edit Sender"
	description="Update sender information and contact details."
	class="max-w-3xl"
>
	<div class="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
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
					bind:value={name}
					error={fieldErrors.name}
				/>
				<div class="space-y-2">
					<label for="sender-type" class="ml-1 text-sm font-semibold text-text-muted">
						Sender type
					</label>
					<select
						id="sender-type"
						bind:value={types}
						class="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-text outline-hidden transition-all focus:ring-2 focus:ring-brand/20"
					>
						{#each typeOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
					{#if fieldErrors.types}
						<p class="ml-1 text-xs font-medium text-error">{fieldErrors.types}</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input
					label="Postal code"
					placeholder="1234 AB"
					bind:value={postalCode}
					oninput={() => {
						scheduleLookup(postalCode, houseNumber);
					}}
					onblur={() => {
						postalCode = formatPostalCode(postalCode);
						scheduleLookup(postalCode, houseNumber);
					}}
				/>
				<Input
					label="House number"
					placeholder="10"
					bind:value={houseNumber}
					oninput={() => {
						scheduleLookup(postalCode, houseNumber);
					}}
				/>
				<Input label="Addition (optional)" placeholder="A" bind:value={houseNumberAddition} />
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input label="Street" placeholder="Main street" bind:value={street} />
				<Input label="City" placeholder="Amsterdam" bind:value={city} />
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
				<Input label="Country" placeholder="Netherlands" bind:value={land} />
				<Input label="Phone" placeholder="+31 20 123 4567" bind:value={phoneNumber} />
				<Input label="Client number" placeholder="REF-2024-01" bind:value={clientNumber} />
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input label="Email address" placeholder="info@sender.nl" bind:value={emailAddress} />
				<Input label="KVK number" placeholder="12345678" bind:value={kvkNumber} />
				<Input label="BTW number" placeholder="NL123456789B01" bind:value={btwNumber} />
			</div>

			<div class="flex items-center gap-3 py-2">
				<input
					type="checkbox"
					id="is-archived"
					bind:checked={isArchived}
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
					<Button variant="ghost" onclick={addContact}>Add contact</Button>
				</div>
				<div class="space-y-4">
					{#each contacts as contact, index (index)}
						<div class="rounded-2xl border border-border bg-surface/80 p-4">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
								<Input label="Contact name" placeholder="J. de Vries" bind:value={contact.name} />
								<Input
									label="Email"
									placeholder="contact@sender.nl"
									type="email"
									bind:value={contact.email}
								/>
								<Input
									label="Phone"
									placeholder="+31 6 123 456 78"
									bind:value={contact.phoneNumber}
								/>
							</div>
							<div class="mt-3 flex justify-end">
								<Button variant="ghost" onclick={() => removeContact(index)}>Remove</Button>
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
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleSubmit} isLoading={isLoading || isFetching} disabled={isFetching}>
				Save changes
			</Button>
		</div>
	{/snippet}
</Modal>
