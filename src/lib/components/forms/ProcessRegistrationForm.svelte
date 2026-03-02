<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import { processRegistrationForm } from '$lib/api/registration';
	import type { ProcessRegistrationRequest } from '$lib/types/api';
	import { Trash2, Plus } from 'lucide-svelte';
	import {
		ProcessRegistrationSchema,
		type ProcessRegistrationInput
	} from '$lib/schemas/registration';
	import { formatFormError } from '$lib/utils/form-errors';

	interface Props {
		open?: boolean;
		registrationId: string;
		onProcessed?: () => void;
	}

	let { open = $bindable(false), registrationId, onProcessed }: Props = $props();

	let errorMessage = $state('');
	const formId = 'process-registration-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				admission_type: 'crisis_admission',
				intake_appointment_location: '',
				proposed_dates: ['']
			} as any,
			valibotClient(ProcessRegistrationSchema)
		),
		{
			validators: valibotClient(ProcessRegistrationSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid) {
					try {
						const payload: ProcessRegistrationRequest = {
							admission_type: form.data.admission_type,
							intake_appointment_location: form.data.intake_appointment_location.trim(),
							proposed_dates: form.data.proposed_dates.map((d: string) => new Date(d).toISOString())
						};

						await processRegistrationForm(registrationId, payload);
						reset();
						open = false;
						onProcessed?.();
					} catch (error) {
						errorMessage =
							error instanceof Error ? error.message : 'Failed to process registration.';
					}
				}
			}
		}
	);

	const admissionOptions = [
		{ value: 'crisis_admission', label: 'Crisis Admission' },
		{ value: 'regular_placement', label: 'Regular Placement' }
	];

	const addDate = () => {
		$form.proposed_dates = [...$form.proposed_dates, ''];
	};

	const removeDate = (index: number) => {
		if ($form.proposed_dates.length > 1) {
			$form.proposed_dates = $form.proposed_dates.filter(
				(_date: string, idx: number) => idx !== index
			);
		}
	};

	const handleCancel = () => {
		reset();
		open = false;
	};
</script>

<Modal
	bind:open
	title="Process Registration"
	description="Propose intake dates and confirm admission details."
	class="max-w-xl"
>
	<form id={formId} use:enhance class="space-y-6">
		<!-- Admission Type -->
		<div class="space-y-2">
			<label for="admission-type" class="ml-1 text-sm font-semibold text-text-muted">
				Admission Type
			</label>
			<select
				id="admission-type"
				bind:value={$form.admission_type}
				class="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-text outline-hidden transition-all focus:ring-2 focus:ring-brand/20"
			>
				{#each admissionOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			{#if formatFormError($errors.admission_type)}
				<p class="ml-1 text-xs font-medium text-error">{formatFormError($errors.admission_type)}</p>
			{/if}
		</div>

		<!-- Location -->
		<Input
			label="Location"
			placeholder="e.g. Main Office, Room 3B"
			bind:value={$form.intake_appointment_location}
			error={formatFormError($errors.intake_appointment_location)}
		/>

		<!-- Proposed Dates -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="ml-1 text-sm font-semibold text-text-muted">Proposed Dates</span>
				<Button variant="ghost" onclick={addDate} type="button" class="h-8 gap-1">
					<Plus class="h-3.5 w-3.5" /> Add Date
				</Button>
			</div>

			<div class="space-y-2">
				{#each $form.proposed_dates as date, index (index)}
					<div class="flex gap-2">
						<div class="w-full">
							<DateTimePicker
								bind:value={$form.proposed_dates[index]}
								error={formatFormError($errors.proposed_dates?.[index])}
							/>
						</div>
						{#if $form.proposed_dates.length > 1}
							<button
								type="button"
								onclick={() => removeDate(index)}
								class="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:bg-error/10 hover:text-error"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
			{#if $errors.proposed_dates && typeof $errors.proposed_dates === 'string'}
				<p class="ml-1 text-xs font-medium text-error">{$errors.proposed_dates}</p>
			{/if}
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
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>Cancel</Button>
			<Button form={formId} type="submit" isLoading={$delayed}>Confirm & Process</Button>
		</div>
	{/snippet}
</Modal>
