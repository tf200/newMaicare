<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import FileUpload from '$lib/components/ui/FileUpload.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { fade } from 'svelte/transition';
	import { Plus, Trash2 } from 'lucide-svelte';
	import { lookupAddressByPostcode } from '$lib/api/pdok';
	import { submitRegistration } from '$lib/api/registration';
	import type { ClientGender, EducationLevel } from '$lib/types/api';
	import { m } from '$lib/paraglide/messages';

	// Form State
	let form = $state({
		// Client Info
		client_first_name: '',
		client_last_name: '',
		client_bsn_number: '',
		client_gender: '' as ClientGender,
		client_date_of_birth: '',
		client_nationality: '',
		client_phone_number: '',
		client_email: '',
		client_street: '',
		client_house_number: '',
		client_house_number_addition: '',
		client_postal_code: '',
		client_city: '',
		application_date: new Date().toISOString().split('T')[0],

		// Referrer Info
		referrer_first_name: '',
		referrer_last_name: '',
		referrer_organization: '',
		referrer_job_title: '',
		referrer_phone_number: '',
		referrer_email: '',
		referrer_signature: false,

		// Guardians
		guardian1_first_name: '',
		guardian1_last_name: '',
		guardian1_relationship: '',
		guardian1_phone_number: '',
		guardian1_email: '',
		guardian2_first_name: '',
		guardian2_last_name: '',
		guardian2_relationship: '',
		guardian2_phone_number: '',
		guardian2_email: '',

		// Education
		education_institution: '',
		education_mentor_name: '',
		education_mentor_phone: '',
		education_mentor_email: '',
		education_currently_enrolled: false,
		education_additional_notes: '',
		education_level: '' as EducationLevel,

		// Work
		work_current_employer: '',
		work_employer_phone: '',
		work_employer_email: '',
		work_current_position: '',
		work_currently_employed: false,
		work_start_date: '',
		work_additional_notes: '',

		// Care
		care_protected_living: false,
		care_assisted_independent_living: false,
		care_room_training_center: false,
		care_ambulatory_guidance: false,

		// Risks
		risk_aggressive_behavior: false,
		risk_suicidal_selfharm: false,
		risk_substance_abuse: false,
		risk_psychiatric_issues: false,
		risk_criminal_history: false,
		risk_flight_behavior: false,
		risk_weapon_possession: false,
		risk_sexual_behavior: false,
		risk_day_night_rhythm: false,
		risk_other: false,
		risk_other_description: '',
		risk_additional_notes: '',

		// Documents
		document_referral: null as string | null,
		document_education_report: null as string | null,
		document_psychiatric_report: null as string | null,
		document_diagnosis: null as string | null,
		document_safety_plan: null as string | null,
		document_id_copy: null as string | null,

		// Additional Info
		client_goals: [''],
		application_reason: ''
	});

	let currentStep = $state(0);
	let isLookupLoading = $state(false);
	let lookupMessage = $state('');
	let isSubmitting = $state(false);
	let submitError = $state('');
	let lookupTimer: ReturnType<typeof setTimeout> | null = null;

	const steps = [
		m.client_information(),
		m.referrer_details(),
		m.guardians(),
		m.education_work(),
		m.care_risks(),
		m.documents()
	];

	const normalizePostalCode = (value: string) => value.replace(/\s+/g, '').toUpperCase().trim();

	const formatPostalCode = (value: string) => {
		const normalized = normalizePostalCode(value);
		if (normalized.length <= 4) return normalized;
		return `${normalized.slice(0, 4)} ${normalized.slice(4, 6)}`;
	};

	const isPostalCodeValid = (value: string) => /^\d{4}\s?[A-Za-z]{2}$/.test(value.trim());

	const runLookup = async (postcodeValue: string, numberValue: string) => {
		if (!isPostalCodeValid(postcodeValue)) return;
		isLookupLoading = true;
		lookupMessage = '';
		try {
			const result = await lookupAddressByPostcode(postcodeValue, numberValue);
			if (!result) {
				lookupMessage = m.address_not_found_manual();
				return;
			}
			form.client_street = result.street;
			form.client_city = result.city;
		} catch (error) {
			lookupMessage = error instanceof Error ? error.message : m.address_lookup_failed();
		} finally {
			isLookupLoading = false;
		}
	};

	const scheduleLookup = (postcodeValue: string, numberValue: string) => {
		lookupMessage = '';
		if (!postcodeValue.trim() || !numberValue.trim()) return;
		if (lookupTimer) clearTimeout(lookupTimer);
		lookupTimer = setTimeout(() => {
			void runLookup(postcodeValue, numberValue);
		}, 400);
	};

	function nextStep() {
		if (currentStep < steps.length - 1) {
			currentStep++;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	async function handleSubmit() {
		submitError = '';
		isSubmitting = true;
		try {
			await submitRegistration(form);
			alert(m.registration_submitted_success());
			// Reset form or redirect
			window.location.href = '/';
		} catch (error) {
			submitError = error instanceof Error ? error.message : m.registration_submit_failed();
		} finally {
			isSubmitting = false;
		}
	}

	const genderOptions = [
		{ label: m.male(), value: 'male' },
		{ label: m.female(), value: 'female' },
		{ label: m.other(), value: 'other' }
	];

	function addGoal() {
		if (!form.client_goals) form.client_goals = [];
		form.client_goals = [...form.client_goals, ''];
	}

	function removeGoal(index: number) {
		if (!form.client_goals) return;
		form.client_goals = form.client_goals.filter((_, i) => i !== index);
	}
</script>

<div class="min-h-screen bg-bg p-6 md:p-12">
	<div class="mx-auto max-w-5xl">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="text-4xl font-bold tracking-tight text-text">{m.client_registration()}</h1>
			<p class="mt-2 text-text-muted">{m.client_registration_subtitle()}</p>
		</div>

		<!-- Progress Steps -->
		<div class="mb-10 overflow-x-auto pb-4">
			<div class="flex min-w-max justify-center gap-4 px-2">
				{#each steps as step, i (step)}
					<div class="flex items-center gap-4">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors
                            {i === currentStep
								? 'bg-brand text-white shadow-lg shadow-brand/30'
								: i < currentStep
									? 'bg-success text-white'
									: 'bg-surface text-text-subtle ring-1 ring-border'}"
						>
							{#if i < currentStep}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else}
								{i + 1}
							{/if}
						</div>
						<span
							class="text-sm font-medium transition-colors
                            {i === currentStep
								? 'text-brand'
								: i < currentStep
									? 'text-text'
									: 'text-text-subtle'}"
						>
							{step}
						</span>
						{#if i < steps.length - 1}
							<div class="mx-4 h-0.5 w-12 bg-border">
								<div
									class="h-full bg-success transition-all duration-500"
									style="width: {i < currentStep ? '100%' : '0%'}"
								></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Form Content -->
		<div class="rounded-3xl border border-border bg-surface p-8 shadow-card md:p-12">
			<div>
				{#if currentStep === 0}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">{m.client_information()}</h2>
						<div class="grid gap-6 md:grid-cols-2">
							<Input
								label={m.first_name()}
								bind:value={form.client_first_name}
								placeholder={m.example_first_name()}
							/>
							<Input
								label={m.last_name()}
								bind:value={form.client_last_name}
								placeholder={m.example_last_name()}
							/>
							<Input
								label={m.bsn_number()}
								bind:value={form.client_bsn_number}
								placeholder={m.example_bsn()}
							/>
							<DatePicker label={m.date_of_birth()} bind:value={form.client_date_of_birth} />
							<DatePicker label={m.application_date()} bind:value={form.application_date} />
							<Select
								label={m.gender()}
								options={genderOptions}
								bind:value={form.client_gender}
								placeholder={m.select_gender()}
							/>

							<Input
								label={m.nationality()}
								bind:value={form.client_nationality}
								placeholder={m.example_nationality()}
							/>
							<Input
								label={m.phone_number()}
								bind:value={form.client_phone_number}
								placeholder={m.example_phone_nl()}
							/>
							<Input
								label={m.email_address()}
								type="email"
								bind:value={form.client_email}
								placeholder={m.example_personal_email()}
								class="md:col-span-2"
							/>
							<div class="space-y-4 rounded-2xl border border-border bg-bg/50 p-6 md:col-span-2">
								<h3 class="text-base font-semibold text-text">{m.address_details()}</h3>
								<div class="grid gap-4 md:grid-cols-4">
									<Input
										label={m.postal_code()}
										bind:value={form.client_postal_code}
										placeholder={m.example_postal_code()}
										oninput={() => {
											scheduleLookup(form.client_postal_code, form.client_house_number);
										}}
										onblur={() => {
											form.client_postal_code = formatPostalCode(form.client_postal_code);
											scheduleLookup(form.client_postal_code, form.client_house_number);
										}}
									/>
									<Input
										label={m.house_number()}
										bind:value={form.client_house_number}
										placeholder={m.example_house_number()}
										oninput={() => {
											scheduleLookup(form.client_postal_code, form.client_house_number);
										}}
									/>
									<Input
										label={m.addition_optional()}
										bind:value={form.client_house_number_addition}
										placeholder={m.example_house_number_addition()}
									/>
								</div>
								<div class="grid gap-4 md:grid-cols-2">
									<Input
										label={m.street()}
										bind:value={form.client_street}
										placeholder={m.example_street_name()}
									/>
									<Input
										label={m.city()}
										bind:value={form.client_city}
										placeholder={m.example_city_name()}
									/>
								</div>
								{#if isLookupLoading}
									<div class="text-xs font-medium text-text-muted">
										{m.looking_up_address()}
									</div>
								{/if}
								{#if lookupMessage}
									<div
										class="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
									>
										{lookupMessage}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else if currentStep === 1}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">{m.referrer_details()}</h2>
						<div class="grid gap-6 md:grid-cols-2">
							<Input
								label={m.first_name()}
								bind:value={form.referrer_first_name}
								placeholder={m.example_first_name()}
							/>
							<Input
								label={m.last_name()}
								bind:value={form.referrer_last_name}
								placeholder={m.example_last_name()}
							/>
							<Input
								label={m.referrer_organization()}
								bind:value={form.referrer_organization}
								placeholder={m.placeholder_organization_name()}
								class="md:col-span-2"
							/>
							<Input
								label={m.job_title()}
								bind:value={form.referrer_job_title}
								placeholder={m.placeholder_case_manager()}
							/>
							<Input
								label={m.phone_number()}
								bind:value={form.referrer_phone_number}
								placeholder={m.example_phone_nl()}
							/>
							<Input
								label={m.email_address()}
								type="email"
								bind:value={form.referrer_email}
								placeholder={m.example_work_email()}
								class="md:col-span-2"
							/>
							<div class="mt-4 md:col-span-2">
								<Checkbox
									label={m.referrer_confirm_authorized()}
									bind:checked={form.referrer_signature}
								/>
							</div>
						</div>
					</div>
				{:else if currentStep === 2}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">{m.guardians_contact()}</h2>

						<!-- Guardian 1 -->
						<div class="mb-10 rounded-2xl border border-border bg-bg/50 p-6">
							<h3 class="mb-4 text-lg font-semibold text-text">{m.primary_guardian()}</h3>
							<div class="grid gap-6 md:grid-cols-2">
								<Input
									label={m.first_name()}
									bind:value={form.guardian1_first_name}
									placeholder={m.placeholder_guardian_name()}
								/>
								<Input
									label={m.last_name()}
									bind:value={form.guardian1_last_name}
									placeholder={m.placeholder_surname()}
								/>
								<Input
									label={m.relationship()}
									bind:value={form.guardian1_relationship}
									placeholder={m.placeholder_relationship_example()}
								/>
								<Input
									label={m.phone_number()}
									bind:value={form.guardian1_phone_number}
									placeholder={m.example_phone_nl()}
								/>
								<Input
									label={m.email_address()}
									type="email"
									bind:value={form.guardian1_email}
									placeholder={m.example_personal_email()}
									class="md:col-span-2"
								/>
							</div>
						</div>

						<!-- Guardian 2 -->
						<div class="rounded-2xl border border-border bg-bg/50 p-6">
							<h3 class="mb-4 text-lg font-semibold text-text">
								{m.secondary_guardian_optional()}
							</h3>
							<div class="grid gap-6 md:grid-cols-2">
								<Input
									label={m.first_name()}
									bind:value={form.guardian2_first_name}
									placeholder={m.name()}
								/>
								<Input
									label={m.last_name()}
									bind:value={form.guardian2_last_name}
									placeholder={m.placeholder_surname()}
								/>
								<Input
									label={m.relationship()}
									bind:value={form.guardian2_relationship}
									placeholder={m.relationship()}
								/>
								<Input
									label={m.phone_number()}
									bind:value={form.guardian2_phone_number}
									placeholder={m.example_phone_nl()}
								/>
								<Input
									label={m.email_address()}
									type="email"
									bind:value={form.guardian2_email}
									placeholder={m.example_personal_email()}
									class="md:col-span-2"
								/>
							</div>
						</div>
					</div>
				{:else if currentStep === 3}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">{m.education_work()}</h2>

						<!-- Education -->
						<div class="mb-10 border-b border-border pb-10">
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-xl font-semibold text-text">{m.education()}</h3>
								<Checkbox
									label={m.currently_enrolled()}
									bind:checked={form.education_currently_enrolled}
								/>
							</div>
							<div class="grid gap-6 md:grid-cols-2">
								<Input
									label={m.institution_name()}
									bind:value={form.education_institution}
									placeholder={m.placeholder_school_university()}
									class="md:col-span-2"
								/>
								<Input
									label={m.level()}
									bind:value={form.education_level}
									placeholder={m.placeholder_education_level_example()}
								/>
								<Input
									label={m.mentor_name()}
									bind:value={form.education_mentor_name}
									placeholder={m.mentor_name()}
								/>
								<Input
									label={m.mentor_phone()}
									bind:value={form.education_mentor_phone}
									placeholder={m.example_phone_nl()}
								/>
								<Input
									label={m.mentor_email()}
									type="email"
									bind:value={form.education_mentor_email}
									placeholder={m.example_work_email()}
								/>
								<Input
									label={m.additional_notes()}
									bind:value={form.education_additional_notes}
									placeholder={m.placeholder_additional_details()}
									class="md:col-span-2"
								/>
							</div>
						</div>

						<!-- Work -->
						<div>
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-xl font-semibold text-text">{m.work()}</h3>
								<Checkbox
									label={m.currently_employed()}
									bind:checked={form.work_currently_employed}
								/>
							</div>
							<div class="grid gap-6 md:grid-cols-2">
								<Input
									label={m.current_employer()}
									bind:value={form.work_current_employer}
									placeholder={m.placeholder_company_name()}
								/>
								<Input
									label={m.position()}
									bind:value={form.work_current_position}
									placeholder={m.job_title()}
								/>
								<Input
									label={m.employer_phone()}
									bind:value={form.work_employer_phone}
									placeholder={m.example_phone_nl()}
								/>
								<Input
									label={m.employer_email()}
									type="email"
									bind:value={form.work_employer_email}
									placeholder={m.example_work_email()}
								/>
								<DatePicker label={m.start_date()} bind:value={form.work_start_date} />
								<Input
									label={m.additional_notes()}
									bind:value={form.work_additional_notes}
									placeholder={m.placeholder_work_details()}
									class="md:col-span-2"
								/>
							</div>
						</div>
					</div>
				{:else if currentStep === 4}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">{m.care_risks()}</h2>

						<!-- Additional Info -->
						<div class="mb-10 border-b border-border pb-10">
							<h3 class="mb-4 text-xl font-semibold text-text">{m.goals_reason()}</h3>
							<div class="grid gap-6 md:grid-cols-2">
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<span class="ml-1 text-sm font-semibold text-text-muted"
											>{m.client_goals()}</span
										>
										<Button variant="ghost" onclick={addGoal} class="h-8 gap-1 text-xs">
											<Plus class="h-3.5 w-3.5" />
											{m.add_goal()}
										</Button>
									</div>
									{#if form.client_goals && form.client_goals.length > 0}
										<div class="space-y-2">
											{#each form.client_goals as _, index (index)}
												<div class="flex gap-2">
													<Input
														bind:value={form.client_goals[index]}
														placeholder={m.enter_a_goal()}
													/>
													{#if form.client_goals.length > 1}
														<button
															onclick={() => removeGoal(index)}
															class="flex h-12.5 w-12.5 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:bg-error/10 hover:text-error"
														>
															<Trash2 class="h-4 w-4" />
														</button>
													{/if}
												</div>
											{/each}
										</div>
									{:else}
										<div
											class="rounded-xl border border-dashed border-border p-4 text-center text-sm text-text-muted"
										>
											{m.no_goals_added()}
										</div>
									{/if}
								</div>
								<Textarea
									label={m.reason_for_application()}
									bind:value={form.application_reason}
									placeholder={m.placeholder_application_reason()}
									rows={3}
								/>
							</div>
						</div>

						<!-- Care -->
						<div class="mb-10 border-b border-border pb-10">
							<h3 class="mb-4 text-xl font-semibold text-text">{m.care_needs()}</h3>
							<div class="grid gap-4 md:grid-cols-2">
								<Checkbox label={m.protected_living()} bind:checked={form.care_protected_living} />
								<Checkbox
									label={m.assisted_independent_living()}
									bind:checked={form.care_assisted_independent_living}
								/>
								<Checkbox
									label={m.room_training_center()}
									bind:checked={form.care_room_training_center}
								/>
								<Checkbox
									label={m.ambulatory_guidance()}
									bind:checked={form.care_ambulatory_guidance}
								/>
							</div>
						</div>

						<!-- Risks -->
						<div>
							<h3 class="mb-4 text-xl font-semibold text-text">{m.risk_factors()}</h3>
							<div class="grid gap-4 md:grid-cols-2">
								<Checkbox
									label={m.aggressive_behavior()}
									bind:checked={form.risk_aggressive_behavior}
								/>
								<Checkbox
									label={m.suicidal_selfharm()}
									bind:checked={form.risk_suicidal_selfharm}
								/>
								<Checkbox label={m.substance_abuse()} bind:checked={form.risk_substance_abuse} />
								<Checkbox
									label={m.psychiatric_issues()}
									bind:checked={form.risk_psychiatric_issues}
								/>
								<Checkbox label={m.criminal_history()} bind:checked={form.risk_criminal_history} />
								<Checkbox label={m.flight_behavior()} bind:checked={form.risk_flight_behavior} />
								<Checkbox
									label={m.weapon_possession()}
									bind:checked={form.risk_weapon_possession}
								/>
								<Checkbox label={m.sexual_behavior()} bind:checked={form.risk_sexual_behavior} />
								<Checkbox label={m.day_night_rhythm()} bind:checked={form.risk_day_night_rhythm} />
								<Checkbox label={m.other()} bind:checked={form.risk_other} />
							</div>
							{#if form.risk_other}
								<div class="mt-4" in:fade>
									<Input
										label={m.description_other_risks()}
										bind:value={form.risk_other_description}
									/>
								</div>
							{/if}
							<div class="mt-4">
								<Input label={m.additional_risk_notes()} bind:value={form.risk_additional_notes} />
							</div>
						</div>
					</div>
				{:else if currentStep === 5}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">{m.documents()}</h2>
						<p class="mb-6 text-text-muted">{m.upload_documents()}</p>

						<div class="grid gap-6 md:grid-cols-2">
							<FileUpload
								label={m.referral_document()}
								bind:fileId={form.document_referral}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label={m.education_report()}
								bind:fileId={form.document_education_report}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label={m.psychiatric_report()}
								bind:fileId={form.document_psychiatric_report}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label={m.diagnosis_info()}
								bind:fileId={form.document_diagnosis}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label={m.safety_plan()}
								bind:fileId={form.document_safety_plan}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label={m.id_copy()}
								bind:fileId={form.document_id_copy}
								accept=".pdf,.jpg,.png"
							/>
						</div>

						{#if submitError}
							<div
								class="mt-6 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
							>
								{submitError}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Navigation Buttons -->
			<div class="mt-8 flex justify-between border-t border-border pt-8">
				<Button
					variant="ghost"
					onclick={prevStep}
					disabled={currentStep === 0}
					class={currentStep === 0 ? 'invisible' : ''}
				>
					{m.previous()}
				</Button>
				{#if currentStep === steps.length - 1}
					<Button variant="primary" onclick={handleSubmit} isLoading={isSubmitting}
						>{m.submit_application()}</Button
					>
				{:else}
					<Button variant="primary" onclick={nextStep}>{m.next_step()}</Button>
				{/if}
			</div>
		</div>
	</div>
</div>
