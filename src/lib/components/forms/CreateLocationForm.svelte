<script lang="ts">
	import { Plus, Trash2 } from 'lucide-svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { createOrganizationLocation } from '$lib/api/organizations';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import type { CreateLocationRequest, LocationShift } from '$lib/types/api';

	interface Props {
		open?: boolean;
		organizationId: string;
		onCreated?: () => void;
	}

	let { open = $bindable(false), organizationId, onCreated }: Props = $props();

	let name = $state('');
	let street = $state('');
	let houseNumber = $state('');
	let houseNumberAddition = $state('');
	let postalCode = $state('');
	let city = $state('');
	let capacity = $state('');
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
		capacity?: string;
	}>({});
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;

	const resetForm = () => {
		name = '';
		street = '';
		houseNumber = '';
		houseNumberAddition = '';
		postalCode = '';
		city = '';
		capacity = '';
		errorMessage = '';
		lookupMessage = '';
		fieldErrors = {};
	};

	const toOptionalString = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	};

	const toOptionalNumber = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return undefined;
		const parsed = Number.parseInt(trimmed, 10);
		return Number.isFinite(parsed) ? parsed : undefined;
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
			capacity?: string;
		} = {};
		if (!name.trim()) nextErrors.name = 'Name is required.';
		if (!street.trim()) nextErrors.street = 'Street is required.';
		if (!houseNumber.trim()) nextErrors.houseNumber = 'House number is required.';
		if (!postalCode.trim()) nextErrors.postalCode = 'Postal code is required.';
		if (!city.trim()) nextErrors.city = 'City is required.';
		if (capacity.trim()) {
			const parsed = Number.parseInt(capacity.trim(), 10);
			if (!Number.isFinite(parsed) || parsed < 0) {
				nextErrors.capacity = 'Capacity must be 0 or greater.';
			}
		}
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
			const payload: CreateLocationRequest = {
				name: name.trim(),
				street: street.trim(),
				house_number: houseNumber.trim(),
				house_number_addition: toOptionalString(houseNumberAddition),
				postal_code: formatPostalCode(postalCode).trim(),
				city: city.trim(),
				capacity: toOptionalNumber(capacity)
			};
			await createOrganizationLocation(organizationId, payload);
			resetForm();
			open = false;
			onCreated?.();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to create location.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Modal
	bind:open
	title="Create location"
	description="Add a new care location to this organization."
>
	<div class="space-y-5">
		<Input
			label="Location name"
			placeholder="Main campus"
			bind:value={name}
			error={fieldErrors.name}
		/>

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
			<div class="text-xs font-medium text-text-muted">Looking up address via PDOK...</div>
		{/if}
		{#if lookupMessage}
			<div class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
				{lookupMessage}
			</div>
		{/if}

		<Input
			label="Capacity (optional)"
			placeholder="20"
			type="number"
			min="0"
			step="1"
			bind:value={capacity}
			error={fieldErrors.capacity}
		/>

		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleSubmit} {isLoading}>Create location</Button>
		</div>
	{/snippet}
</Modal>
