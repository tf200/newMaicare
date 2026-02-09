<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import { putClientInCare } from '$lib/api/clients';
	import type { PutClientInCareRequest } from '$lib/types/api';

	interface Props {
		open?: boolean;
		clientId?: string | null;
		onSuccess?: () => void;
	}

	let { open = $bindable(false), clientId = null, onSuccess }: Props = $props();

	let careStartDate = $state('');
	let coordinatorId = $state('');
	let coordinatorName = $state('');
	let placedInCareAt = $state('');
	let reason = $state('');

	let isLoading = $state(false);
	let errorMessage = $state('');
	let fieldErrors = $state<{ careStartDate?: string; coordinatorId?: string }>({});

	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	const resetForm = () => {
		careStartDate = '';
		coordinatorId = '';
		coordinatorName = '';
		placedInCareAt = '';
		reason = '';
		errorMessage = '';
		fieldErrors = {};
	};

	const validate = () => {
		const nextErrors: { careStartDate?: string; coordinatorId?: string } = {};

		if (!careStartDate.trim()) {
			nextErrors.careStartDate = 'Care start date is required.';
		} else if (!/^\d{4}-\d{2}-\d{2}$/.test(careStartDate.trim())) {
			nextErrors.careStartDate = 'Use YYYY-MM-DD format.';
		}

		if (!coordinatorId.trim()) {
			nextErrors.coordinatorId = 'Coordinator is required.';
		} else if (!uuidRegex.test(coordinatorId.trim())) {
			nextErrors.coordinatorId = 'Coordinator ID must be a valid UUID.';
		}

		fieldErrors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	};

	const handleCancel = () => {
		resetForm();
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

	async function handleSubmit() {
		errorMessage = '';
		if (!clientId) {
			errorMessage = 'Client is missing. Please close and reopen the form.';
			return;
		}

		if (!validate()) return;

		isLoading = true;

		try {
			const payload: PutClientInCareRequest = {
				care_start_date: careStartDate.trim(),
				coordinator_employee_id: coordinatorId.trim(),
				placed_in_care_at: placedInCareAt.trim() || undefined,
				reason: reason.trim() || undefined
			};

			await putClientInCare(clientId, payload);
			resetForm();
			open = false;
			onSuccess?.();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to put client in care.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Modal
	bind:open
	title="Put Client In Care"
	description="Move this client from waiting list to care lifecycle and assign the main coordinator."
	class="max-w-xl"
>
	<div class="space-y-5">
		<DatePicker
			label="Care Start Date"
			bind:value={careStartDate}
			error={fieldErrors.careStartDate}
		/>

		<SearchSelect
			label="Main Coordinator"
			bind:value={coordinatorId}
			bind:displayValue={coordinatorName}
			error={fieldErrors.coordinatorId}
			loadOptions={loadCoordinatorOptions}
			labelFn={(employee) => `${employee.first_name} ${employee.last_name}`}
			valueFn={(employee) => employee.id}
			placeholder="Select coordinator..."
			searchPlaceholder="Search employees..."
		/>

		<DateTimePicker label="Placed In Care At (Optional)" bind:value={placedInCareAt} />

		<Textarea
			label="Reason (Optional)"
			bind:value={reason}
			placeholder="e.g. approved in intake review"
			rows={3}
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
			<Button onclick={handleSubmit} {isLoading}>Put In Care</Button>
		</div>
	{/snippet}
</Modal>
