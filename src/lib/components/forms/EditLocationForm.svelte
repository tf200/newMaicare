<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import { updateLocation } from '$lib/api/organizations';
	import type { OrganizationLocation, UpdateLocationRequest } from '$lib/types/api';

	interface Props {
		open?: boolean;
		location?: OrganizationLocation | null;
		isFetching?: boolean;
		loadErrorMessage?: string;
		onUpdated?: () => void;
	}

	let {
		open = $bindable(false),
		location = $bindable<OrganizationLocation | null>(null),
		isFetching = false,
		loadErrorMessage,
		onUpdated
	}: Props = $props();

	const normalizePostalCode = (value: string) => value.replace(/\s+/g, '').toUpperCase().trim();

	const formatPostalCode = (value: string) => {
		const normalized = normalizePostalCode(value);
		if (normalized.length <= 4) return normalized;
		return `${normalized.slice(0, 4)} ${normalized.slice(4, 6)}`;
	};

	const isPostalCodeValid = (value: string) => /^\d{4}\s?[A-Za-z]{2}$/.test(value.trim());

	const toOptional = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	};

	let submitErrorMessage = $state('');
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

	const validate = () => {
		if (!location) return false;
		const nextErrors: {
			name?: string;
			street?: string;
			houseNumber?: string;
			postalCode?: string;
			city?: string;
			capacity?: string;
		} = {};
		if (!location.name.trim()) nextErrors.name = 'Name is required.';
		if (!location.street.trim()) nextErrors.street = 'Street is required.';
		if (!location.house_number.trim()) nextErrors.houseNumber = 'House number is required.';
		if (!location.postal_code.trim()) nextErrors.postalCode = 'Postal code is required.';
		if (!location.city.trim()) nextErrors.city = 'City is required.';
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
			if (!result || !location) {
				lookupMessage = 'Address not found. Please fill street and city manually.';
				return;
			}
			location.street = result.street;
			location.city = result.city;
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
		submitErrorMessage = '';
		if (!location) {
			submitErrorMessage = 'Location is missing.';
			return;
		}
		if (!validate()) return;
		isLoading = true;
		try {
			const payload: UpdateLocationRequest = {
				name: location.name.trim(),
				street: location.street.trim(),
				house_number: location.house_number.trim(),
				house_number_addition: toOptional(location.house_number_addition ?? ''),
				postal_code: formatPostalCode(location.postal_code).trim(),
				city: location.city.trim(),
				capacity: location.capacity ?? undefined
			};
			await updateLocation(location.id, payload);
			open = false;
			onUpdated?.();
		} catch (error) {
			submitErrorMessage = error instanceof Error ? error.message : 'Failed to update location.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Modal
	bind:open
	title="Edit Location"
	description="Update location details and address information."
>
	<div class="space-y-5">
		{#if isFetching}
			<div class="rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text-muted">
				Loading location details...
			</div>
		{/if}
		{#if loadErrorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{loadErrorMessage}
			</div>
		{/if}

		{#if location}
			<Input
				label="Location Name"
				placeholder="Main campus"
				bind:value={location.name}
				error={fieldErrors.name}
				disabled={isFetching}
			/>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input
					label="Postal Code"
					placeholder="1234 AB"
					bind:value={location.postal_code}
					error={fieldErrors.postalCode}
					oninput={() => {
						scheduleLookup(location.postal_code, location.house_number);
					}}
					onblur={() => {
						location.postal_code = formatPostalCode(location.postal_code);
						scheduleLookup(location.postal_code, location.house_number);
					}}
					disabled={isFetching}
				/>
				<Input
					label="House Number"
					placeholder="10"
					bind:value={location.house_number}
					error={fieldErrors.houseNumber}
					oninput={() => {
						scheduleLookup(location.postal_code, location.house_number);
					}}
					disabled={isFetching}
				/>
				<Input
					label="Addition (optional)"
					placeholder="A"
					value={location.house_number_addition ?? ''}
					oninput={(e) => {
						location.house_number_addition = e.currentTarget.value;
					}}
					disabled={isFetching}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Street"
					placeholder="Main Street"
					bind:value={location.street}
					error={fieldErrors.street}
					disabled={isFetching}
				/>
				<Input
					label="City"
					placeholder="Amsterdam"
					bind:value={location.city}
					error={fieldErrors.city}
					disabled={isFetching}
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

			<Input
				label="Capacity (optional)"
				placeholder="20"
				type="number"
				min="0"
				step="1"
				value={location.capacity?.toString() ?? ''}
				oninput={(e) => {
					const val = e.currentTarget.value;
					location.capacity = val ? Number.parseInt(val, 10) : null;
				}}
				disabled={isFetching}
			/>
		{/if}

		{#if submitErrorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{submitErrorMessage}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isFetching || isLoading}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} {isLoading} disabled={isFetching || !location}>
				Save changes
			</Button>
		</div>
	{/snippet}
</Modal>
