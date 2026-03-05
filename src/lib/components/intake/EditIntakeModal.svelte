<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import TextArea from '$lib/components/ui/Textarea.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { listSenders } from '$lib/api/senders';
	import { listLocations } from '$lib/api/locations';
	import { intakes } from '$lib/api/intakes';
	import { Calendar, FileText, Loader2, User, Activity, Save } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type {
		GetIntakeFormResponse,
		IntakeCareType,
		IntakeParticipantsEnum,
		IntakeConclusionEnum
	} from '$lib/types/api';

	interface Props {
		open?: boolean;
		intake: GetIntakeFormResponse;
		onSave?: () => Promise<void> | void;
	}

	let { open = $bindable(false), intake, onSave }: Props = $props();

	let isLoading = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	// Form State
	let dateOfIntake = $state('');
	let careType = $state<IntakeCareType>('protected_living');
	let intakeParticipants = $state<IntakeParticipantsEnum[]>([]);
	let familySituation = $state('');
	let psychologicalState = $state('');
	let selfSufficiency = $state(0);
	let evaluationIntervalWeeks = $state(1);
	let senderId = $state('');
	let senderName = $state('');
	let assignedLocationId = $state('');
	let riskAssessment = $state('');
	let intakeConclusion = $state<IntakeConclusionEnum>('suitable');
	let intakeConclusionNotes = $state('');
	let signature = $state('');

	const syncFormFromIntake = () => {
		dateOfIntake = intake.date_of_intake;
		careType = intake.care_type;
		intakeParticipants = intake.intake_participants || [];
		familySituation = intake.family_situation || '';
		psychologicalState = intake.psychological_state || '';
		selfSufficiency = intake.self_sufficiency;
		evaluationIntervalWeeks = intake.evaluation_intervals_weeks;
		senderId = intake.sender_id || '';
		senderName = intake.sender_name || '';
		assignedLocationId = intake.assigned_location_id || '';
		riskAssessment = intake.risk_assessment || '';
		intakeConclusion = intake.intake_conclusion;
		intakeConclusionNotes = intake.intake_conclusion_notes || '';
		signature = intake.signature || '';
		error = '';
		fieldErrors = {};
	};

	$effect(() => {
		if (open) {
			syncFormFromIntake();
		}
	});

	const careTypeOptions = [
		{ value: 'protected_living', label: 'Protected Living' },
		{ value: 'training_center', label: 'Training Center' },
		{ value: 'supported_independent_living', label: 'Supported Independent Living' },
		{ value: 'ambulatory_support', label: 'Ambulatory Support' },
		{ value: 'other', label: 'Other' }
	];

	const participantOptions = [
		{ value: 'client', label: 'Client' },
		{ value: 'referrer', label: 'Referrer' },
		{ value: 'parents/guardians', label: 'Parents/Guardians' },
		{ value: 'care_coordinator', label: 'Care Coordinator' },
		{ value: 'other', label: 'Other' }
	];

	const conclusionOptions = [
		{ value: 'suitable', label: 'Suitable' },
		{ value: 'unsuitable', label: 'Unsuitable' },
		{ value: 'further_investigation', label: 'Further Investigation' },
		{ value: 'possible_palcement_date', label: 'Possible Placement Date' },
		{ value: 'other', label: 'Other' }
	];

	const validate = () => {
		const errors: Record<string, string> = {};
		if (!familySituation) errors.familySituation = 'Family situation is required';
		if (!psychologicalState) errors.psychologicalState = 'Psychological state is required';
		if (selfSufficiency < 0 || selfSufficiency > 100)
			errors.selfSufficiency = 'Must be between 0-100';
		if (evaluationIntervalWeeks <= 0) errors.evaluationIntervalWeeks = 'Must be at least 1 week';
		if (!dateOfIntake) errors.dateOfIntake = 'Date is required';
		if (!careType) errors.careType = 'Care type is required';
		if (intakeParticipants.length === 0)
			errors.intakeParticipants = 'At least one participant is required';
		if (!senderId) errors.senderId = 'Sender is required';
		if (!assignedLocationId) errors.assignedLocationId = 'Location is required';
		if (!riskAssessment) errors.riskAssessment = 'Risk assessment is required';
		if (!intakeConclusion) errors.intakeConclusion = 'Conclusion is required';
		if (!intakeConclusionNotes) errors.intakeConclusionNotes = 'Notes are required';
		if (!signature) errors.signature = 'Signature is required';

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	};

	const handleSave = async () => {
		if (isLoading) return;
		if (!validate()) {
			error = 'Please fix the errors before saving.';
			return;
		}

		isLoading = true;
		error = '';

		try {
			await intakes.update(intake.id, {
				date_of_intake: dateOfIntake,
				care_type: careType,
				intake_participants: intakeParticipants,
				family_situation: familySituation,
				psychological_state: psychologicalState,
				self_sufficiency: Number(selfSufficiency),
				evaluation_interval_weeks: Number(evaluationIntervalWeeks),
				sender_id: senderId,
				assigned_location_id: assignedLocationId,
				risk_assessment: riskAssessment,
				intake_conclusion: intakeConclusion,
				intake_conclusion_notes: intakeConclusionNotes,
				signature
			});
			open = false;
			await onSave?.();
		} catch (e) {
			console.error(e);
			error = e instanceof Error ? e.message : 'Failed to update intake.';
		} finally {
			isLoading = false;
		}
	};
