<script lang="ts">
	import { goto } from '$app/navigation';
	import { intakes } from '$lib/api/intakes';
	import { listSenders } from '$lib/api/senders';
	import { listLocations } from '$lib/api/locations';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import TextArea from '$lib/components/ui/Textarea.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import {
		ArrowLeft,
		Loader2,
		Calendar,
		Users,
		Building2,
		User,
		FileText,
		Activity
	} from 'lucide-svelte';
	import type {
		OrganizationLocation,
		SenderListItem,
		IntakeCareType,
		IntakeParticipantsEnum,
		IntakeConclusionEnum
	} from '$lib/types/api';

	let { data } = $props();
	const registration = $derived(data.registration);

	let isLoading = $state(false);
	let error = $state('');

	// Form State
	let dateOfIntake = $state(new Date().toISOString());
	let careType = $state<IntakeCareType>('protected_living');
	let intakeParticipants = $state<IntakeParticipantsEnum[]>([]);
	let familySituation = $state('');
	let psychologicalState = $state('');
	let selfSufficiency = $state(0);
	let senderId = $state('');
	let senderName = $state('');
	let assignedLocationId = $state('');
	let riskAssessment = $state('');
	let intakeConclusion = $state<IntakeConclusionEnum>('suitable');
	let intakeConclusionNotes = $state('');

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

	async function handleSubmit() {
		if (!assignedLocationId) {
			error = 'Please select a location.';
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}
		if (!senderId) {
			error = 'Please select a sender.';
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}

		isLoading = true;
		error = '';

		try {
			const res = await intakes.create({
				registration_form_id: registration.id,
				date_of_intake: dateOfIntake,
				care_type: careType,
				intake_participants: intakeParticipants,
				family_situation: familySituation || undefined,
				psychological_state: psychologicalState || undefined,
				self_sufficiency: Number(selfSufficiency),
				sender_id: senderId || undefined,
				assigned_location_id: assignedLocationId || undefined,
				risk_assessment: riskAssessment || undefined,
				intake_conclusion: intakeConclusion,
				intake_conclusion_notes: intakeConclusionNotes || undefined,
				signature: '' // Optional
			});

			// Navigate to assessments
			goto(`/intakes/${res.data.id}/assessments`);
		} catch (e) {
			console.error(e);
			error = e instanceof Error ? e.message : 'Failed to create intake.';
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} finally {
			isLoading = false;
		}
	}

	// Pre-fill from registration if applicable
	$effect(() => {
		if (registration) {
			if (registration.risk_additional_notes) {
				riskAssessment = registration.risk_additional_notes;
			}
			// Map other fields if possible
		}
	});
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

