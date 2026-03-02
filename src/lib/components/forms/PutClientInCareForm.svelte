<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import { putClientInCare } from '$lib/api/clients';
	import type { PutClientInCareRequest } from '$lib/types/api';
	import { PutClientInCareSchema, type PutClientInCareSchemaInput } from '$lib/schemas/client-care';

	interface Props {
		open?: boolean;
		clientId?: string | null;
		onSuccess?: () => void;
	}

	let { open = $bindable(false), clientId = null, onSuccess }: Props = $props();

	let coordinatorName = $state('');
	let errorMessage = $state('');
	const formId = 'put-client-in-care-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				care_start_date: '',
				coordinator_employee_id: '',
				placed_in_care_at: '',
				reason: ''
			} as unknown as PutClientInCareSchemaInput,
			valibotClient(PutClientInCareSchema)
		),
		{
			validators: valibotClient(PutClientInCareSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && clientId) {
					try {
						const payload: PutClientInCareRequest = {
							care_start_date: form.data.care_start_date.trim(),
							coordinator_employee_id: form.data.coordinator_employee_id.trim(),
							placed_in_care_at: trimToUndefined(form.data.placed_in_care_at),
							reason: trimToUndefined(form.data.reason)
						};

						await putClientInCare(clientId, payload);
						reset();
						open = false;
						onSuccess?.();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : 'Failed to put client in care.';
					}
				}
			}
		}
	);

	const handleCancel = () => {
		reset();
		open = false;
	};

	const loadCoordinatorOptions = async (query: string): Promise<EmployeeListItem[]> => {
		const response = await listEmployees({
			page: 1,
			pageSize: 50,
			isArchived: false,
			outOfService: false,
			search: query
		});

		return response.data.results;
	};
</script>

<Modal
	bind:open
	title="Put Client In Care"
	description="Move this client from waiting list to care lifecycle and assign the main coordinator."
	class="max-w-xl"
>
	<form id={formId} use:enhance class="space-y-5">
		<DatePicker
			label="Care Start Date"
			bind:value={$form.care_start_date}
			error={formatFormError($errors.care_start_date)}
		/>

		<SearchSelect
			label="Main Coordinator"
			bind:value={$form.coordinator_employee_id}
			bind:displayValue={coordinatorName}
			error={formatFormError($errors.coordinator_employee_id)}
			loadOptions={loadCoordinatorOptions}
			labelFn={(employee) => `${employee.first_name} ${employee.last_name}`}
			valueFn={(employee) => employee.id}
			placeholder="Select coordinator..."
			searchPlaceholder="Search employees..."
		/>

		<DateTimePicker label="Placed In Care At (Optional)" bind:value={$form.placed_in_care_at} />

		<Textarea
			label="Reason (Optional)"
			bind:value={$form.reason}
			placeholder="e.g. approved in intake review"
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
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>Cancel</Button>
			<Button form={formId} type="submit" isLoading={$delayed}>Put In Care</Button>
		</div>
	{/snippet}
</Modal>
