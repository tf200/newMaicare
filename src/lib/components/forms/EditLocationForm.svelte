<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import { updateLocation } from '$lib/api/organizations';
	import type { OrganizationLocation, UpdateLocationRequest } from '$lib/types/api';
	import { LocationSchema, type LocationSchemaInput } from '$lib/schemas/location';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';

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

	let submitErrorMessage = $state('');
	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;
	const formId = 'edit-location-form';
	const toOptionalInt = (value: string | number | undefined): number | undefined => {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : undefined;
		}

		const normalized = value?.trim();
		if (!normalized) return undefined;

		const parsed = Number.parseInt(normalized, 10);
		return Number.isFinite(parsed) ? parsed : undefined;
	};

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				name: '',
				postal_code: '',
				house_number: '',
				street: '',
				city: ''
			} as unknown as LocationSchemaInput,
			valibotClient(LocationSchema)
		),
		{
			validators: valibotClient(LocationSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && location) {
					try {
						const payload: UpdateLocationRequest = {
							name: form.data.name.trim(),
							street: form.data.street.trim(),
							house_number: form.data.house_number.trim(),
							postal_code: formatPostalCode(form.data.postal_code).trim(),
							city: form.data.city.trim(),
							house_number_addition: trimToUndefined(form.data.house_number_addition),
							capacity: toOptionalInt(form.data.capacity)
						};
						await updateLocation(location.id, payload);
						open = false;
						onUpdated?.();
					} catch (error) {
						submitErrorMessage =
							error instanceof Error ? error.message : 'Failed to update location.';
					}
				}
			}
		}
	);

	$effect(() => {
		if (open && location) {
			const initialData: LocationSchemaInput = {
				name: location.name,
				postal_code: location.postal_code,
				house_number: location.house_number,
				house_number_addition: location.house_number_addition ?? undefined,
				street: location.street,
				city: location.city,
				capacity: location.capacity ?? undefined
			};
			reset({ data: initialData });
		}
	});

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
			if (!result || !location) {
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
</script>

<Modal
	bind:open
	title="Edit Location"
	description="Update location details and address information."
>
	<form id={formId} use:enhance class="space-y-5">
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
				bind:value={$form.name}
				error={formatFormError($errors.name)}
				disabled={isFetching}
			/>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input
					label="Postal Code"
					placeholder="1234 AB"
					bind:value={$form.postal_code}
					error={formatFormError($errors.postal_code)}
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
					disabled={isFetching}
				/>
				<Input
					label="House Number"
					placeholder="10"
					bind:value={$form.house_number}
					error={formatFormError($errors.house_number)}
					oninput={() => {
						if ($form.postal_code && $form.house_number) {
							scheduleLookup($form.postal_code, $form.house_number);
						}
					}}
					disabled={isFetching}
				/>
				<Input
					label="Addition (optional)"
					placeholder="A"
					bind:value={$form.house_number_addition}
					disabled={isFetching}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label="Street"
					placeholder="Main Street"
					bind:value={$form.street}
					error={formatFormError($errors.street)}
					disabled={isFetching}
				/>
				<Input
					label="City"
					placeholder="Amsterdam"
					bind:value={$form.city}
					error={formatFormError($errors.city)}
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
				bind:value={$form.capacity}
				error={formatFormError($errors.capacity)}
				disabled={isFetching}
			/>
		{/if}

		{#if submitErrorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{submitErrorMessage}
			</div>
		{/if}

		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isFetching || $delayed}>
				Cancel
			</Button>
			<Button form={formId} type="submit" isLoading={$delayed} disabled={isFetching || !location}>
				Save changes
			</Button>
		</div>
	{/snippet}
</Modal>
