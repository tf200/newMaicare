<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { createOrganization } from '$lib/api/organizations';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import type { CreateOrganizationRequest } from '$lib/types/api';

	interface Props {
		open?: boolean;
		onCreated?: () => void;
	}

	let { open = $bindable(false), onCreated }: Props = $props();

	let name = $state('');
	let street = $state('');
	let houseNumber = $state('');
	let houseNumberAddition = $state('');
	let postalCode = $state('');
	let city = $state('');
	let email = $state('');
	let kvkNumber = $state('');
	let btwNumber = $state('');
	let errorMessage = $state('');
	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let isLoading = $state(false);
	let fieldErrors = $state<{
		name?: string;
		street?: string;
		houseNumber?: string;
		postalCode?: string;
		city?: string;
	}>({});
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;

	const resetForm = () => {
		name = '';
		street = '';
		houseNumber = '';
		houseNumberAddition = '';
		postalCode = '';
		city = '';
		email = '';
		kvkNumber = '';
		btwNumber = '';
		errorMessage = '';
		lookupMessage = '';
		fieldErrors = {};
	};

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

	const validate = () => {
		const nextErrors: {
			name?: string;
			street?: string;
			houseNumber?: string;
			postalCode?: string;
			city?: string;
		} = {};
		if (!name.trim()) nextErrors.name = 'Name is required.';
		if (!street.trim()) nextErrors.street = 'Street is required.';
		if (!houseNumber.trim()) nextErrors.houseNumber = 'House number is required.';
		if (!postalCode.trim()) nextErrors.postalCode = 'Postal code is required.';
		if (!city.trim()) nextErrors.city = 'City is required.';
		fieldErrors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	};

	const handleCancel = () => {
		resetForm();
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

	async function handleSubmit() {
		errorMessage = '';
		if (!validate()) return;
		isLoading = true;
		try {
			const payload: CreateOrganizationRequest = {
				name: name.trim(),
				street: street.trim(),
				house_number: houseNumber.trim(),
				house_number_addition: toOptional(houseNumberAddition),
				postal_code: formatPostalCode(postalCode).trim(),
				city: city.trim(),
				email: toOptional(email),
				kvk_number: toOptional(kvkNumber),
				btw_number: toOptional(btwNumber)
			};
			await createOrganization(payload);
			resetForm();
			open = false;
			onCreated?.();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to create organization.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Modal
	bind:open
	title="Create Organization"
	description="Add a new organization to manage its settings and members."
>
	<div class="space-y-5">
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				label="Organization Name"
				placeholder="Acme Corp"
				bind:value={name}
				error={fieldErrors.name}
			/>
			<Input
				label="Email (optional)"
				placeholder="contact@acme.com"
				type="email"
				bind:value={email}
			/>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
			<Input
				label="Postal Code"
				placeholder="1234 AB"
				bind:value={postalCode}
				error={fieldErrors.postalCode}
				oninput={() => {
					scheduleLookup(postalCode, houseNumber);
				}}
				onblur={() => {
					postalCode = formatPostalCode(postalCode);
					scheduleLookup(postalCode, houseNumber);
				}}
			/>
			<Input
				label="House Number"
				placeholder="10"
				bind:value={houseNumber}
				error={fieldErrors.houseNumber}
				oninput={() => {
					scheduleLookup(postalCode, houseNumber);
				}}
			/>
			<Input label="Addition (optional)" placeholder="A" bind:value={houseNumberAddition} />
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				label="Street"
				placeholder="Main Street"
				bind:value={street}
				error={fieldErrors.street}
			/>
			<Input label="City" placeholder="Amsterdam" bind:value={city} error={fieldErrors.city} />
		</div>

		{#if isLookupLoading}
			<div class="text-xs font-medium text-zinc-500">Looking up address via PDOK...</div>
		{/if}
		{#if lookupMessage}
			<div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
				{lookupMessage}
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input label="KVK Number (optional)" placeholder="12345678" bind:value={kvkNumber} />
			<Input label="BTW Number (optional)" placeholder="NL123456789B01" bind:value={btwNumber} />
		</div>

		{#if errorMessage}
			<div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
				{errorMessage}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleSubmit} {isLoading}>Create Organization</Button>
		</div>
	{/snippet}
</Modal>
