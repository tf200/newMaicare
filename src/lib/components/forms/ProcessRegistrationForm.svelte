<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import { processRegistrationForm } from '$lib/api/registration';
	import type { ProcessRegistrationRequest } from '$lib/types/api';
	import { Trash2, Plus } from 'lucide-svelte';

	interface Props {
		open?: boolean;
		registrationId: string;
		onProcessed?: () => void;
	}

	let { open = $bindable(false), registrationId, onProcessed }: Props = $props();

	let admissionType = $state('crisis_admission');
	let location = $state('');
	let proposedDates = $state<string[]>(['']);
	let isLoading = $state(false);
	let errorMessage = $state('');
	let fieldErrors = $state<{ location?: string; dates?: string }>({});

	const admissionOptions = [
		{ value: 'crisis_admission', label: 'Crisis Admission' },
		{ value: 'regular_placement', label: 'Regular Placement' }
	];

	const resetForm = () => {
		admissionType = 'crisis_admission';
		location = '';
		proposedDates = [''];
		errorMessage = '';
		fieldErrors = {};
	};

	const addDate = () => {
		proposedDates = [...proposedDates, ''];
	};

	const removeDate = (index: number) => {
		if (proposedDates.length > 1) {
			proposedDates = proposedDates.filter((_, idx) => idx !== index);
		}
	};

	const validate = () => {
		const nextErrors: { location?: string; dates?: string } = {};
		if (!location.trim()) nextErrors.location = 'Location is required.';

		const validDates = proposedDates.filter((d) => d.trim() !== '');
		if (validDates.length === 0) {
			nextErrors.dates = 'At least one proposed date is required.';
		}

		fieldErrors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	};

	const handleCancel = () => {
		resetForm();
		open = false;
	};

	async function handleSubmit() {
		errorMessage = '';
		if (!validate()) return;
		isLoading = true;

		try {
			// Convert local datetime inputs to ISO strings for the API
			const formattedDates = proposedDates
				.filter((d) => d.trim() !== '')
				.map((d) => new Date(d).toISOString());

			const payload: ProcessRegistrationRequest = {
				admission_type: admissionType,
				intake_appointment_location: location.trim(),
				proposed_dates: formattedDates
			};

			await processRegistrationForm(registrationId, payload);
			resetForm();
			open = false;
			onProcessed?.();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to process registration.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Modal
	bind:open
	title="Process Registration"
	description="Propose intake dates and confirm admission details."
	class="max-w-xl"
>
	<div class="space-y-6">
		<!-- Admission Type -->
		<div class="space-y-2">
			<label for="admission-type" class="ml-1 text-sm font-semibold text-text-muted">
				Admission Type
			</label>
			<select
				id="admission-type"
				bind:value={admissionType}
				class="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-text outline-hidden transition-all focus:ring-2 focus:ring-brand/20"
			>
				{#each admissionOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<!-- Location -->
		<Input
			label="Location"
			placeholder="e.g. Main Office, Room 3B"
			bind:value={location}
			error={fieldErrors.location}
		/>

		<!-- Proposed Dates -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="ml-1 text-sm font-semibold text-text-muted">Proposed Dates</span>
				<Button variant="ghost" onclick={addDate} class="h-8 gap-1">
					<Plus class="h-3.5 w-3.5" /> Add Date
				</Button>
			</div>

			<div class="space-y-2">
				{#each proposedDates as date, index (index)}
					<div class="flex gap-2">
						<div class="w-full">
							<DateTimePicker bind:value={proposedDates[index]} />
						</div>
						{#if proposedDates.length > 1}
							<button
								onclick={() => removeDate(index)}
								class="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:bg-error/10 hover:text-error"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
			{#if fieldErrors.dates}
				<p class="ml-1 text-xs font-medium text-error">{fieldErrors.dates}</p>
			{/if}
		</div>

		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleSubmit} {isLoading}>Confirm & Process</Button>
		</div>
	{/snippet}
</Modal>
