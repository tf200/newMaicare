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
	import { getClientCoordinator, putClientInCare } from '$lib/api/clients';
	import { ApiClientError } from '$lib/api/client';
	import type { GetClientCoordinator, PutClientInCareRequest } from '$lib/types/api';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { PutClientInCareSchema, type PutClientInCareSchemaInput } from '$lib/schemas/client-care';
	import { m } from '$lib/paraglide/messages';
	import { getToastState } from '$lib/state/toast.svelte';

	interface Props {
		open?: boolean;
		clientId?: string | null;
		/** Pass null when the caller already knows the client has no coordinator. */
		coordinatorSnapshot?: GetClientCoordinator | null;
		onSuccess?: () => void;
	}

	let {
		open = $bindable(false),
		clientId = null,
		coordinatorSnapshot = undefined,
		onSuccess
	}: Props = $props();
	const toast = getToastState();
	const auth = getAuthState();

	let coordinatorName = $state('');
	let errorMessage = $state('');
	let initializationError = $state(false);
	let initializing = $state(false);
	let initialCoordinatorEmployeeId = $state<string | null>(null);
	let initializedKey = $state<string | null>(null);
	let lastOpen = false;
	let requestSequence = 0;
	let requestController: AbortController | undefined;
	const formId = 'put-client-in-care-form';

	const { form, errors, enhance, delayed, submitting, reset } = superForm(
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
				if (form.valid && clientId && canSubmit) {
					errorMessage = '';
					try {
						const payload: PutClientInCareRequest = {
							care_start_date: form.data.care_start_date.trim(),
							coordinator_employee_id: form.data.coordinator_employee_id.trim(),
							placed_in_care_at: trimToUndefined(form.data.placed_in_care_at),
							reason: trimToUndefined(form.data.reason)
						};

						await putClientInCare(clientId, payload);
						toast.success(m.client_put_in_care_success());
						clearTransientState();
						open = false;
						onSuccess?.();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : m.failed_put_client_in_care();
					}
				}
			}
		}
	);

	const clearTransientState = () => {
		requestSequence += 1;
		requestController?.abort();
		requestController = undefined;
		reset();
		coordinatorName = '';
		errorMessage = '';
		initializationError = false;
		initializing = false;
		initialCoordinatorEmployeeId = null;
		initializedKey = null;
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

	const hasExistingCoordinator = $derived(Boolean(initialCoordinatorEmployeeId));
	const hasUnsavedChanges = $derived(
		$form.care_start_date.trim() !== '' ||
			$form.coordinator_employee_id !== (initialCoordinatorEmployeeId ?? '') ||
			($form.placed_in_care_at ?? '').trim() !== '' ||
			($form.reason ?? '').trim() !== ''
	);
	const canReplaceCoordinator = $derived(
		auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_UPDATE)
	);
	const canViewCoordinator = $derived(
		auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_VIEW)
	);
	const canCreateCoordinator = $derived(
		auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_CREATE)
	);
	const canSubmit = $derived(
		auth.hasPermission(PERMISSIONS.CLIENT.STATUS_UPDATE) &&
			canViewCoordinator &&
			(hasExistingCoordinator || canCreateCoordinator)
	);

	const canDiscard = () =>
		!hasUnsavedChanges || window.confirm(m.discard_put_client_in_care_changes_confirmation());

	const handleCancel = () => {
		if (!canDiscard()) return;
		clearTransientState();
		open = false;
	};

	const handleClose = () => {
		if (!canDiscard()) {
			open = true;
			return;
		}
		clearTransientState();
	};

	const resetFormFields = () => {
		reset({
			data: {
				care_start_date: '',
				coordinator_employee_id: '',
				placed_in_care_at: '',
				reason: ''
			}
		});
		coordinatorName = '';
	};

	const initializeCoordinator = async (
		id: string,
		snapshot: GetClientCoordinator | null | undefined
	) => {
		const sequence = ++requestSequence;
		requestController?.abort();
		requestController = new AbortController();
		initializing = true;
		initializationError = false;
		errorMessage = '';
		resetFormFields();

		try {
			let coordinatorEmployeeId = snapshot?.employee_id ?? null;
			let coordinatorDisplayName = snapshot
				? `${snapshot.first_name ?? ''} ${snapshot.last_name ?? ''}`.trim()
				: '';
			if (snapshot === undefined) {
				try {
					const response = await getClientCoordinator(id, { signal: requestController.signal });
					coordinatorEmployeeId = response.data.employee_id;
					coordinatorDisplayName = response.data.employee_name;
				} catch (error) {
					if (error instanceof ApiClientError && error.status === 404) {
						coordinatorEmployeeId = null;
						coordinatorDisplayName = '';
					} else throw error;
				}
			}
			if (sequence !== requestSequence) return;
			initialCoordinatorEmployeeId = coordinatorEmployeeId;
			reset({
				data: {
					care_start_date: '',
					coordinator_employee_id: coordinatorEmployeeId ?? '',
					placed_in_care_at: '',
					reason: ''
				}
			});
			coordinatorName = coordinatorDisplayName;
		} catch (error) {
			if (
				sequence !== requestSequence ||
				(error instanceof DOMException && error.name === 'AbortError')
			)
				return;
			initializationError = true;
		} finally {
			if (sequence === requestSequence) initializing = false;
		}
	};

	$effect(() => {
		const key = `${clientId ?? ''}:${coordinatorSnapshot?.employee_id ?? 'unassigned'}`;
		if (!open) {
			if (lastOpen) clearTransientState();
			lastOpen = false;
			return;
		}
		if (!clientId || (lastOpen && initializedKey === key)) return;
		lastOpen = true;
		initializedKey = key;
		void initializeCoordinator(clientId, coordinatorSnapshot);
	});
