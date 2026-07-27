<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { untrack } from 'svelte';
	import {
		Briefcase,
		Building,
		Edit3,
		HeartPulse,
		MapPin,
		Plus,
		RotateCcw,
		ShieldAlert,
		Target,
		Trash2,
		User,
		X
	} from 'lucide-svelte';
	import { updateRegistrationForm } from '$lib/api/registration';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { m } from '$lib/paraglide/messages';
	import {
		createRegistrationEditSchema,
		type RegistrationEditInput
	} from '$lib/schemas/registration';
	import type {
		EducationLevel,
		GetRegistrationFormResponse,
		UpdateRegistrationFormRequest
	} from '$lib/types/api';
	import { formatFormError } from '$lib/utils/form-errors';

	interface Props {
		registration: GetRegistrationFormResponse;
		onUpdated: () => void | Promise<void>;
		onEditingChange: (editing: boolean) => void;
	}

	let { registration, onUpdated, onEditingChange }: Props = $props();

	const schema = createRegistrationEditSchema({
		required: m.required_field(),
		invalidEmail: m.invalid_email()
	});
	let goalSequence = 0;
	let editing = $state(false);
	let isSaving = $state(false);
	let submissionRequested = $state(false);
	let apiError = $state('');
	const initialData = untrack(() => buildInitialData(registration));
	untrack(() => onEditingChange(false));
	let baseline = $state.raw<RegistrationEditInput>(initialData);

	const { form, errors, enhance, reset } = superForm(
		defaults(structuredClone(initialData), valibotClient(schema)),
		{
			validators: valibotClient(schema),
			SPA: true,
			dataType: 'json',
			onSubmit: ({ cancel }) => {
				if (submissionRequested || isSaving) {
					cancel();
					return;
				}
				submissionRequested = true;
			},
			onUpdate: async ({ form: result }) => {
				if (!submissionRequested) return;
				if (!result.valid) {
					submissionRequested = false;
					return;
				}

				isSaving = true;
				apiError = '';
				const submittedRegistrationId = registration.id;
				try {
					await updateRegistrationForm(submittedRegistrationId, buildPayload(result.data));
					if (registration.id !== submittedRegistrationId) return;
					baseline = structuredClone(result.data);
					setEditing(false);
					await onUpdated();
				} catch (error) {
					apiError = error instanceof Error ? error.message : m.failed_update_registration();
				} finally {
					isSaving = false;
					submissionRequested = false;
				}
			}
		}
	);

	const hasChanges = $derived(editing && JSON.stringify($form) !== JSON.stringify(baseline));

	const genderOptions = [
		{ label: m.male(), value: 'male' },
		{ label: m.female(), value: 'female' },
		{ label: m.other(), value: 'other' },
		{ label: m.unknown(), value: 'unknown' }
	];

	const educationLevelOptions: Array<{ label: string; value: EducationLevel }> = [
		{ label: m.education_primary(), value: 'primary' },
		{ label: m.education_secondary(), value: 'secondary' },
		{ label: m.education_higher(), value: 'higher' },
		{ label: m.education_none(), value: 'none' }
	];

	function nextGoalId() {
		goalSequence += 1;
		return `registration-goal-${goalSequence}`;
	}

	function text(value: string | null | undefined) {
		return value ?? '';
	}

	function buildInitialData(source: GetRegistrationFormResponse): RegistrationEditInput {
		return {
			client_first_name: source.client_first_name,
			client_last_name: source.client_last_name,
			client_bsn_number: source.client_bsn_number,
			client_gender: source.client_gender,
			client_nationality: source.client_nationality,
			client_phone_number: source.client_phone_number,
			client_email: source.client_email,
			client_date_of_birth: source.client_date_of_birth,
			client_street: source.client_street,
			client_house_number: source.client_house_number,
			client_house_number_addition: text(source.client_house_number_addition),
			client_postal_code: source.client_postal_code,
			client_city: source.client_city,
			referrer_first_name: source.referrer_first_name,
			referrer_last_name: source.referrer_last_name,
			referrer_organization: source.referrer_organization,
			referrer_job_title: source.referrer_job_title,
			referrer_phone_number: source.referrer_phone_number,
			referrer_email: source.referrer_email,
			referrer_signature: source.referrer_signature ?? false,
			guardian1_first_name: source.guardian1_first_name,
			guardian1_last_name: source.guardian1_last_name,
			guardian1_relationship: source.guardian1_relationship,
			guardian1_phone_number: source.guardian1_phone_number,
			guardian1_email: source.guardian1_email,
			guardian2_first_name: text(source.guardian2_first_name),
			guardian2_last_name: text(source.guardian2_last_name),
			guardian2_relationship: text(source.guardian2_relationship),
			guardian2_phone_number: text(source.guardian2_phone_number),
			guardian2_email: text(source.guardian2_email),
			education: {
				institution: text(source.education?.institution),
				mentor_name: text(source.education?.mentor_name),
				mentor_phone: text(source.education?.mentor_phone),
				mentor_email: text(source.education?.mentor_email),
				currently_enrolled: source.education?.currently_enrolled ?? false,
				additional_notes: text(source.education?.additional_notes),
				level: source.education?.level ?? ''
			},
			work: {
				current_employer: text(source.work?.current_employer),
				employer_phone: text(source.work?.employer_phone),
				employer_email: text(source.work?.employer_email),
				current_position: text(source.work?.current_position),
				currently_employed: source.work?.currently_employed ?? false,
				start_date: text(source.work?.start_date),
				additional_notes: text(source.work?.additional_notes)
			},
			care_protected_living: source.care_protected_living ?? false,
			care_assisted_independent_living: source.care_assisted_independent_living ?? false,
			care_room_training_center: source.care_room_training_center ?? false,
			care_ambulatory_guidance: source.care_ambulatory_guidance ?? false,
			risk_aggressive_behavior: source.risk_aggressive_behavior ?? false,
			risk_suicidal_selfharm: source.risk_suicidal_selfharm ?? false,
			risk_substance_abuse: source.risk_substance_abuse ?? false,
			risk_psychiatric_issues: source.risk_psychiatric_issues ?? false,
			risk_criminal_history: source.risk_criminal_history ?? false,
			risk_flight_behavior: source.risk_flight_behavior ?? false,
			risk_weapon_possession: source.risk_weapon_possession ?? false,
			risk_sexual_behavior: source.risk_sexual_behavior ?? false,
			risk_day_night_rhythm: source.risk_day_night_rhythm ?? false,
			risk_other: source.risk_other ?? false,
			risk_other_description: text(source.risk_other_description),
			risk_additional_notes: text(source.risk_additional_notes),
			application_date: source.application_date,
			application_reason: text(source.application_reason),
			client_goals: (source.client_goals?.length ? source.client_goals : ['']).map((value) => ({
				id: nextGoalId(),
				value
			}))
		};
	}

	function emptyToNull(value: string) {
		const trimmed = value.trim();
		return trimmed || null;
	}

	function buildPayload(data: RegistrationEditInput): UpdateRegistrationFormRequest {
		return {
			client_first_name: data.client_first_name,
			client_last_name: data.client_last_name,
			client_date_of_birth: data.client_date_of_birth,
			client_bsn_number: data.client_bsn_number,
			client_gender: data.client_gender,
			client_nationality: data.client_nationality,
			client_phone_number: data.client_phone_number,
			client_email: data.client_email,
			client_street: data.client_street,
			client_house_number: data.client_house_number,
			client_house_number_addition: data.client_house_number_addition,
			client_postal_code: data.client_postal_code,
			client_city: data.client_city,
			referrer_first_name: data.referrer_first_name,
			referrer_last_name: data.referrer_last_name,
			referrer_organization: data.referrer_organization,
			referrer_job_title: data.referrer_job_title,
			referrer_phone_number: data.referrer_phone_number,
			referrer_email: data.referrer_email,
			guardian1_first_name: data.guardian1_first_name,
			guardian1_last_name: data.guardian1_last_name,
			guardian1_relationship: data.guardian1_relationship,
			guardian1_phone_number: data.guardian1_phone_number,
			guardian1_email: data.guardian1_email,
			guardian2_first_name: data.guardian2_first_name,
			guardian2_last_name: data.guardian2_last_name,
			guardian2_relationship: data.guardian2_relationship,
			guardian2_phone_number: data.guardian2_phone_number,
			guardian2_email: data.guardian2_email,
			education: {
				institution: emptyToNull(data.education.institution),
				mentor_name: emptyToNull(data.education.mentor_name),
				mentor_phone: emptyToNull(data.education.mentor_phone),
				mentor_email: emptyToNull(data.education.mentor_email),
				currently_enrolled: data.education.currently_enrolled,
				additional_notes: emptyToNull(data.education.additional_notes),
				level: data.education.level || null
			},
			work: {
				current_employer: emptyToNull(data.work.current_employer),
				employer_phone: emptyToNull(data.work.employer_phone),
				employer_email: emptyToNull(data.work.employer_email),
				current_position: emptyToNull(data.work.current_position),
				currently_employed: data.work.currently_employed,
				start_date: emptyToNull(data.work.start_date),
				additional_notes: emptyToNull(data.work.additional_notes)
			},
			care_protected_living: data.care_protected_living,
			care_assisted_independent_living: data.care_assisted_independent_living,
			care_room_training_center: data.care_room_training_center,
			care_ambulatory_guidance: data.care_ambulatory_guidance,
			application_reason: data.application_reason,
			client_goals: data.client_goals.map((goal) => goal.value),
			risk_aggressive_behavior: data.risk_aggressive_behavior,
			risk_suicidal_selfharm: data.risk_suicidal_selfharm,
			risk_substance_abuse: data.risk_substance_abuse,
			risk_psychiatric_issues: data.risk_psychiatric_issues,
			risk_criminal_history: data.risk_criminal_history,
			risk_flight_behavior: data.risk_flight_behavior,
			risk_weapon_possession: data.risk_weapon_possession,
			risk_sexual_behavior: data.risk_sexual_behavior,
			risk_day_night_rhythm: data.risk_day_night_rhythm,
			risk_other: data.risk_other,
			risk_other_description: data.risk_other_description,
			risk_additional_notes: data.risk_additional_notes,
			application_date: data.application_date,
			referrer_signature: data.referrer_signature
		};
	}

	function setEditing(value: boolean) {
		editing = value;
		onEditingChange(value);
	}

	function startEditing() {
		baseline = buildInitialData(registration);
		reset({ data: structuredClone(baseline) });
		apiError = '';
		setEditing(true);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function cancelEditing() {
		if (isSaving || (hasChanges && !confirm(m.discard_changes()))) return;
		apiError = '';
		setEditing(false);
	}

	function resetChanges() {
		if (isSaving) return;
		reset({ data: structuredClone(baseline) });
		apiError = '';
	}

	function addGoal() {
		$form.client_goals = [...$form.client_goals, { id: nextGoalId(), value: '' }];
	}

	function removeGoal(id: string) {
		$form.client_goals = $form.client_goals.filter((goal) => goal.id !== id);
	}
</script>

<div class="space-y-8">
	<div class="flex flex-wrap items-center justify-end gap-2">
		{#if !editing}
			<PermissionGuard permission="REGISTRATION_FORM.UPDATE">
				<Button
					variant="ghost"
					onclick={startEditing}
					class="h-10 bg-surface shadow-sm ring-1 ring-border"
				>
					<Edit3 class="h-4 w-4 text-brand" />
					{m.edit_registration()}
				</Button>
			</PermissionGuard>
		{:else}
			{#if hasChanges}
				<Button
					variant="ghost"
					onclick={resetChanges}
					disabled={isSaving}
					class="h-10 bg-warning/10 text-warning hover:bg-warning/20"
				>
					<RotateCcw class="h-4 w-4" />
					{m.reset_changes()}
				</Button>
			{/if}
			<Button
				variant="ghost"
				onclick={cancelEditing}
				disabled={isSaving}
				class="h-10 bg-surface ring-1 ring-border"
			>
				<X class="h-4 w-4" />
				{m.cancel()}
			</Button>
			<Button
				form="registration-edit-form"
				type="submit"
				isLoading={isSaving}
				disabled={!hasChanges}
				class="h-10"
			>
				{m.save_changes()}
			</Button>
		{/if}
	</div>

	{#if editing}
		<form id="registration-edit-form" use:enhance class="space-y-8 pb-20" novalidate>
			{#if apiError}
				<InlineErrorBanner title={m.failed()} message={apiError} />
			{/if}

			{#if hasChanges}
				<div
					class="flex flex-col gap-4 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-warning shadow-sm sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex min-w-0 items-center gap-3">
						<div class="shrink-0 rounded-full bg-warning/20 p-2">
							<RotateCcw class="h-5 w-5" />
						</div>
						<div class="min-w-0">
							<p class="font-bold">{m.unsaved_changes_title()}</p>
							<p class="text-sm opacity-90">{m.unsaved_changes_description()}</p>
						</div>
					</div>
					<div class="flex shrink-0 flex-wrap gap-2 sm:justify-end">
						<Button
							type="button"
							variant="ghost"
							onclick={resetChanges}
							disabled={isSaving}
							class="h-9 text-xs text-warning hover:bg-warning/20"
						>
							{m.discard_changes()}
						</Button>
						<Button
							type="submit"
							isLoading={isSaving}
							class="h-9 bg-warning text-xs text-white hover:bg-warning/90"
						>
							{m.save_now()}
						</Button>
					</div>
				</div>
			{/if}

			<div class="grid gap-6 lg:grid-cols-2 lg:gap-8">
				<section class="space-y-6 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
					<div class="flex items-center gap-3 border-b border-border pb-4">
						<User class="h-5 w-5 text-brand" />
						<h2 class="text-xl font-bold text-text">{m.client_information()}</h2>
					</div>
					<div class="grid gap-6 sm:grid-cols-2">
						<Input
							label={m.first_name()}
							bind:value={$form.client_first_name}
							error={formatFormError($errors.client_first_name)}
							required
						/>
						<Input
							label={m.last_name()}
							bind:value={$form.client_last_name}
							error={formatFormError($errors.client_last_name)}
							required
						/>
						<Input
							label={m.bsn_number()}
							bind:value={$form.client_bsn_number}
							error={formatFormError($errors.client_bsn_number)}
							required
						/>
						<DatePicker
							label={m.date_of_birth()}
							bind:value={$form.client_date_of_birth}
							error={formatFormError($errors.client_date_of_birth)}
						/>
						<Select
							label={m.gender()}
							options={genderOptions}
							bind:value={$form.client_gender}
							error={formatFormError($errors.client_gender)}
						/>
						<Input
							label={m.nationality()}
							bind:value={$form.client_nationality}
							error={formatFormError($errors.client_nationality)}
							required
						/>
						<Input
							label={m.phone_number()}
							type="tel"
							bind:value={$form.client_phone_number}
							error={formatFormError($errors.client_phone_number)}
							required
						/>
						<div class="sm:col-span-2">
							<Input
								label={m.email_address()}
								type="email"
								bind:value={$form.client_email}
								error={formatFormError($errors.client_email)}
								required
							/>
						</div>
					</div>
				</section>

				<section class="space-y-6 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
					<div class="flex items-center gap-3 border-b border-border pb-4">
						<MapPin class="h-5 w-5 text-brand" />
						<h2 class="text-xl font-bold text-text">{m.address_details()}</h2>
					</div>
					<div class="grid gap-6 sm:grid-cols-2">
						<Input
							label={m.street()}
							bind:value={$form.client_street}
							error={formatFormError($errors.client_street)}
							required
						/>
						<div class="grid grid-cols-2 gap-4">
							<Input
								label={m.house_number()}
								bind:value={$form.client_house_number}
								error={formatFormError($errors.client_house_number)}
								required
							/>
							<Input
								label={m.addition_optional()}
								bind:value={$form.client_house_number_addition}
								error={formatFormError($errors.client_house_number_addition)}
							/>
						</div>
						<Input
							label={m.postal_code()}
							bind:value={$form.client_postal_code}
							error={formatFormError($errors.client_postal_code)}
							required
						/>
						<Input
							label={m.city()}
							bind:value={$form.client_city}
							error={formatFormError($errors.client_city)}
							required
						/>
					</div>
				</section>

				<section class="space-y-6 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
					<div class="flex items-center gap-3 border-b border-border pb-4">
						<Building class="h-5 w-5 text-brand" />
						<h2 class="text-xl font-bold text-text">{m.referrer_details()}</h2>
					</div>
					<div class="grid gap-6 sm:grid-cols-2">
						<Input
							label={m.first_name()}
							bind:value={$form.referrer_first_name}
							error={formatFormError($errors.referrer_first_name)}
							required
						/>
						<Input
							label={m.last_name()}
							bind:value={$form.referrer_last_name}
							error={formatFormError($errors.referrer_last_name)}
							required
						/>
						<div class="sm:col-span-2">
							<Input
								label={m.organization()}
								bind:value={$form.referrer_organization}
								error={formatFormError($errors.referrer_organization)}
								required
							/>
						</div>
						<Input
							label={m.job_title()}
							bind:value={$form.referrer_job_title}
							error={formatFormError($errors.referrer_job_title)}
							required
						/>
						<Input
							label={m.phone()}
							type="tel"
							bind:value={$form.referrer_phone_number}
							error={formatFormError($errors.referrer_phone_number)}
							required
						/>
						<div class="sm:col-span-2">
							<Input
								label={m.email()}
								type="email"
								bind:value={$form.referrer_email}
								error={formatFormError($errors.referrer_email)}
								required
							/>
						</div>
					</div>
				</section>

				<section class="space-y-6 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
					<div class="flex items-center gap-3 border-b border-border pb-4">
						<ShieldAlert class="h-5 w-5 text-brand" />
						<h2 class="text-xl font-bold text-text">{m.guardian_details()}</h2>
					</div>
					<div class="space-y-8">
						<div class="grid gap-6 sm:grid-cols-2">
							<Input
								label={m.first_name()}
								bind:value={$form.guardian1_first_name}
								error={formatFormError($errors.guardian1_first_name)}
								required
							/>
							<Input
								label={m.last_name()}
								bind:value={$form.guardian1_last_name}
								error={formatFormError($errors.guardian1_last_name)}
								required
							/>
							<Input
								label={m.relationship()}
								bind:value={$form.guardian1_relationship}
								error={formatFormError($errors.guardian1_relationship)}
								required
							/>
							<Input
								label={m.phone()}
								type="tel"
								bind:value={$form.guardian1_phone_number}
								error={formatFormError($errors.guardian1_phone_number)}
								required
							/>
						</div>
						<div class="border-t border-border pt-6">
							<h3 class="mb-4 text-sm font-semibold text-text-muted">
								{m.secondary_guardian_optional()}
							</h3>
							<div class="grid gap-6 sm:grid-cols-2">
								<Input
									label={m.first_name()}
									bind:value={$form.guardian2_first_name}
									error={formatFormError($errors.guardian2_first_name)}
								/>
								<Input
									label={m.last_name()}
									bind:value={$form.guardian2_last_name}
									error={formatFormError($errors.guardian2_last_name)}
								/>
								<Input
									label={m.relationship()}
									bind:value={$form.guardian2_relationship}
									error={formatFormError($errors.guardian2_relationship)}
								/>
								<Input
									label={m.phone()}
									type="tel"
									bind:value={$form.guardian2_phone_number}
									error={formatFormError($errors.guardian2_phone_number)}
								/>
							</div>
						</div>
					</div>
				</section>

				<section class="space-y-6 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
					<div class="flex items-center gap-3 border-b border-border pb-4">
						<Briefcase class="h-5 w-5 text-brand" />
						<h2 class="text-xl font-bold text-text">{m.education_work()}</h2>
					</div>
					<div class="space-y-6">
						<div class="grid gap-6 sm:grid-cols-2">
							<Select
								label={m.education_level()}
								options={educationLevelOptions}
								bind:value={$form.education.level}
								placeholder={m.select_option()}
								error={formatFormError($errors.education?.level)}
							/>
							<div class="flex items-end pb-2">
								<Checkbox
									label={m.currently_enrolled()}
									bind:checked={$form.education.currently_enrolled}
								/>
							</div>
							<div class="sm:col-span-2">
								<Input
									label={m.institution_name()}
									bind:value={$form.education.institution}
									error={formatFormError($errors.education?.institution)}
								/>
							</div>
						</div>
						<div class="border-t border-border pt-6">
							<div class="grid gap-6 sm:grid-cols-2">
								<Input
									label={m.current_employer()}
									bind:value={$form.work.current_employer}
									error={formatFormError($errors.work?.current_employer)}
								/>
								<div class="flex items-end pb-2">
									<Checkbox
										label={m.currently_employed()}
										bind:checked={$form.work.currently_employed}
									/>
								</div>
								<Input
									label={m.position()}
									bind:value={$form.work.current_position}
									error={formatFormError($errors.work?.current_position)}
								/>
								<DatePicker
									label={m.start_date()}
									bind:value={$form.work.start_date}
									error={formatFormError($errors.work?.start_date)}
								/>
							</div>
						</div>
					</div>
				</section>

				<section class="space-y-6 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
					<div class="flex items-center gap-3 border-b border-border pb-4">
						<HeartPulse class="h-5 w-5 text-brand" />
						<h2 class="text-xl font-bold text-text">{m.care_risks()}</h2>
					</div>
					<div class="space-y-6">
						<div>
							<h3 class="mb-3 text-sm font-semibold tracking-wider text-text-muted uppercase">
								{m.care_needs()}
							</h3>
							<div class="grid gap-4 sm:grid-cols-2">
								<Checkbox label={m.protected_living()} bind:checked={$form.care_protected_living} />
								<Checkbox
									label={m.assisted_independent_living()}
									bind:checked={$form.care_assisted_independent_living}
								/>
								<Checkbox
									label={m.room_training_center()}
									bind:checked={$form.care_room_training_center}
								/>
								<Checkbox
									label={m.ambulatory_guidance()}
									bind:checked={$form.care_ambulatory_guidance}
								/>
							</div>
						</div>
						<div class="border-t border-border pt-6">
							<h3 class="mb-3 text-sm font-semibold tracking-wider text-text-muted uppercase">
								{m.risk_factors()}
							</h3>
							<div class="grid gap-3 sm:grid-cols-2">
								<Checkbox
									label={m.aggressive_behavior()}
									bind:checked={$form.risk_aggressive_behavior}
								/>
								<Checkbox
									label={m.suicidal_selfharm()}
									bind:checked={$form.risk_suicidal_selfharm}
								/>
								<Checkbox label={m.substance_abuse()} bind:checked={$form.risk_substance_abuse} />
								<Checkbox
									label={m.psychiatric_issues()}
									bind:checked={$form.risk_psychiatric_issues}
								/>
								<Checkbox label={m.criminal_history()} bind:checked={$form.risk_criminal_history} />
								<Checkbox label={m.flight_behavior()} bind:checked={$form.risk_flight_behavior} />
								<Checkbox
									label={m.weapon_possession()}
									bind:checked={$form.risk_weapon_possession}
								/>
								<Checkbox label={m.sexual_behavior()} bind:checked={$form.risk_sexual_behavior} />
							</div>
							<div class="mt-6">
								<Textarea
									label={m.additional_risk_notes()}
									bind:value={$form.risk_additional_notes}
									error={formatFormError($errors.risk_additional_notes)}
									rows={3}
								/>
							</div>
						</div>
					</div>
				</section>

				<section
					class="space-y-6 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8 lg:col-span-2"
				>
					<div class="flex items-center gap-3 border-b border-border pb-4">
						<Target class="h-5 w-5 text-brand" />
						<h2 class="text-xl font-bold text-text">{m.goals_reason()}</h2>
					</div>
					<div class="grid gap-8 lg:grid-cols-2 lg:gap-10">
						<div class="space-y-4">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<h3 class="text-sm font-semibold tracking-wider text-text-muted uppercase">
									{m.client_goals()}
								</h3>
								<Button
									type="button"
									variant="ghost"
									onclick={addGoal}
									class="h-8 gap-1 text-xs text-brand"
								>
									<Plus class="h-3.5 w-3.5" />
									{m.add_goal()}
								</Button>
							</div>
							<div class="space-y-3">
								{#each $form.client_goals as goal, index (goal.id)}
									<div class="flex items-start gap-2">
										<div class="min-w-0 flex-1">
											<Input
												bind:value={$form.client_goals[index].value}
												error={formatFormError($errors.client_goals?.[index]?.value)}
												placeholder={m.enter_a_goal()}
											/>
										</div>
										<button
											type="button"
											onclick={() => removeGoal(goal.id)}
											aria-label={`${m.remove()}: ${goal.value || m.client_goals()}`}
											class="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-border bg-bg text-text-muted transition-colors hover:bg-error/10 hover:text-error"
										>
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								{/each}
							</div>
						</div>
						<div class="space-y-4">
							<h3 class="text-sm font-semibold tracking-wider text-text-muted uppercase">
								{m.reason_for_application()}
							</h3>
							<Textarea
								bind:value={$form.application_reason}
								error={formatFormError($errors.application_reason)}
								rows={6}
								placeholder={m.reason_for_application_placeholder()}
							/>
						</div>
					</div>
				</section>
			</div>

			<div
				class="flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-end"
			>
				<Button
					type="button"
					variant="ghost"
					onclick={cancelEditing}
					disabled={isSaving}
					class="px-8">{m.cancel()}</Button
				>
				<Button type="submit" isLoading={isSaving} disabled={!hasChanges} class="px-12"
					>{m.save_changes()}</Button
				>
			</div>
		</form>
	{/if}
</div>
