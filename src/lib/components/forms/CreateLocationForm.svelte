<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { createOrganizationLocation } from '$lib/api/organizations';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import type { CreateLocationRequest } from '$lib/types/api';
	import { LocationSchema, type LocationSchemaInput } from '$lib/schemas/location';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		open?: boolean;
		organizationId: string;
		onCreated?: () => void;
	}

	let { open = $bindable(false), organizationId, onCreated }: Props = $props();

	let errorMessage = $state('');
	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;
	const formId = 'create-location-form';
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
				if (form.valid) {
					try {
						const payload: CreateLocationRequest = {
							name: form.data.name.trim(),
							street: form.data.street.trim(),
							house_number: form.data.house_number.trim(),
							postal_code: formatPostalCode(form.data.postal_code).trim(),
							city: form.data.city.trim(),
							house_number_addition: trimToUndefined(form.data.house_number_addition),
							capacity: toOptionalInt(form.data.capacity)
						};
						await createOrganizationLocation(organizationId, payload);
						reset();
						open = false;
						onCreated?.();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : m.failed_create_location();
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
</script>

<Modal bind:open title={m.create_location()} description={m.create_location_description()}>
	<form id={formId} use:enhance class="space-y-5">
		<Input
			label={m.location_name()}
			placeholder={m.placeholder_location_name()}
			bind:value={$form.name}
			error={formatFormError($errors.name)}
		/>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
			<Input
				label={m.postal_code()}
				placeholder={m.example_postal_code()}
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
			/>
			<Input
				label={m.house_number()}
				placeholder={m.example_house_number()}
				bind:value={$form.house_number}
				error={formatFormError($errors.house_number)}
				oninput={() => {
					if ($form.postal_code && $form.house_number) {
						scheduleLookup($form.postal_code, $form.house_number);
					}
				}}
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

		<Input
			label={m.capacity_optional()}
			placeholder={m.placeholder_capacity()}
			type="number"
			min="0"
			step="1"
			bind:value={$form.capacity}
			error={formatFormError($errors.capacity)}
		/>

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
			<Button form={formId} type="submit" isLoading={$delayed}>{m.create_location()}</Button>
		</div>
	{/snippet}
</Modal>
