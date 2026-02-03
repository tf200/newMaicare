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

	// Form State
	let form = $state({
		// Client Info
		client_first_name: '',
		client_last_name: '',
		client_bsn_number: '',
		client_gender: '',
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
		education_level: '',

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
		'Client Information',
		'Referrer Details',
		'Guardians',
		'Education & Work',
		'Care & Risks',
		'Documents'
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
				lookupMessage = 'Address not found. Please fill street and city manually.';
				return;
			}
			form.client_street = result.street;
			form.client_city = result.city;
		} catch (error) {
			lookupMessage = error instanceof Error ? error.message : 'Unable to fetch address from PDOK.';
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
			alert('Registration submitted successfully!');
			// Reset form or redirect
			window.location.href = '/';
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Failed to submit registration.';
		} finally {
			isSubmitting = false;
		}
	}

	const genderOptions = [
		{ label: 'Male', value: 'male' },
		{ label: 'Female', value: 'female' },
		{ label: 'Other', value: 'other' }
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
			<h1 class="text-4xl font-bold tracking-tight text-text">Client Registration</h1>
			<p class="mt-2 text-text-muted">Please complete all sections to register a new client.</p>
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
						<h2 class="mb-6 text-2xl font-bold text-text">Client Information</h2>
						<div class="grid gap-6 md:grid-cols-2">
							<Input label="First Name" bind:value={form.client_first_name} placeholder="John" />
							<Input label="Last Name" bind:value={form.client_last_name} placeholder="Doe" />
							<Input
								label="BSN Number"
								bind:value={form.client_bsn_number}
								placeholder="123456789"
							/>
							<DatePicker label="Date of Birth" bind:value={form.client_date_of_birth} />
							<DatePicker label="Application Date" bind:value={form.application_date} />
							<Select
								label="Gender"
								options={genderOptions}
								bind:value={form.client_gender}
								placeholder="Select gender"
							/>

							<Input label="Nationality" bind:value={form.client_nationality} placeholder="Dutch" />
							<Input
								label="Phone Number"
								bind:value={form.client_phone_number}
								placeholder="+31 6 12345678"
							/>
							<Input
								label="Email Address"
								type="email"
								bind:value={form.client_email}
								placeholder="john@example.com"
								class="md:col-span-2"
							/>
							<div class="space-y-4 rounded-2xl border border-border bg-bg/50 p-6 md:col-span-2">
								<h3 class="text-base font-semibold text-text">Address Details</h3>
								<div class="grid gap-4 md:grid-cols-4">
									<Input
										label="Postal Code"
										bind:value={form.client_postal_code}
										placeholder="1234 AB"
										oninput={() => {
											scheduleLookup(form.client_postal_code, form.client_house_number);
										}}
										onblur={() => {
											form.client_postal_code = formatPostalCode(form.client_postal_code);
											scheduleLookup(form.client_postal_code, form.client_house_number);
										}}
									/>
									<Input
										label="House Number"
										bind:value={form.client_house_number}
										placeholder="12"
										oninput={() => {
											scheduleLookup(form.client_postal_code, form.client_house_number);
										}}
									/>
									<Input
										label="Addition (optional)"
										bind:value={form.client_house_number_addition}
										placeholder="A"
									/>
								</div>
								<div class="grid gap-4 md:grid-cols-2">
									<Input label="Street" bind:value={form.client_street} placeholder="Street name" />
									<Input label="City" bind:value={form.client_city} placeholder="Amsterdam" />
								</div>
								{#if isLookupLoading}
									<div class="text-xs font-medium text-text-muted">
										Looking up address via PDOK...
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
						<h2 class="mb-6 text-2xl font-bold text-text">Referrer Details</h2>
						<div class="grid gap-6 md:grid-cols-2">
							<Input label="First Name" bind:value={form.referrer_first_name} placeholder="Jane" />
							<Input label="Last Name" bind:value={form.referrer_last_name} placeholder="Smith" />
							<Input
								label="Organization"
								bind:value={form.referrer_organization}
								placeholder="Organization Name"
								class="md:col-span-2"
							/>
							<Input
								label="Job Title"
								bind:value={form.referrer_job_title}
								placeholder="Case Manager"
							/>
							<Input
								label="Phone Number"
								bind:value={form.referrer_phone_number}
								placeholder="+31 6 87654321"
							/>
							<Input
								label="Email Address"
								type="email"
								bind:value={form.referrer_email}
								placeholder="jane@organization.com"
								class="md:col-span-2"
							/>
							<div class="mt-4 md:col-span-2">
								<Checkbox
									label="I confirm that I am authorized to refer this client."
									bind:checked={form.referrer_signature}
								/>
							</div>
						</div>
					</div>
				{:else if currentStep === 2}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">Guardians / Contact Persons</h2>

						<!-- Guardian 1 -->
						<div class="mb-10 rounded-2xl border border-border bg-bg/50 p-6">
							<h3 class="mb-4 text-lg font-semibold text-text">Primary Guardian</h3>
							<div class="grid gap-6 md:grid-cols-2">
								<Input
									label="First Name"
									bind:value={form.guardian1_first_name}
									placeholder="Parent/Guardian Name"
								/>
								<Input
									label="Last Name"
									bind:value={form.guardian1_last_name}
									placeholder="Surname"
								/>
								<Input
									label="Relationship"
									bind:value={form.guardian1_relationship}
									placeholder="Mother, Father, etc."
								/>
								<Input
									label="Phone Number"
									bind:value={form.guardian1_phone_number}
									placeholder="+31 6 ..."
								/>
								<Input
									label="Email Address"
									type="email"
									bind:value={form.guardian1_email}
									placeholder="guardian@example.com"
									class="md:col-span-2"
								/>
							</div>
						</div>

						<!-- Guardian 2 -->
						<div class="rounded-2xl border border-border bg-bg/50 p-6">
							<h3 class="mb-4 text-lg font-semibold text-text">Secondary Guardian (Optional)</h3>
							<div class="grid gap-6 md:grid-cols-2">
								<Input
									label="First Name"
									bind:value={form.guardian2_first_name}
									placeholder="Name"
								/>
								<Input
									label="Last Name"
									bind:value={form.guardian2_last_name}
									placeholder="Surname"
								/>
								<Input
									label="Relationship"
									bind:value={form.guardian2_relationship}
									placeholder="Relationship"
								/>
								<Input
									label="Phone Number"
									bind:value={form.guardian2_phone_number}
									placeholder="+31 6 ..."
								/>
								<Input
									label="Email Address"
									type="email"
									bind:value={form.guardian2_email}
									placeholder="guardian2@example.com"
									class="md:col-span-2"
								/>
							</div>
						</div>
					</div>
				{:else if currentStep === 3}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">Education & Work</h2>

						<!-- Education -->
						<div class="mb-10 border-b border-border pb-10">
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-xl font-semibold text-text">Education</h3>
								<Checkbox
									label="Currently Enrolled"
									bind:checked={form.education_currently_enrolled}
								/>
							</div>
							<div class="grid gap-6 md:grid-cols-2">
								<Input
									label="Institution Name"
									bind:value={form.education_institution}
									placeholder="School / University"
									class="md:col-span-2"
								/>
								<Input
									label="Level"
									bind:value={form.education_level}
									placeholder="HBO, MBO, etc."
								/>
								<Input
									label="Mentor Name"
									bind:value={form.education_mentor_name}
									placeholder="Mentor Name"
								/>
								<Input
									label="Mentor Phone"
									bind:value={form.education_mentor_phone}
									placeholder="+31 6 ..."
								/>
								<Input
									label="Mentor Email"
									type="email"
									bind:value={form.education_mentor_email}
									placeholder="mentor@school.com"
								/>
								<Input
									label="Additional Notes"
									bind:value={form.education_additional_notes}
									placeholder="Any specific details..."
									class="md:col-span-2"
								/>
							</div>
						</div>

						<!-- Work -->
						<div>
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-xl font-semibold text-text">Work</h3>
								<Checkbox label="Currently Employed" bind:checked={form.work_currently_employed} />
							</div>
							<div class="grid gap-6 md:grid-cols-2">
								<Input
									label="Current Employer"
									bind:value={form.work_current_employer}
									placeholder="Company Name"
								/>
								<Input
									label="Position"
									bind:value={form.work_current_position}
									placeholder="Job Title"
								/>
								<Input
									label="Employer Phone"
									bind:value={form.work_employer_phone}
									placeholder="+31 6 ..."
								/>
								<Input
									label="Employer Email"
									type="email"
									bind:value={form.work_employer_email}
									placeholder="hr@company.com"
								/>
								<DatePicker label="Start Date" bind:value={form.work_start_date} />
								<Input
									label="Additional Notes"
									bind:value={form.work_additional_notes}
									placeholder="Work details..."
									class="md:col-span-2"
								/>
							</div>
						</div>
					</div>
				{:else if currentStep === 4}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">Care & Risks</h2>

						<!-- Additional Info -->
						<div class="mb-10 border-b border-border pb-10">
							<h3 class="mb-4 text-xl font-semibold text-text">Goals & Reason</h3>
							<div class="grid gap-6 md:grid-cols-2">
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<label class="ml-1 text-sm font-semibold text-text-muted">Client Goals</label>
										<Button variant="ghost" onclick={addGoal} class="h-8 gap-1 text-xs">
											<Plus class="h-3.5 w-3.5" /> Add Goal
										</Button>
									</div>
									{#if form.client_goals && form.client_goals.length > 0}
										<div class="space-y-2">
											{#each form.client_goals as _, index}
												<div class="flex gap-2">
													<Input
														bind:value={form.client_goals[index]}
														placeholder="Enter a goal..."
													/>
													{#if form.client_goals.length > 1}
														<button
															onclick={() => removeGoal(index)}
															class="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:bg-error/10 hover:text-error"
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
											No goals added.
										</div>
									{/if}
								</div>
								<Textarea
									label="Reason for Application"
									bind:value={form.application_reason}
									placeholder="Why is care being requested now?"
									rows={3}
								/>
							</div>
						</div>

						<!-- Care -->
						<div class="mb-10 border-b border-border pb-10">
							<h3 class="mb-4 text-xl font-semibold text-text">Care Needs</h3>
							<div class="grid gap-4 md:grid-cols-2">
								<Checkbox label="Protected Living" bind:checked={form.care_protected_living} />
								<Checkbox
									label="Assisted Independent Living"
									bind:checked={form.care_assisted_independent_living}
								/>
								<Checkbox
									label="Room Training Center"
									bind:checked={form.care_room_training_center}
								/>
								<Checkbox
									label="Ambulatory Guidance"
									bind:checked={form.care_ambulatory_guidance}
								/>
							</div>
						</div>

						<!-- Risks -->
						<div>
							<h3 class="mb-4 text-xl font-semibold text-text">Risk Factors</h3>
							<div class="grid gap-4 md:grid-cols-2">
								<Checkbox
									label="Aggressive Behavior"
									bind:checked={form.risk_aggressive_behavior}
								/>
								<Checkbox label="Suicidal / Self-harm" bind:checked={form.risk_suicidal_selfharm} />
								<Checkbox label="Substance Abuse" bind:checked={form.risk_substance_abuse} />
								<Checkbox label="Psychiatric Issues" bind:checked={form.risk_psychiatric_issues} />
								<Checkbox label="Criminal History" bind:checked={form.risk_criminal_history} />
								<Checkbox label="Flight Behavior" bind:checked={form.risk_flight_behavior} />
								<Checkbox label="Weapon Possession" bind:checked={form.risk_weapon_possession} />
								<Checkbox label="Sexual Behavior" bind:checked={form.risk_sexual_behavior} />
								<Checkbox
									label="Day/Night Rhythm Issues"
									bind:checked={form.risk_day_night_rhythm}
								/>
								<Checkbox label="Other" bind:checked={form.risk_other} />
							</div>
							{#if form.risk_other}
								<div class="mt-4" in:fade>
									<Input
										label="Description of Other Risks"
										bind:value={form.risk_other_description}
									/>
								</div>
							{/if}
							<div class="mt-4">
								<Input label="Additional Risk Notes" bind:value={form.risk_additional_notes} />
							</div>
						</div>
					</div>
				{:else if currentStep === 5}
					<div in:fade={{ duration: 300 }}>
						<h2 class="mb-6 text-2xl font-bold text-text">Documents</h2>
						<p class="mb-6 text-text-muted">Please upload any relevant documents.</p>

						<div class="grid gap-6 md:grid-cols-2">
							<FileUpload
								label="Referral Document"
								bind:fileId={form.document_referral}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label="Education Report"
								bind:fileId={form.document_education_report}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label="Psychiatric Report"
								bind:fileId={form.document_psychiatric_report}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label="Diagnosis Info"
								bind:fileId={form.document_diagnosis}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label="Safety Plan"
								bind:fileId={form.document_safety_plan}
								accept=".pdf,.doc,.docx"
							/>
							<FileUpload
								label="ID Copy"
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
					Previous
				</Button>
				{#if currentStep === steps.length - 1}
					<Button variant="primary" onclick={handleSubmit} isLoading={isSubmitting}
						>Submit Application</Button
					>
				{:else}
					<Button variant="primary" onclick={nextStep}>Next Step</Button>
				{/if}
			</div>
		</div>
	</div>
</div>
