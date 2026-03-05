<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { putClientOutOfCare } from '$lib/api/clients';
	import type { ClientDischargeReason, PutClientOutOfCareRequest } from '$lib/types/api';
	import {
		PutClientOutOfCareSchema,
		type PutClientOutOfCareSchemaInput
	} from '$lib/schemas/client-care';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		open?: boolean;
		clientId?: string | null;
		onSuccess?: () => void;
	}

	let { open = $bindable(false), clientId = null, onSuccess }: Props = $props();

	let errorMessage = $state('');
	const formId = 'put-client-out-of-care-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				discharge_date: '',
				discharge_reason: 'treatment_completed',
				final_evaluation: '',
				reason: ''
			} as unknown as PutClientOutOfCareSchemaInput,
			valibotClient(PutClientOutOfCareSchema)
		),
		{
			validators: valibotClient(PutClientOutOfCareSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && clientId) {
					try {
						const payload: PutClientOutOfCareRequest = {
							discharge_date: form.data.discharge_date.trim(),
							discharge_reason: form.data.discharge_reason,
							final_evaluation: trimToUndefined(form.data.final_evaluation),
							reason: trimToUndefined(form.data.reason)
						};

						await putClientOutOfCare(clientId, payload);
						reset();
						open = false;
						onSuccess?.();
					} catch (error) {
						errorMessage =
							error instanceof Error ? error.message : m.failed_put_client_out_of_care();
					}
				}
			}
		}
	);

	const dischargeReasonOptions: Array<{ label: string; value: ClientDischargeReason }> = [
		{ label: m.treatment_completed(), value: 'treatment_completed' },
		{ label: m.mutual_agreement(), value: 'terminated_by_mutual_agreement' },
		{ label: m.terminated_by_client(), value: 'terminated_by_client' },
		{ label: m.terminated_by_provider(), value: 'terminated_by_provider' },
		{ label: m.external_factors(), value: 'terminated_due_to_external_factors' },
		{ label: m.other(), value: 'other' }
	];

	const handleCancel = () => {
		reset();
		open = false;
	};
</script>

<Modal
	bind:open
	title={m.put_client_out_of_care()}
	description={m.put_client_out_of_care_description()}
	class="max-w-xl"
>
	<form id={formId} use:enhance class="space-y-5">
		<DatePicker
			label={m.discharge_date()}
			bind:value={$form.discharge_date}
			error={formatFormError($errors.discharge_date)}
		/>

		<Select
			label={m.discharge_reason()}
			options={dischargeReasonOptions}
			bind:value={$form.discharge_reason}
			error={formatFormError($errors.discharge_reason)}
			placeholder={m.select_discharge_reason()}
		/>

		<Textarea
			label={m.final_evaluation()}
			bind:value={$form.final_evaluation}
			error={formatFormError($errors.final_evaluation)}
			placeholder={m.discharge_final_evaluation_hint()}
			rows={4}
		/>

		<Textarea
			label={m.reason_optional()}
			bind:value={$form.reason}
			placeholder={m.status_history_reason_override()}
			rows={3}
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
			<Button variant="destructive" form={formId} type="submit" isLoading={$delayed}
				>{m.put_out_of_care()}</Button
			>
		</div>
	{/snippet}
</Modal>
