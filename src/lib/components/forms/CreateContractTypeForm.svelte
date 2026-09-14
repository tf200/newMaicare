<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { createContractType } from '$lib/api/contract-types';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { m } from '$lib/paraglide/messages';
	import {
		ContractTypeSchema,
		type ContractTypeInput
	} from '$lib/schemas/contract-type';
	import { getToastState } from '$lib/state/toast.svelte';
	import type { ContractType } from '$lib/types/api';
	import { formatFormError } from '$lib/utils/form-errors';
	import { getFormErrorNavigationOptions } from '$lib/utils/form-navigation';

	interface Props {
		open?: boolean;
		onCreated?: (contractType: ContractType) => void;
	}

	let { open = $bindable(false), onCreated }: Props = $props();
	const toast = getToastState();
	const formId = 'create-contract-type-form';
	let errorMessage = $state('');

	const { form, errors, enhance, submitting, reset } = superForm<ContractTypeInput>(
		defaults({ name: '' }, valibotClient(ContractTypeSchema)),
		{
			...getFormErrorNavigationOptions(),
			id: formId,
			validators: valibotClient(ContractTypeSchema),
			SPA: true,
			dataType: 'json',
			onSubmit: () => {
				errorMessage = '';
			},
			onUpdate: async ({ form }) => {
				if (!form.valid) return;

				try {
					const response = await createContractType({ name: form.data.name });
					const contractType = response.data;
					toast.success(m.contract_type_created_success());
					clearTransientState();
					open = false;
					onCreated?.(contractType);
				} catch (error) {
					errorMessage = error instanceof Error ? error.message : m.failed_create_contract_type();
				}
			}
		}
	);

	function clearTransientState() {
		errorMessage = '';
		reset();
	}

	function handleCancel() {
		clearTransientState();
		open = false;
	}
</script>

<Modal
	bind:open
	title={m.create_contract_type()}
	description={m.create_contract_type_description()}
	class="max-w-lg"
	closeLabel={m.close()}
	dismissible={!$submitting}
	onClose={clearTransientState}
>
	<form id={formId} use:enhance class="space-y-5">
		<Input
			label={m.contract_type_name()}
			placeholder={m.contract_type_name_placeholder()}
			bind:value={$form.name}
			error={formatFormError($errors.name)}
			required
			autocomplete="off"
		/>

		{#if errorMessage}
			<div
				class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
				role="alert"
			>
				{errorMessage}
			</div>
		{/if}
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button type="button" variant="ghost" onclick={handleCancel} disabled={$submitting}>
				{m.cancel()}
			</Button>
			<Button form={formId} type="submit" isLoading={$submitting} disabled={$submitting}>
				{m.create_contract_type()}
			</Button>
		</div>
	{/snippet}
</Modal>