</script>

<Modal
	bind:open
	title={m.put_client_in_care()}
	description={m.put_client_in_care_description()}
	closeLabel={m.close()}
	dismissible={!$submitting}
	onClose={handleClose}
	class="max-w-xl"
>
	<form id={formId} use:enhance class="space-y-5">
		<DatePicker
			label={m.care_start_date()}
			bind:value={$form.care_start_date}
			error={formatFormError($errors.care_start_date)}
		/>

		<SearchSelect
			label={m.main_coordinator()}
			bind:value={$form.coordinator_employee_id}
			bind:displayValue={coordinatorName}
			error={formatFormError($errors.coordinator_employee_id)}
			loadOptions={loadCoordinatorOptions}
			labelFn={(employee) => `${employee.first_name} ${employee.last_name}`}
			valueFn={(employee) => employee.id}
			placeholder={m.select_coordinator()}
			searchPlaceholder={m.search_employees()}
			disabled={initializing ||
				(hasExistingCoordinator ? !canReplaceCoordinator : !canCreateCoordinator)}
		/>
		{#if initializing}
			<p class="text-xs text-text-muted" role="status">{m.loading_client_details()}</p>
		{:else if initializationError}
			<div
				class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
				role="alert"
			>
				{m.failed_load_client_details()}
				<button
					type="button"
					class="ml-2 font-semibold underline"
					onclick={() => void initializeCoordinator(clientId ?? '', coordinatorSnapshot)}
				>
					{m.retry()}
				</button>
			</div>
		{:else if !hasExistingCoordinator && !canCreateCoordinator}
			<p class="text-xs text-text-muted">{m.coordinator_assignment_permission_required()}</p>
		{:else if hasExistingCoordinator && !canReplaceCoordinator}
			<p class="text-xs text-text-muted">{m.coordinator_replacement_permission_required()}</p>
		{/if}

		<DateTimePicker label={m.placed_in_care_at_optional()} bind:value={$form.placed_in_care_at} />

		<Textarea
			label={m.reason_optional()}
			bind:value={$form.reason}
			placeholder={m.placeholder_care_reason()}
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
			<Button variant="ghost" onclick={handleCancel} disabled={$submitting}>{m.cancel()}</Button>
			<Button
				form={formId}
				type="submit"
				isLoading={$delayed}
				disabled={$submitting || initializing || initializationError || !canSubmit}
				>{m.put_in_care()}</Button
			>
		</div>
	{/snippet}
</Modal>
