<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import { updateOrganization } from '$lib/api/organizations';
	import type { GetOrganizationResponse, UpdateOrganizationRequest } from '$lib/types/api';
	import { OrganizationSchema, type OrganizationSchemaInput } from '$lib/schemas/organization';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { m } from '$lib/paraglide/messages';
	import { getToastState } from '$lib/state/toast.svelte';
	import { onDestroy } from 'svelte';

	interface Props {
		open?: boolean;
		organization?: GetOrganizationResponse | null;
		isFetching?: boolean;
		loadErrorMessage?: string;
		onUpdated?: () => void;
		onClose?: () => void;
	}

	let {
		open = $bindable(false),
		organization = $bindable<GetOrganizationResponse | null>(null),
		isFetching = false,
		loadErrorMessage,
		onUpdated,
		onClose
	}: Props = $props();
	const toast = getToastState();

	let submitErrorMessage = $state('');
	let lookupMessage = $state('');
	let isLookupLoading = $state(false);
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;
	let lookupController: AbortController | null = null;
	const formId = 'edit-organization-form';
	const emptyForm: OrganizationSchemaInput = {
		name: '',
		email: '',
		postal_code: '',
		house_number: '',
		house_number_addition: '',
		street: '',
		city: '',
		kvk_number: '',
		btw_number: ''
	};

	const { form, errors, enhance, delayed, submitting, reset } = superForm(
		defaults(emptyForm, valibotClient(OrganizationSchema)),
		{
			validators: valibotClient(OrganizationSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && organization) {
					try {
						const payload: UpdateOrganizationRequest = {
							name: form.data.name.trim(),
							street: form.data.street.trim(),
							house_number: form.data.house_number.trim(),
							house_number_addition: trimToUndefined(form.data.house_number_addition),
							postal_code: formatPostalCode(form.data.postal_code).trim(),
							city: form.data.city.trim(),
							email: trimToUndefined(form.data.email),
							kvk_number: trimToUndefined(form.data.kvk_number),
							btw_number: trimToUndefined(form.data.btw_number)
						};
						await updateOrganization(organization.id, payload);
						toast.success(m.organization_updated_success());
						clearFormState();
						open = false;
						onUpdated?.();
					} catch {
						submitErrorMessage = m.failed_update_organization();
					}
				}
			}
		}
	);

	$effect(() => {
		if (open && organization) {
			const initialData: OrganizationSchemaInput = {
				name: organization.name,
				email: organization.email ?? undefined,
				postal_code: organization.postal_code,
				house_number: organization.house_number,
				house_number_addition: organization.house_number_addition ?? undefined,
				street: organization.street,
				city: organization.city,
				kvk_number: organization.kvk_number ?? undefined,
				btw_number: organization.btw_number ?? undefined
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
		clearFormState();
		open = false;
		onClose?.();
	};

	const clearFormState = () => {
		if (lookupTimer) clearTimeout(lookupTimer);
		lookupTimer = null;
		lookupController?.abort();
		lookupController = null;
		submitErrorMessage = '';
		lookupMessage = '';
		isLookupLoading = false;
		reset({ data: emptyForm });
	};

	const handleModalClose = () => {
		clearFormState();
		onClose?.();
	};

	const runLookup = async (postcodeValue: string, numberValue: string) => {
		if (!isPostalCodeValid(postcodeValue)) return;
		lookupController?.abort();
		const controller = new AbortController();
		lookupController = controller;
		isLookupLoading = true;
		lookupMessage = '';
		try {
			const result = await lookupAddressByPostcode(postcodeValue, numberValue, {
				signal: controller.signal
			});
			if (controller.signal.aborted) return;
			if (!result || !organization) {
				lookupMessage = m.address_not_found_manual();
				return;
			}
			$form.street = result.street;
			$form.city = result.city;
		} catch {
			if (controller.signal.aborted) return;
			lookupMessage = m.address_lookup_failed();
		} finally {
			if (lookupController === controller) {
				isLookupLoading = false;
				lookupController = null;
			}
		}
	};

	const scheduleLookup = (postcodeValue: string, numberValue: string) => {
		lookupMessage = '';
		if (lookupTimer) clearTimeout(lookupTimer);
		lookupTimer = null;
		lookupController?.abort();
		if (!postcodeValue.trim() || !numberValue.trim()) return;
		lookupTimer = setTimeout(() => {
			lookupTimer = null;
			void runLookup(postcodeValue, numberValue);
		}, 400);
	};

	onDestroy(() => {
		if (lookupTimer) clearTimeout(lookupTimer);
		lookupController?.abort();
	});
</script>

<Modal
	bind:open
	title={m.edit_organization()}
	description={m.edit_organization_description()}
	closeLabel={m.close()}
	onClose={handleModalClose}
>
	<form id={formId} use:enhance class="space-y-5">
		{#if isFetching}
			<div
				class="rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text-muted"
				role="status"
			>
				{m.loading_organization_details()}
			</div>
		{/if}
		{#if loadErrorMessage}
			<div
				class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
				role="alert"
			>
				{loadErrorMessage}
			</div>
		{/if}

		{#if organization}
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label={m.organization_name()}
					placeholder={m.placeholder_organization_name_example()}
					bind:value={$form.name}
					error={formatFormError($errors.name)}
					disabled={isFetching}
				/>
				<Input
					label={m.email_optional()}
					placeholder={m.placeholder_organization_email()}
					type="email"
					bind:value={$form.email}
					error={formatFormError($errors.email)}
					disabled={isFetching}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
				<Input
					label={m.postal_code()}
					placeholder={m.example_postal_code()}
					bind:value={$form.postal_code}
					error={formatFormError($errors.postal_code)}
					oninput={() => {
						scheduleLookup($form.postal_code, $form.house_number);
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
					label={m.house_number()}
					placeholder={m.example_house_number()}
					bind:value={$form.house_number}
					error={formatFormError($errors.house_number)}
					oninput={() => {
						scheduleLookup($form.postal_code, $form.house_number);
					}}
					disabled={isFetching}
				/>
				<Input
					label={m.addition_optional()}
					placeholder={m.example_house_number_addition()}
					bind:value={$form.house_number_addition}
					disabled={isFetching}
				/>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label={m.street()}
					placeholder={m.example_street_name()}
					bind:value={$form.street}
					error={formatFormError($errors.street)}
					disabled={isFetching}
				/>
				<Input
					label={m.city()}
					placeholder={m.example_city_name()}
					bind:value={$form.city}
					error={formatFormError($errors.city)}
					disabled={isFetching}
				/>
			</div>

			{#if isLookupLoading}
				<div class="text-xs font-medium text-text-muted" role="status">
					{m.looking_up_address()}
				</div>
			{/if}
			{#if lookupMessage}
				<div
					class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
					role="status"
				>
					{lookupMessage}
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Input
					label={m.kvk_number_optional()}
					placeholder={m.placeholder_kvk_number()}
					bind:value={$form.kvk_number}
					disabled={isFetching}
				/>
				<Input
					label={m.btw_number_optional()}
					placeholder={m.placeholder_btw_number()}
					bind:value={$form.btw_number}
					disabled={isFetching}
				/>
			</div>
		{/if}

		{#if submitErrorMessage}
			<div
				class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
				role="alert"
			>
				{submitErrorMessage}
			</div>
		{/if}

		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isFetching || $submitting}>
				{m.cancel()}
			</Button>
			<Button
				form={formId}
				type="submit"
				isLoading={$delayed}
				disabled={isFetching || !organization || $submitting}
			>
				{m.save_changes()}
			</Button>
		</div>
	{/snippet}
</Modal>
