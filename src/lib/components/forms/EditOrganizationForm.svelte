<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import { updateOrganization } from '$lib/api/organizations';
	import type { GetOrganizationResponse, UpdateOrganizationRequest } from '$lib/types/api';

	interface Props {
		open?: boolean;
		organization?: GetOrganizationResponse | null;
		isFetching?: boolean;
		loadErrorMessage?: string;
		onUpdated?: () => void;
	}

	let {
		open = $bindable(false),
		organization = $bindable<GetOrganizationResponse | null>(null),
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
	}>({});
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;

	const validate = () => {
		if (!organization) return false;
		const nextErrors: {
			name?: string;
			street?: string;
			houseNumber?: string;
			postalCode?: string;
			city?: string;
		} = {};
		if (!organization.name.trim()) nextErrors.name = 'Name is required.';
		if (!organization.street.trim()) nextErrors.street = 'Street is required.';
		if (!organization.house_number.trim()) nextErrors.houseNumber = 'House number is required.';
		if (!organization.postal_code.trim()) nextErrors.postalCode = 'Postal code is required.';
		if (!organization.city.trim()) nextErrors.city = 'City is required.';
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
			if (!result || !organization) {
				lookupMessage = 'Address not found. Please fill street and city manually.';
				return;
			}
			organization.street = result.street;
			organization.city = result.city;
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
		if (!organization) {
			submitErrorMessage = 'Organization is missing.';
			return;
		}
		if (!validate()) return;
		isLoading = true;
		try {
			const payload: UpdateOrganizationRequest = {
				name: organization.name.trim(),
				street: organization.street.trim(),
				house_number: organization.house_number.trim(),
				house_number_addition: toOptional(organization.house_number_addition ?? ''),
				postal_code: formatPostalCode(organization.postal_code).trim(),
				city: organization.city.trim(),
				email: toOptional(organization.email ?? ''),
				kvk_number: toOptional(organization.kvk_number ?? ''),
				btw_number: toOptional(organization.btw_number ?? '')
			};
			await updateOrganization(organization.id, payload);
			open = false;
			onUpdated?.();
		} catch (error) {
			submitErrorMessage =
				error instanceof Error ? error.message : 'Failed to update organization.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Modal
	bind:open
	title="Edit Organization"
	description="Update organization details and address information."
>
	<div class="space-y-5">
		{#if isFetching}
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
				Loading organization details...
			</div>
		{/if}
		{#if loadErrorMessage}
			<div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
				{loadErrorMessage}
			</div>
		{/if}

		{#if organization}
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Organization Name"
					placeholder="Acme Corp"
					bind:value={organization.name}
					error={fieldErrors.name}
					disabled={isFetching}
				/>
				<Input
					label="Email (optional)"
					placeholder="contact@acme.com"
					type="email"
					bind:value={organization.email}
					disabled={isFetching}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input
					label="Postal Code"
					placeholder="1234 AB"
					bind:value={organization.postal_code}
					error={fieldErrors.postalCode}
					oninput={() => {
						scheduleLookup(organization.postal_code, organization.house_number);
					}}
					onblur={() => {
						organization.postal_code = formatPostalCode(organization.postal_code);
						scheduleLookup(organization.postal_code, organization.house_number);
					}}
					disabled={isFetching}
				/>
				<Input
					label="House Number"
					placeholder="10"
					bind:value={organization.house_number}
					error={fieldErrors.houseNumber}
					oninput={() => {
						scheduleLookup(organization.postal_code, organization.house_number);
					}}
					disabled={isFetching}
				/>
				<Input
					label="Addition (optional)"
					placeholder="A"
					bind:value={organization.house_number_addition}
					disabled={isFetching}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Street"
					placeholder="Main Street"
					bind:value={organization.street}
					error={fieldErrors.street}
					disabled={isFetching}
				/>
				<Input
					label="City"
					placeholder="Amsterdam"
					bind:value={organization.city}
					error={fieldErrors.city}
					disabled={isFetching}
				/>
			</div>

			{#if isLookupLoading}
				<div class="text-xs font-medium text-zinc-500">Looking up address via PDOK...</div>
			{/if}
			{#if lookupMessage}
				<div
					class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
				>
					{lookupMessage}
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="KVK Number (optional)"
					placeholder="12345678"
					bind:value={organization.kvk_number}
					disabled={isFetching}
				/>
				<Input
					label="BTW Number (optional)"
					placeholder="NL123456789B01"
					bind:value={organization.btw_number}
					disabled={isFetching}
				/>
			</div>
		{/if}

		{#if submitErrorMessage}
			<div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
				{submitErrorMessage}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isFetching || isLoading}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} {isLoading} disabled={isFetching || !organization}>
				Save changes
			</Button>
		</div>
	{/snippet}
</Modal>
