<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import { createClientEmergencyContact } from '$lib/api/clients';
	import {
		EmergencyContactSchema,
		type EmergencyContactSchemaInput
	} from '$lib/schemas/emergency-contact';
	import type { CreateClientEmergencyContactParams } from '$lib/types/api';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		open?: boolean;
		clientId: string;
		onCreated?: () => void;
	}

	let { open = $bindable(false), clientId, onCreated }: Props = $props();

	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let errorMessage = $state('');
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;
	const formId = 'create-emergency-contact-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				medical_reports: false,
				incidents_reports: false,
				goals_reports: false
			} as unknown as EmergencyContactSchemaInput,
			valibotClient(EmergencyContactSchema)
		),
		{
			validators: valibotClient(EmergencyContactSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid) {
					try {
						const address = buildAddress(form.data);

						const payload: CreateClientEmergencyContactParams = {
							first_name: trimToUndefined(form.data.first_name),
							last_name: trimToUndefined(form.data.last_name),
							email: trimToUndefined(form.data.email),
							phone_number: trimToUndefined(form.data.phone_number),
							address: address || undefined,
							relationship: trimToUndefined(form.data.relationship),
							relation_status: trimToUndefined(form.data.relation_status),
							medical_reports: form.data.medical_reports ?? false,
							incidents_reports: form.data.incidents_reports ?? false,
							goals_reports: form.data.goals_reports ?? false
						};

						await createClientEmergencyContact(clientId, payload);
						reset();
						open = false;
						onCreated?.();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : m.failed_create_contact();
					}
				}
			}
		}
	);

	const buildAddress = (data: Record<string, unknown>): string => {
		const parts = [
			data.street,
			data.house_number,
			data.house_number_addition,
			data.postal_code ? normalizePostalCode(String(data.postal_code)) : null,
			data.city,
			data.country
		]
			.filter(Boolean)
			.map(String);
		return parts.join(', ');
	};

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

<Modal bind:open title={m.add_contact()} description={m.contact_updates()} class="max-w-3xl">
	<form id={formId} use:enhance class="space-y-6">
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				label={m.first_name()}
				placeholder={m.example_first_name()}
				bind:value={$form.first_name}
				error={formatFormError($errors.first_name)}
			/>
			<Input
				label={m.last_name()}
				placeholder={m.example_last_name()}
				bind:value={$form.last_name}
				error={formatFormError($errors.last_name)}
			/>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				label={m.email_address()}
				placeholder="example@email.com"
				type="email"
				bind:value={$form.email}
				error={formatFormError($errors.email)}
			/>
			<Input
				label={m.phone_number()}
				placeholder={m.example_phone_nl()}
				bind:value={$form.phone_number}
				error={formatFormError($errors.phone_number)}
			/>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<Input
				label={m.relationship()}
				placeholder={m.placeholder_relationship_example()}
				bind:value={$form.relationship}
				error={formatFormError($errors.relationship)}
			/>
			<Input
				label={m.relation_status()}
				bind:value={$form.relation_status}
				error={formatFormError($errors.relation_status)}
			/>
		</div>

		<div class="space-y-2">
			<p class="ml-1 text-sm font-semibold text-text-muted">{m.address()}</p>
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
				<div
					class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
				>
					{lookupMessage}
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input label={m.country()} placeholder={m.example_country()} bind:value={$form.country} />
			</div>
		</div>

		<div class="space-y-3">
			<p class="ml-1 text-sm font-semibold text-text-muted">{m.contact_updates()}</p>
			<div class="flex flex-wrap gap-6">
				<label class="flex items-center gap-2 text-sm text-text">
					<input
						type="checkbox"
						bind:checked={$form.medical_reports}
						class="h-4 w-4 rounded border-border accent-brand"
					/>
					{m.notify_about_medical_reports()}
				</label>
				<label class="flex items-center gap-2 text-sm text-text">
					<input
						type="checkbox"
						bind:checked={$form.incidents_reports}
						class="h-4 w-4 rounded border-border accent-brand"
					/>
					{m.notify_about_incidents()}
				</label>
				<label class="flex items-center gap-2 text-sm text-text">
					<input
						type="checkbox"
						bind:checked={$form.goals_reports}
						class="h-4 w-4 rounded border-border accent-brand"
					/>
					{m.notify_about_goals()}
				</label>
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
			<Button form={formId} type="submit" isLoading={$delayed}>{m.create()}</Button>
		</div>
	{/snippet}
</Modal>