</script>

{#snippet senderItem(option: any)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex items-center gap-1.5 text-xs text-text-muted">
			{#if option.city}
				<span>{option.city}</span>
				<span>•</span>
			{/if}
			<span class="capitalize">{option.types?.replace(/_/g, ' ') || 'Sender'}</span>
		</div>
	</div>
{/snippet}

{#snippet locationItem(option: any)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="flex flex-col gap-0.5 text-xs text-text-muted">
			<span>{option.street} {option.house_number}, {option.city}</span>
			<span class="{option.available > 0 ? 'text-emerald-600' : 'text-rose-600'} font-medium">
				{option.available} spots available
			</span>
		</div>
	</div>
{/snippet}

<Modal
	bind:open
	title={m.edit_intake_form()}
	description={m.intake_for_client({
		name: `${intake.client_first_name} ${intake.client_last_name}`.trim()
	})}
	size="full"
	class="max-w-[80vw] overflow-hidden"
>
	<div class="flex flex-col gap-6">
		<section class="w-full space-y-8">
			{#if error}
				<div
					class="animate-in fade-in slide-in-from-top-2 rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm font-medium text-rose-700 shadow-sm"
				>
					{error}
				</div>
			{/if}

			<div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<!-- Client Situation Section -->
				<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
					<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
						<div class="rounded-xl bg-brand/10 p-2.5 text-brand">
							<User class="h-6 w-6" />
						</div>
						<div>
							<h2 class="text-xl font-bold text-text">{m.client_situation()}</h2>
							<p class="text-sm text-text-subtle">{m.client_situation_description()}</p>
						</div>
					</div>

					<div class="grid gap-6 lg:grid-cols-2">
						<div class="lg:col-span-2">
							<TextArea
								label={m.family_situation()}
								bind:value={familySituation}
								error={fieldErrors.familySituation}
								placeholder={m.family_situation_placeholder()}
								rows={4}
							/>
						</div>
						<div class="lg:col-span-2">
							<TextArea
								label={m.psychological_state()}
								bind:value={psychologicalState}
								error={fieldErrors.psychologicalState}
								placeholder={m.psychological_state_placeholder()}
								rows={4}
							/>
						</div>
						<div class="lg:col-span-1">
							<Input
								type="number"
								label={m.self_sufficiency_score_range()}
								bind:value={selfSufficiency}
								error={fieldErrors.selfSufficiency}
								min="0"
								max="100"
							/>
						</div>
					</div>
				</div>

				<!-- Intake Details Section -->
				<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
					<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
						<div class="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
							<FileText class="h-6 w-6" />
						</div>
						<div>
							<h2 class="text-xl font-bold text-text">{m.logistics_placement()}</h2>
							<p class="text-sm text-text-subtle">{m.logistics_assignment_description()}</p>
						</div>
					</div>

					<div class="grid gap-6 lg:grid-cols-2">
						<div class="space-y-1.5">
							<label class="flex items-center gap-1.5 text-sm font-semibold text-text-muted">
								<Calendar class="h-3.5 w-3.5" />
								{m.intake_date()}
							</label>
							<DateTimePicker bind:value={dateOfIntake} error={fieldErrors.dateOfIntake} />
						</div>

						<div>
							<Input
								label={m.signature_full_name()}
								bind:value={signature}
								error={fieldErrors.signature}
								placeholder={m.signature_full_name_placeholder()}
							/>
						</div>

						<div class="space-y-1.5">
							<label for="care-type" class="text-sm font-semibold text-text-muted">
								{m.care_type()}
							</label>
							<div class="relative">
								<select
									id="care-type"
									bind:value={careType}
									class="w-full appearance-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text transition-all outline-none hover:bg-surface/80 focus:ring-2 focus:ring-brand/20 {fieldErrors.careType
										? 'border-error'
										: ''}"
								>
									{#each careTypeOptions as option (option.value)}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
								<div
									class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-muted"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
									>
								</div>
							</div>
							{#if fieldErrors.careType}
								<p class="ml-1 text-xs font-medium text-error">{fieldErrors.careType}</p>
							{/if}
						</div>

						<div class="lg:col-span-2">
							<MultiSelect
								label={m.participants()}
								bind:value={intakeParticipants}
								options={participantOptions}
								error={fieldErrors.intakeParticipants}
								placeholder={m.select_participants_placeholder()}
							/>
						</div>

						<SearchSelect
							label={m.referrer_sender()}
							bind:value={senderId}
							bind:displayValue={senderName}
							error={fieldErrors.senderId}
							loadOptions={async (query) => {
								const res = await listSenders({ search: query, pageSize: 50 });
								return res.data.results;
							}}
							labelFn={(s) => s.name}
							valueFn={(s) => s.id}
							item={senderItem}
							placeholder={m.select_sender_placeholder()}
						/>

						<SearchSelect
							label={m.assigned_location()}
							bind:value={assignedLocationId}
							error={fieldErrors.assignedLocationId}
							loadOptions={async (query) => {
								const res = await listLocations({ search: query, pageSize: 50 });
								return res.data.results;
							}}
							labelFn={(loc) => `${loc.name} (${loc.city})`}
							valueFn={(loc) => loc.id}
							item={locationItem}
							placeholder={m.select_location_placeholder()}
						/>
					</div>
				</div>

				<!-- Conclusion + Decision Section -->
				<div class="grid gap-6 lg:col-span-2 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
					<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
						<div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
							<div class="rounded-xl bg-purple-500/10 p-2.5 text-purple-600">
								<Activity class="h-6 w-6" />
							</div>
							<div>
								<h2 class="text-xl font-bold text-text">{m.initial_assessment()}</h2>
								<p class="text-sm text-text-subtle">{m.initial_assessment_description()}</p>
							</div>
						</div>

						<div class="space-y-6">
							<TextArea
								label={m.risk_assessment()}
								bind:value={riskAssessment}
								error={fieldErrors.riskAssessment}
								placeholder={m.risk_assessment_placeholder()}
								rows={4}
							/>

							<div class="grid gap-6 md:grid-cols-2">
								<div class="space-y-1.5">
									<label for="intake-conclusion" class="text-sm font-semibold text-text-muted"
										>{m.intake_conclusion()}</label
									>
									<div class="relative">
										<select
											id="intake-conclusion"
											bind:value={intakeConclusion}
											class="w-full appearance-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text transition-all outline-none hover:bg-surface/80 focus:ring-2 focus:ring-brand/20 {fieldErrors.intakeConclusion
												? 'border-error'
												: ''}"
										>
											{#each conclusionOptions as option (option.value)}
												<option value={option.value}>{option.label}</option>
											{/each}
										</select>
										<div
											class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-muted"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
											>
										</div>
									</div>
									{#if fieldErrors.intakeConclusion}
										<p class="ml-1 text-xs font-medium text-error">
											{fieldErrors.intakeConclusion}
										</p>
									{/if}
								</div>
								<div>
									<Input
										type="number"
										label={m.evaluation_interval_weeks()}
										bind:value={evaluationIntervalWeeks}
										error={fieldErrors.evaluationIntervalWeeks}
										min="1"
										placeholder={m.placeholder_weeks_example()}
									/>
								</div>
								<div class="md:col-span-2">
									<TextArea
										label={m.additional_notes()}
										bind:value={intakeConclusionNotes}
										error={fieldErrors.intakeConclusionNotes}
										placeholder={m.additional_notes_placeholder()}
										rows={3}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-end gap-3">
			<Button variant="ghost" onclick={() => (open = false)} disabled={isLoading}
				>{m.cancel()}</Button
			>
			<Button onclick={handleSave} disabled={isLoading} class="gap-2">
				{#if isLoading}
					<Loader2 class="h-4 w-4 animate-spin" />
				{:else}
					<Save class="h-4 w-4" />
				{/if}
				{m.save_changes()}
			</Button>
		</div>
	{/snippet}
</Modal>