<div class="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
	<!-- Header -->
	<header class="flex items-start gap-4 border-b border-border/50 pb-6">
		<button
			onclick={() => history.back()}
			class="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-subtle transition-all hover:border-zinc-300 hover:bg-zinc-100 hover:text-text"
		>
			<ArrowLeft class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
		</button>
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight text-text">Start Formal Intake</h1>
			<p class="text-lg text-text-subtle">
				For <span class="font-medium text-text"
					>{registration.client_first_name} {registration.client_last_name}</span
				>
			</p>
		</div>
	</header>

	{#if error}
		<div
			class="animate-in fade-in slide-in-from-top-2 rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm font-medium text-rose-700 shadow-sm"
		>
			{error}
		</div>
	{/if}

	<div class="grid gap-8 lg:grid-cols-[1fr_360px]">
		<!-- Main Content -->
		<div class="space-y-8">
			<!-- Client Situation -->
			<section class="space-y-5">
				<div class="flex items-center gap-2 text-text">
					<div class="rounded-lg bg-brand/10 p-2 text-brand">
						<User class="h-5 w-5" />
					</div>
					<h2 class="text-xl font-bold">Client Situation</h2>
				</div>

				<div
					class="space-y-6 rounded-3xl border border-border bg-surface/50 p-6 shadow-sm backdrop-blur-sm"
				>
					<TextArea
						label="Family Situation"
						bind:value={familySituation}
						placeholder="Describe the family context, relationships, and home environment..."
						rows={4}
					/>
					<TextArea
						label="Psychological State"
						bind:value={psychologicalState}
						placeholder="Describe current psychological state, history, and observations..."
						rows={4}
					/>
					<Input
						type="number"
						label="Self Sufficiency Score (0-100)"
						bind:value={selfSufficiency}
						min="0"
						max="100"
					/>
				</div>
			</section>

			<!-- Assessment & Conclusion -->
			<section class="space-y-5">
				<div class="flex items-center gap-2 text-text">
					<div class="rounded-lg bg-purple-500/10 p-2 text-purple-600">
						<Activity class="h-5 w-5" />
					</div>
					<h2 class="text-xl font-bold">Assessment & Conclusion</h2>
				</div>

				<div
					class="space-y-6 rounded-3xl border border-border bg-surface/50 p-6 shadow-sm backdrop-blur-sm"
				>
					<TextArea
						label="Risk Assessment"
						bind:value={riskAssessment}
						placeholder="Identify potential risks (aggression, self-harm, addiction, etc.)..."
						rows={4}
					/>
					<div class="space-y-1.5">
						<label for="intake-conclusion" class="text-sm font-semibold text-text-muted"
							>Intake Conclusion</label
						>
						<div class="relative">
							<select
								id="intake-conclusion"
								bind:value={intakeConclusion}
								class="w-full appearance-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text transition-all outline-none hover:bg-surface/80 focus:ring-2 focus:ring-brand/20"
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
					</div>
					<TextArea
						label="Additional Notes"
						bind:value={intakeConclusionNotes}
						placeholder="Any other relevant information..."
						rows={3}
					/>
				</div>
			</section>
		</div>

		<!-- Sidebar: Logistics & Assignment -->
		<div class="flex flex-col gap-6">
			<!-- Logistics Card -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2 text-text">
					<FileText class="h-5 w-5 text-text-muted" />
					<h2 class="text-lg font-bold">Intake Details</h2>
				</div>

				<div class="space-y-4">
					<div class="space-y-1.5">
						<label class="flex items-center gap-1.5 text-sm font-semibold text-text-muted">
							<Calendar class="h-3.5 w-3.5" /> Date of Intake
						</label>
						<DateTimePicker bind:value={dateOfIntake} />
					</div>

					<div class="space-y-1.5">
						<label for="care-type" class="text-sm font-semibold text-text-muted">Care Type</label>
						<div class="relative">
							<select
								id="care-type"
								bind:value={careType}
								class="w-full appearance-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text transition-all outline-none hover:bg-surface/80 focus:ring-2 focus:ring-brand/20"
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
					</div>

					<div class="space-y-1.5">
						<MultiSelect
							label="Participants"
							bind:value={intakeParticipants}
							options={participantOptions}
							placeholder="Select participants..."
						/>
					</div>
				</div>
			</div>

			<!-- Assignment Card -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2 text-text">
					<Building2 class="h-5 w-5 text-text-muted" />
					<h2 class="text-lg font-bold">Assignment</h2>
				</div>

				<div class="space-y-4">
					<div class="space-y-1.5">
						<SearchSelect
							label="Sender / Referrer"
							bind:value={senderId}
							bind:displayValue={senderName}
							loadOptions={async (query) => {
								const res = await listSenders({ search: query, pageSize: 50 });
								return res.data.results;
							}}
							labelFn={(s) => s.name}
							valueFn={(s) => s.id}
							item={senderItem}
							placeholder="Select sender..."
						/>
					</div>

					<div class="space-y-1.5">
						<SearchSelect
							label="Assign Location"
							bind:value={assignedLocationId}
							loadOptions={async (query) => {
								const res = await listLocations({ search: query, pageSize: 50 });
								return res.data.results;
							}}
							labelFn={(loc) => `${loc.name} (${loc.city})`}
							valueFn={(loc) => loc.id}
							item={locationItem}
							placeholder="Select location..."
						/>
					</div>
				</div>
			</div>

			<!-- Submit Action -->
			<div class="sticky bottom-6 pt-2">
				<Button
					onclick={handleSubmit}
					disabled={isLoading}
					class="h-12 w-full text-base shadow-lg shadow-brand/20 transition-all hover:shadow-brand/30"
				>
					{#if isLoading}
						<Loader2 class="mr-2 h-5 w-5 animate-spin" /> Creating Intake...
					{:else}
						Create Intake
					{/if}
				</Button>
			</div>
		</div>
	</div>
</div>
