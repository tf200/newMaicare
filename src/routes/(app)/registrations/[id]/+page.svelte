<script lang="ts">
	import {
		User,
		Building,
		ShieldAlert,
		FileText,
		Calendar,
		Phone,
		Mail,
		Clock,
		ArrowLeft,
		MapPin,
		Briefcase,
		GraduationCap,
		HeartPulse,
		AlertTriangle,
		CheckCircle2,
		Check,
		Download,
		ClipboardCheck,
		Target
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type {
		GetRegistrationFormResponse,
		ClientGender,
		EducationLevel,
		FormStatus
	} from '$lib/types/api';
	import ProcessRegistrationForm from '$lib/components/forms/ProcessRegistrationForm.svelte';
	import CreateIntakeWizard from '$lib/components/intake/CreateIntakeWizard.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props<{ data: { registration: GetRegistrationFormResponse } }>();
	const registration = $derived(data.registration);
	let showProcessForm = $state(false);
	let showIntakeWizard = $state(false);

	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatOnlyDate = (dateString: string | undefined | null) => {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'N/A';
		return date.toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	};

	const formatDateTime = (dateString: string | undefined | null) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleString('nl-NL', {
			weekday: 'long',
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatTime = (dateString: string | undefined | null) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleTimeString('nl-NL', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const calculateAge = (dob: string | undefined | null) => {
		if (!dob) return 'N/A';
		const birthDate = new Date(dob);
		if (isNaN(birthDate.getTime())) return 'N/A';
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const m = today.getMonth() - birthDate.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	};

	// Derived logic for styling
	const isHighRisk = $derived(registration.risk_count >= 3);
	const riskTone = $derived('bg-secondary/10 text-secondary border-secondary/20');

	const statusColors: Record<FormStatus, string> = {
		pending:
			'bg-secondary/10 text-secondary border border-secondary/20 shadow-sm shadow-secondary/10',
		processed: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
	};

	const genderColors: Record<ClientGender, string> = {
		male: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
		female: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
		other: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20'
	};

	const educationColors: Record<EducationLevel, string> = {
		primary: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20',
		secondary: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
		higher: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
		none: 'bg-rose-500/10 text-rose-700 border-rose-500/20'
	};

	const careStyles: Record<string, string> = {
		careProtectedLiving: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
		careAssistedIndependentLiving: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
		careRoomTrainingCenter: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
		careAmbulatoryGuidance: 'bg-amber-400/15 text-amber-700 border-amber-400/30'
	};

	const riskFactors = $derived([
		{
			label: 'Aggressive Behavior',
			key: 'risk_aggressive_behavior',
			value: registration.risk_aggressive_behavior
		},
		{
			label: 'Suicidal / Self-harm',
			key: 'risk_suicidal_selfharm',
			value: registration.risk_suicidal_selfharm
		},
		{
			label: 'Substance Abuse',
			key: 'risk_substance_abuse',
			value: registration.risk_substance_abuse
		},
		{
			label: 'Psychiatric Issues',
			key: 'risk_psychiatric_issues',
			value: registration.risk_psychiatric_issues
		},
		{
			label: 'Criminal History',
			key: 'risk_criminal_history',
			value: registration.risk_criminal_history
		},
		{
			label: 'Flight Behavior',
			key: 'risk_flight_behavior',
			value: registration.risk_flight_behavior
		},
		{
			label: 'Weapon Possession',
			key: 'risk_weapon_possession',
			value: registration.risk_weapon_possession
		},
		{
			label: 'Sexual Behavior',
			key: 'risk_sexual_behavior',
			value: registration.risk_sexual_behavior
		},
		{
			label: 'Day/Night Rhythm',
			key: 'risk_day_night_rhythm',
			value: registration.risk_day_night_rhythm
		}
	]);

	const careOptions = $derived([
		{
			label: 'Protected Living',
			key: 'careProtectedLiving',
			active: registration.care_protected_living
		},
		{
			label: 'Assisted Living',
			key: 'careAssistedIndependentLiving',
			active: registration.care_assisted_independent_living
		},
		{
			label: 'Room Training',
			key: 'careRoomTrainingCenter',
			active: registration.care_room_training_center
		},
		{
			label: 'Ambulatory Guidance',
			key: 'careAmbulatoryGuidance',
			active: registration.care_ambulatory_guidance
		}
	]);
</script>

<div class="space-y-6">
	<!-- Breadcrumb / Back -->
	<div>
		<a
			href="/registrations"
			class="inline-flex items-center gap-2 text-sm font-medium text-text-subtle transition-colors hover:text-text"
		>
			<ArrowLeft class="h-4 w-4" />
			{m.back_to_registrations()}
		</a>
	</div>

	<!-- Header Section -->
	<header class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
		<!-- Background Accents -->
		<div
			class="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-brand/10 to-transparent blur-3xl"
		></div>
		<div
			class="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr {isHighRisk
				? 'from-rose-500/10'
				: 'from-emerald-500/10'} to-transparent blur-3xl"
		></div>

		<div class="relative flex flex-col justify-between gap-6 p-8 md:flex-row md:items-start">
			<div class="space-y-4">
				<div class="flex items-center gap-4">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 text-2xl font-bold text-zinc-700 shadow-inner ring-1 ring-black/5 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-300 dark:ring-white/10"
					>
						{registration.client_first_name[0]}{registration.client_last_name[0]}
					</div>
					<div>
						<div class="flex items-center gap-3">
							<h1 class="text-3xl font-bold tracking-tight text-text">
								{registration.client_first_name}
								{registration.client_last_name}
							</h1>
							<span
								class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase {statusColors[
									registration.form_status
								]}"
							>
								{registration.form_status}
							</span>
						</div>
						<div class="mt-1 flex items-center gap-3">
							<p class="text-sm font-medium text-text-subtle">
								{m.bsn()}: {registration.client_bsn_number}
							</p>
							<span
								class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase {genderColors[
									registration.client_gender
								]}"
							>
								{registration.client_gender}
							</span>
						</div>
					</div>
				</div>

				<div class="flex flex-wrap gap-6 text-sm text-text-muted">
					<div class="flex items-center gap-2">
						<Calendar class="h-4 w-4 text-text-subtle" />
						<span>{m.submitted_at({ date: formatDate(registration.submitted_at) })}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-text-subtle" />
						<span>{m.last_updated({ date: formatDate(registration.updated_at) })}</span>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap gap-3">
				<button
					class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-surface px-4 text-sm font-semibold text-text shadow-sm ring-1 ring-border transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
				>
					<Download class="h-4 w-4 text-text-subtle" />
					{m.export_pdf()}
				</button>
				{#if registration.form_status === 'pending'}
					<button
						onclick={() => (showProcessForm = true)}
						class="hover:bg-brand-hover inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:shadow-lg hover:shadow-brand/30"
					>
						{m.process_application()}
					</button>
				{:else if registration.intake_form_id}
					<a
						href={`/intakes/${registration.intake_form_id}/assessments`}
						class="hover:bg-brand-hover inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:shadow-lg hover:shadow-brand/30"
					>
						<ClipboardCheck class="h-4 w-4" />
						{m.view_intake()}
					</a>
				{:else}
					<button
						onclick={() => (showIntakeWizard = true)}
						class="hover:bg-brand-hover inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:shadow-lg hover:shadow-brand/30"
					>
						<ClipboardCheck class="h-4 w-4" />
						{m.start_intake()}
					</button>
				{/if}
			</div>
		</div>
	</header>

	<ProcessRegistrationForm
		bind:open={showProcessForm}
		registrationId={registration.id}
		onProcessed={() => invalidateAll()}
	/>

	<CreateIntakeWizard
		bind:open={showIntakeWizard}
		{registration}
		onCreated={() => invalidateAll()}
	/>

	<div class="grid gap-6 xl:grid-cols-[1fr_340px]">
		<!-- Left Column: Details -->
		<div class="space-y-6">
			{#if registration.form_status === 'processed'}
				<!-- Intake Process Details -->
				<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
					<div class="mb-6 flex items-center justify-between gap-4">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
							>
								<Calendar class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-bold text-text">{m.intake_process_details()}</h2>
								<p class="text-xs text-text-subtle">
									{m.admission_type()}: {registration.admission_type || '—'}
								</p>
							</div>
						</div>

						{#if registration.intake_appointment_date}
							<div
								class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm"
							>
								<Check class="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
								{m.intake_scheduled()}
							</div>
						{:else}
							<div
								class="rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm"
							>
								⏳ {m.waiting_for_selection()}
							</div>
						{/if}
					</div>

					<div class="grid gap-6 md:grid-cols-2">
						<div class="space-y-4">
							{#if registration.intake_appointment_date}
								<div>
									<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
										>{m.confirmed_date()}</span
									>
									<div
										class="mt-2 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/20 dark:bg-emerald-900/10"
									>
										<div
											class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm"
										>
											<Clock class="h-5 w-5" />
										</div>
										<div>
											<p class="text-sm font-bold text-emerald-900 dark:text-emerald-100">
												{formatDateTime(registration.intake_appointment_date)}
											</p>
											<p class="text-xs text-emerald-700/70 dark:text-emerald-300/70">
												{formatTime(registration.intake_appointment_date)}
											</p>
										</div>
									</div>
								</div>
							{:else if registration.intake_options && registration.intake_options.length > 0}
								<div>
									<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
										>{m.proposed_dates()}</span
									>
									<div class="mt-3 space-y-2">
										{#each registration.intake_options as option (option)}
											<div
												class="flex items-center justify-between rounded-xl border border-border/50 bg-zinc-50/50 p-3 text-sm font-medium dark:bg-zinc-900/50"
											>
												<span>{formatDateTime(option)}</span>
											</div>
										{/each}
									</div>
									<p class="mt-3 flex items-start gap-2 text-xs text-amber-700">
										<ShieldAlert class="h-3.5 w-3.5 shrink-0" />
										{m.intake_selection_note()}
									</p>
								</div>
							{/if}
						</div>

						<div class="space-y-4">
							<div>
								<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
									>{m.location()}</span
								>
								<div
									class="mt-2 flex items-start gap-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50"
								>
									<MapPin class="mt-0.5 h-5 w-5 shrink-0 text-text-subtle" />
									<p class="text-sm font-medium text-text">
										{registration.intake_appointment_location || '—'}
									</p>
								</div>
							</div>

							<div>
								<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
									>{m.processed_by()}</span
								>
								<div class="mt-2 flex items-center gap-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
									>
										{registration.processed_by_employee_name?.[0] || '—'}
									</div>
									<p class="text-sm font-semibold text-text">
										{registration.processed_by_employee_name || '—'}
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>
			{/if}

			<!-- Risk Assessment Panel -->
			<section
				class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm"
			>
				{#if isHighRisk}
					<div
						class="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 to-orange-500 opacity-50"
					></div>
				{/if}

				<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"
						>
							<ShieldAlert class="h-5 w-5" />
						</div>
						<div>
							<h2 class="text-lg font-bold text-text">{m.risk_assessment()}</h2>
							<p class="text-xs text-text-subtle">{m.risk_assessment_description()}</p>
						</div>
					</div>
					<div class="rounded-full border px-3 py-1 text-xs font-bold shadow-sm {riskTone}">
						{registration.risk_count}
						{m.detected()}
					</div>
				</div>

				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
					{#each riskFactors as factor (factor.key)}
						<div
							class="group flex items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition-all duration-200 {factor.value
								? 'border-rose-200 bg-rose-50/50 text-rose-900 shadow-sm dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-100'
								: 'border-border/50 bg-zinc-50/50 text-text-muted hover:bg-white hover:shadow-sm dark:bg-zinc-900/50 dark:hover:bg-zinc-800'}"
						>
							<span class="truncate pr-2">{factor.label}</span>
							{#if factor.value}
								<AlertTriangle class="h-4 w-4 shrink-0 text-rose-500" />
							{:else}
								<CheckCircle2
									class="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-emerald-500 dark:text-zinc-600"
								/>
							{/if}
						</div>
					{/each}
				</div>
			</section>

			<!-- Motivation & Goals -->
			<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-6 flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
						<Target class="h-5 w-5" />
					</div>
					<div>
						<h2 class="text-lg font-bold text-text">Motivation & Goals</h2>
						<p class="text-xs text-text-subtle">Client's motivation and personal goals</p>
					</div>
				</div>

				<div class="grid gap-8 md:grid-cols-2">
					{#if registration.client_goals && registration.client_goals.length > 0}
						<div>
							<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
								>Client Goals</span
							>
							<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-text-muted">
								{#each registration.client_goals as goal}
									<li>{goal}</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if registration.application_reason}
						<div>
							<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
								>Application Reason</span
							>
							<p class="mt-2 text-sm leading-relaxed text-text-muted">
								{registration.application_reason}
							</p>
						</div>
					{/if}
				</div>
			</section>

			<!-- Care & Application -->
			<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-6 flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
						<HeartPulse class="h-5 w-5" />
					</div>
					<div>
						<h2 class="text-lg font-bold text-text">{m.care_application()}</h2>
						<p class="text-xs text-text-subtle">{m.admission_details()}</p>
					</div>
				</div>

				<div class="grid gap-8 md:grid-cols-2">
					<div class="space-y-6">
						<div>
							<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
								>{m.selected_care_options()}</span
							>
							<div class="mt-3 flex flex-wrap gap-2">
								{#each careOptions.filter((o) => o.active) as option (option.key)}
									<span
										class="inline-flex rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm {careStyles[
											option.key
										] ?? 'border-zinc-200 bg-zinc-100 text-zinc-700'}"
									>
										{option.label}
									</span>
								{/each}
							</div>
						</div>
					</div>

					<div>
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.risks_notes()}</span
						>
						<p class="mt-3 text-sm leading-relaxed text-text-muted">
							{registration.risk_additional_notes || 'No additional risk notes provided.'}
						</p>
					</div>
				</div>

				{#if registration.risk_other}
					<div class="mt-6 border-t border-border/50 pt-6">
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.other_risk_description()}</span
						>
						<div
							class="mt-3 rounded-2xl bg-zinc-50 p-4 text-sm leading-relaxed text-text-muted italic dark:bg-zinc-900/50"
						>
							"{registration.risk_other_description}"
						</div>
					</div>
				{/if}
			</section>

			<!-- Context & Background -->
			<section class="grid gap-6 md:grid-cols-2">
				<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
					<div class="mb-4 flex items-center gap-3">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
						>
							<Briefcase class="h-4 w-4" />
						</div>
						<h3 class="font-bold text-text">{m.work_education()}</h3>
					</div>
					<div class="space-y-4 text-sm">
						<div class="flex justify-between border-b border-border/50 pb-2">
							<span class="text-text-muted">{m.education_level()}</span>
							<span
								class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase {registration.education_level
									? educationColors[registration.education_level]
									: 'bg-zinc-100 text-zinc-500'}"
							>
								{registration.education_level || 'Not Specified'}
							</span>
						</div>
						<div class="flex justify-between border-b border-border/50 pb-2">
							<span class="text-text-muted">{m.currently_employed()}</span>
							<span class="font-medium text-text"
								>{registration.work_currently_employed ? 'Yes' : 'No'}</span
							>
						</div>
						{#if registration.work_current_employer}
							<div class="flex flex-col gap-1 pt-1">
								<span class="text-text-muted">{m.employer()}</span>
								<span class="font-medium text-text">{registration.work_current_employer}</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
					<div class="mb-4 flex items-center gap-3">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
						>
							<FileText class="h-4 w-4" />
						</div>
						<h3 class="font-bold text-text">{m.documents()}</h3>
					</div>
					<div class="space-y-2">
						{#each [{ name: 'Referral Letter', id: registration.document_referral }, { name: 'Education Report', id: registration.document_education_report }, { name: 'Psychiatric Report', id: registration.document_psychiatric_report }, { name: 'Diagnosis', id: registration.document_diagnosis }, { name: 'Safety Plan', id: registration.document_safety_plan }, { name: 'ID Copy', id: registration.document_id_copy }].filter((d) => d.id) as doc (doc.name)}
							<div
								class="group flex items-center gap-3 rounded-xl border border-transparent bg-zinc-50 p-2.5 transition-all hover:border-border hover:bg-white hover:shadow-sm dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
							>
								<div
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10"
								>
									<FileText class="h-4 w-4" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-text">{doc.name}</p>
									<p class="text-xs text-text-subtle">
										ID: {doc.id?.split('/').pop()?.substring(0, 8)}...
									</p>
								</div>
								<button
									class="rounded-lg p-1.5 text-text-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-100 hover:text-text dark:hover:bg-zinc-700"
								>
									<Download class="h-4 w-4" />
								</button>
							</div>
						{:else}
							<p class="text-sm py-4 text-center text-text-subtle">{m.no_documents()}</p>
						{/each}
					</div>
				</div>
			</section>
		</div>

		<!-- Right Column: Sidebar (1/3 width on XL) -->
		<div class="space-y-6">
			<!-- Client Details Card -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center justify-between">
					<h3 class="flex items-center gap-2 text-lg font-bold text-text">
						<User class="h-5 w-5 text-text-subtle" />
						{m.client_details()}
					</h3>
				</div>

				<div class="space-y-6">
					<div class="space-y-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
						<div class="flex items-start gap-3 text-sm">
							<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-text-subtle" />
							<span class="font-medium text-text">
								{registration.client_street}
								{registration.client_house_number}{registration.client_house_number_addition || ''}, {registration.client_postal_code},
								{registration.client_city}
							</span>
						</div>
						<div class="flex items-center gap-3 text-sm">
							<Phone class="h-4 w-4 shrink-0 text-text-subtle" />
							<a
								href="tel:{registration.client_phone_number}"
								class="text-text hover:text-brand hover:underline"
								>{registration.client_phone_number}</a
							>
						</div>
						<div class="flex items-center gap-3 text-sm">
							<Mail class="h-4 w-4 shrink-0 text-text-subtle" />
							<a
								href="mailto:{registration.client_email}"
								class="text-text hover:text-brand hover:underline">{registration.client_email}</a
							>
						</div>
					</div>

					<div>
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.personal_info()}</span
						>
						<div class="mt-3 space-y-3 text-sm">
							<div class="flex justify-between">
								<span class="text-text-muted">{m.date_of_birth()}</span>
								<span class="font-medium text-text"
									>{formatOnlyDate(registration.client_date_of_birth)}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="text-text-muted">{m.age()}</span>
								<span class="font-medium text-text"
									>{calculateAge(registration.client_date_of_birth)} {m.years()}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="text-text-muted">{m.gender()}</span>
								<span class="font-medium text-text">{registration.client_gender}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-text-muted">{m.bsn()}</span>
								<span class="font-medium text-text">{registration.client_bsn_number}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Referrer Details -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<h3 class="mb-4 flex items-center gap-2 text-base font-bold text-text">
					<Building class="h-4 w-4 text-text-subtle" />
					{m.referrer()}
				</h3>
				<div class="mb-4 flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-bold text-brand"
					>
						{registration.referrer_first_name[0]}
					</div>
					<div>
						<div class="font-bold text-text">
							{registration.referrer_first_name}
							{registration.referrer_last_name}
						</div>
						<div class="text-xs text-text-muted">{registration.referrer_organization}</div>
					</div>
				</div>
				<div class="space-y-2 border-t border-border/50 pt-3 text-sm">
					<div class="flex items-center gap-2 text-text-muted">
						<Briefcase class="h-3.5 w-3.5" />
						{m.job_title()}: {registration.referrer_job_title}
					</div>
					<a
						href="mailto:{registration.referrer_email}"
						class="flex items-center gap-2 text-text-muted transition-colors hover:text-brand"
					>
						<Mail class="h-3.5 w-3.5" />
						{registration.referrer_email}
					</a>
					<a
						href="tel:{registration.referrer_phone_number}"
						class="flex items-center gap-2 text-text-muted transition-colors hover:text-brand"
					>
						<Phone class="h-3.5 w-3.5" />
						{registration.referrer_phone_number}
					</a>
				</div>
			</div>

			<!-- Guardian Details -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<h3 class="mb-4 flex items-center gap-2 text-base font-bold text-text">
					<User class="h-4 w-4 text-text-subtle" />
					{m.guardian()}
				</h3>
				<div class="space-y-3 text-sm">
					<div class="flex items-center justify-between">
						<div class="font-medium text-text">
							{registration.guardian1_first_name}
							{registration.guardian1_last_name}
						</div>
						<span
							class="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800"
						>
							{registration.guardian1_relationship}
						</span>
					</div>
					<div class="space-y-2 border-t border-border/50 pt-2 text-text-muted">
						<a
							href="tel:{registration.guardian1_phone_number}"
							class="flex items-center gap-2 hover:text-brand"
							><Phone class="h-3.5 w-3.5" /> {registration.guardian1_phone_number}</a
						>
						<a
							href="mailto:{registration.guardian1_email}"
							class="flex items-center gap-2 hover:text-brand"
							><Mail class="h-3.5 w-3.5" /> {registration.guardian1_email}</a
						>
					</div>
				</div>

				{#if registration.guardian2_first_name}
					<div class="mt-4 space-y-3 border-t border-border/50 pt-4">
						<div class="flex items-center justify-between">
							<div class="font-medium text-text">
								{registration.guardian2_first_name}
								{registration.guardian2_last_name}
							</div>
							<span
								class="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800"
							>
								{registration.guardian2_relationship}
							</span>
						</div>
						<div class="space-y-2 text-text-muted">
							<a
								href="tel:{registration.guardian2_phone_number}"
								class="flex items-center gap-2 hover:text-brand"
								><Phone class="h-3.5 w-3.5" /> {registration.guardian2_phone_number}</a
							>
							<a
								href="mailto:{registration.guardian2_email}"
								class="flex items-center gap-2 hover:text-brand"
								><Mail class="h-3.5 w-3.5" /> {registration.guardian2_email}</a
							>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
