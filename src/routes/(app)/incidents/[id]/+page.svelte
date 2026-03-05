<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import {
		ShieldAlert,
		Calendar,
		Clock,
		User,
		MapPin,
		AlertTriangle,
		FileText,
		CheckCircle2,
		XCircle,
		ChevronRight,
		ArrowLeft,
		Mail,
		Info,
		Stethoscope,
		Activity,
		Bell,
		ShieldCheck,
		History,
		Pencil
	} from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { confirmIncident } from '$lib/api/incidents';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateIncidentForm from '$lib/components/forms/CreateIncidentForm.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { IncidentDetailLoadResult } from './+page';
	import type {
		IncidentType,
		IncidentSeverity,
		ReporterInvolvement,
		InformedParty,
		RecurrenceRisk,
		CauseCategory,
		PhysicalInjury,
		PsychologicalDamage,
		NeededConsultation,
		FollowUpAction
	} from '$lib/types/incidents';

	let { data } = $props<{
		data: {
			incidentData: Promise<IncidentDetailLoadResult>;
		};
	}>();

	const incidentDataPromise = $derived(data.incidentData);
	let isConfirmModalOpen = $state(false);
	let isEditModalOpen = $state(false);
	let isConfirmingIncident = $state(false);
	let confirmIncidentError = $state<string | null>(null);

	const openConfirmModal = () => {
		confirmIncidentError = null;
		isConfirmModalOpen = true;
	};

	const closeConfirmModal = () => {
		if (isConfirmingIncident) return;
		isConfirmModalOpen = false;
	};

	const handleConfirmIncident = async (incidentId: string) => {
		if (isConfirmingIncident) return;
		confirmIncidentError = null;
		isConfirmingIncident = true;

		try {
			await confirmIncident(incidentId);
			isConfirmModalOpen = false;
			await invalidateAll();
		} catch (error) {
			confirmIncidentError = error instanceof Error ? error.message : m.failed_confirm_incident();
		} finally {
			isConfirmingIncident = false;
		}
	};

	const handleIncidentUpdated = async () => {
		isEditModalOpen = false;
		await invalidateAll();
	};

	// --- Helpers ---
	const formatDate = (dateString?: string) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatSimpleDate = (dateString?: string) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const incidentTypeLabels: Record<IncidentType, () => string> = {
		passing_away: () => m.passing_away(),
		self_harm: () => m.self_harm(),
		violence: () => m.violence(),
		fire_water_damage: () => m.fire_water_damage(),
		accident: () => m.accident(),
		client_absence: () => m.client_absence(),
		medicines: () => m.medicines(),
		organization: () => m.organization(),
		use_prohibited_substances: () => m.use_prohibited_substances(),
		other: () => m.other()
	};

	const severityLabels: Record<IncidentSeverity, () => string> = {
		near_incident: () => m.near_incident(),
		less_serious: () => m.less_serious(),
		serious: () => m.serious(),
		fatal: () => m.fatal()
	};

	const severityColors: Record<IncidentSeverity, string> = {
		near_incident: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
		less_serious: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
		serious: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
		fatal: 'bg-rose-500/10 text-rose-700 border-rose-500/20'
	};

	const reporterInvolvementLabels: Record<ReporterInvolvement, () => string> = {
		directly_involved: () => m.directly_involved(),
		witness: () => m.witness(),
		found_afterwards: () => m.found_afterwards(),
		alarmed: () => m.alarmed()
	};

	const informedPartyLabels: Record<InformedParty, () => string> = {
		parents_guardians: () => m.parents_guardians(),
		care_coordinator: () => m.care_coordinator(),
		referrer: () => m.referrer(),
		healthcare_provider: () => m.healthcare_provider(),
		inspectorate: () => m.inspectorate(),
		police: () => m.police(),
		other: () => m.other()
	};

	const recurrenceRiskLabels: Record<RecurrenceRisk, () => string> = {
		very_low: () => m.very_low(),
		means: () => m.medium(),
		high: () => m.high(),
		very_high: () => m.very_high()
	};

	const recurrenceRiskColors: Record<RecurrenceRisk, string> = {
		very_low: 'text-emerald-600',
		means: 'text-amber-600',
		high: 'text-orange-600',
		very_high: 'text-rose-600'
	};

	const causeCategoryLabels: Record<CauseCategory, () => string> = {
		internal_personal: () => m.internal_personal(),
		external_environmental: () => m.external_environmental(),
		organizational: () => m.organizational(),
		technical: () => m.technical(),
		employee_related: () => m.employee_related(),
		client_related: () => m.client_related(),
		other: () => m.other()
	};

	const physicalInjuryLabels: Record<PhysicalInjury, () => string> = {
		no_injuries: () => m.no_injuries(),
		not_noticeable_yet: () => m.not_noticeable_yet(),
		bruising_swelling: () => m.bruising_swelling(),
		skin_injury: () => m.skin_injury(),
		broken_bones: () => m.broken_bones(),
		shortness_of_breath: () => m.shortness_of_breath(),
		death: () => m.death(),
		other: () => m.other()
	};

	const psychologicalDamageLabels: Record<PsychologicalDamage, () => string> = {
		no: () => m.no(),
		not_noticeable_yet: () => m.not_noticeable_yet(),
		drowsiness: () => m.drowsiness(),
		unrest: () => m.unrest(),
		other: () => m.other()
	};

	const neededConsultationLabels: Record<NeededConsultation, () => string> = {
		no: () => m.no(),
		not_clear: () => m.not_clear(),
		hospitalization: () => m.hospitalization(),
		consult_gp: () => m.consult_gp()
	};

	const followUpActionLabels: Record<FollowUpAction, () => string> = {
		medical_check: () => m.medical_check(),
		family_contact: () => m.family_contact(),
		internal_review: () => m.internal_review(),
		official_report: () => m.official_report(),
		notify_inspectorate: () => m.notify_inspectorate(),
		other: () => m.other()
	};
</script>

<div class="space-y-6">
	{#await incidentDataPromise}
		<div class="space-y-4">
			<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
			<div class="h-[200px] animate-pulse rounded-3xl border border-border bg-surface"></div>
			<div class="grid gap-6 md:grid-cols-2">
				<div class="h-[300px] animate-pulse rounded-3xl border border-border bg-surface"></div>
				<div class="h-[300px] animate-pulse rounded-3xl border border-border bg-surface"></div>
			</div>
		</div>
	{:then incidentData}
		{#if incidentData.loadError}
			<InlineErrorBanner message={incidentData.loadError} onRetry={() => invalidateAll()} />
		{:else if incidentData.incident}
			{@const incident = incidentData.incident as import('$lib/types/incidents').IncidentDetail}
			<CreateIncidentForm
				bind:open={isEditModalOpen}
				incidentId={incident.id}
				initialIncident={incident}
				onCreated={handleIncidentUpdated}
			/>
			<Modal
				bind:open={isConfirmModalOpen}
				title={m.confirm_and_notify()}
				description={m.confirm_and_notify_description()}
				size="md"
			>
				<div class="space-y-4">
					<div class="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4">
						<div class="flex items-start gap-3">
							<span
								class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
							>
								<Mail class="h-4 w-4" />
							</span>
							<div class="space-y-2">
								<p class="text-sm font-semibold text-amber-900">
									{m.are_you_sure_confirm()}
								</p>
								<p class="text-sm text-amber-800">
									{m.confirm_incident_warning()}
								</p>
							</div>
						</div>
					</div>

					{#if confirmIncidentError}
						<InlineErrorBanner
							message={confirmIncidentError}
							onRetry={() => handleConfirmIncident(incident.id)}
						/>
					{/if}
				</div>

				{#snippet footer()}
					<div class="flex justify-end gap-3">
						<Button variant="ghost" onclick={closeConfirmModal} disabled={isConfirmingIncident}
							>{m.cancel()}</Button
						>
						<Button
							onclick={() => handleConfirmIncident(incident.id)}
							isLoading={isConfirmingIncident}
							disabled={isConfirmingIncident}
						>
							{isConfirmingIncident ? m.confirming_incident() : m.yes_confirm_incident()}
						</Button>
					</div>
				{/snippet}
			</Modal>

			<!-- Breadcrumbs & Actions -->
			<div class="flex items-center justify-between">
				<nav class="flex items-center gap-2 text-sm font-medium text-text-subtle">
					<a href="/incidents" class="flex items-center gap-1 transition-colors hover:text-text">
						<ArrowLeft class="h-4 w-4" />
						{m.incidents()}
					</a>
					<ChevronRight class="h-4 w-4" />
					<span class="text-text">{m.incident_detail()}</span>
				</nav>

				<div class="flex flex-wrap items-center justify-end gap-2">
					<button
						class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
					>
						<FileText class="h-4 w-4" />
						{m.export_pdf()}
					</button>
					<button
						onclick={() => (isEditModalOpen = true)}
						class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
					>
						<Pencil class="h-4 w-4" />
						{m.edit_incident()}
					</button>
					{#if !incident.isConfirmed}
						<button
							onclick={openConfirmModal}
							class="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-strong dark:text-zinc-900"
						>
							<CheckCircle2 class="h-4 w-4" />
							{m.confirm_incident()}
						</button>
					{/if}
				</div>
			</div>

			<!-- Hero Header -->
			<header
				class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
			>
				<div
					class="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-rose-500/5 to-transparent"
				></div>
				<div class="relative flex flex-col justify-between gap-8 p-8 lg:flex-row lg:items-center">
					<div class="flex items-center gap-6">
						<div
							class={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl shadow-inner ring-1 ${
								incident.severity === 'fatal' || incident.severity === 'serious'
									? 'bg-rose-500/20 text-rose-600 ring-rose-500/10'
									: 'bg-amber-500/20 text-amber-600 ring-amber-500/10'
							}`}
						>
							<ShieldAlert class="h-10 w-10" />
						</div>
						<div>
							<div class="flex flex-wrap items-center gap-3">
								<h1 class="text-3xl font-bold tracking-tight text-text">
									{incidentTypeLabels[incident.incidentType]()}
								</h1>
								<span
									class={`rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase ${severityColors[incident.severity]}`}
								>
									{severityLabels[incident.severity]()}
								</span>
								{#if incident.isConfirmed}
									<span
										class="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold tracking-wider text-emerald-700 uppercase"
									>
										<CheckCircle2 class="h-3 w-3" />
										{m.confirmed()}
									</span>
								{:else}
									<span
										class="flex items-center gap-1 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-3 py-1 text-xs font-bold tracking-wider text-zinc-700 uppercase"
									>
										<Clock class="h-3 w-3" />
										{m.pending()}
									</span>
								{/if}
							</div>
							<div
								class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-subtle"
							>
								<span class="flex items-center gap-1.5 font-medium text-text">
									<User class="h-4 w-4 text-text-subtle" />
									{incident.clientFirstName}
									{incident.clientLastName}
								</span>
								<span class="flex items-center gap-1.5">
									<Calendar class="h-4 w-4" />
									{formatDate(incident.occurredAt)}
								</span>
								<span class="flex items-center gap-1.5">
									<MapPin class="h-4 w-4" />
									{incident.locationName}
								</span>
							</div>
						</div>
					</div>

					<div class="flex flex-wrap gap-4 border-t border-border/40 pt-6 lg:border-t-0 lg:pt-0">
						<div class="flex flex-col">
							<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
								>{m.reporter()}</span
							>
							<span class="text-sm font-bold text-text"
								>{incident.employeeFirstName} {incident.employeeLastName}</span
							>
						</div>
						<div class="h-8 w-px bg-border lg:block"></div>
						<div class="flex flex-col">
							<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
								>{m.involvement()}</span
							>
							<span class="text-sm font-bold text-text"
								>{reporterInvolvementLabels[
									incident.reporterInvolvement || 'directly_involved'
								]()}</span
							>
						</div>
					</div>
				</div>
			</header>

			<!-- Main Grid -->
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Left Column: Summary & Causes -->
				<div class="space-y-6">
					<!-- Incident Summary -->
					<section class="rounded-3xl border border-border bg-surface shadow-sm">
						<div class="flex items-center justify-between border-b border-border/50 p-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600"
								>
									<FileText class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-text">{m.incident_summary()}</h3>
							</div>
						</div>
						<div class="space-y-6 p-6">
							<div>
								<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.explanation()}
								</p>
								<p class="mt-2 text-sm leading-relaxed text-text">
									{incident.incidentExplanation || m.no_explanation_provided()}
								</p>
							</div>
							<div
								class="flex items-center justify-between rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50"
							>
								<div>
									<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
										{m.recurrence_risk()}
									</p>
									<p
										class={`mt-1 text-sm font-bold ${recurrenceRiskColors[incident.recurrenceRisk]}`}
									>
										{recurrenceRiskLabels[incident.recurrenceRisk]()}
									</p>
								</div>
								<AlertTriangle
									class={`h-8 w-8 opacity-20 ${recurrenceRiskColors[incident.recurrenceRisk]}`}
								/>
							</div>
						</div>
					</section>

					<!-- Causes -->
					<section class="rounded-3xl border border-border bg-surface shadow-sm">
						<div class="flex items-center justify-between border-b border-border/50 p-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"
								>
									<Info class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-text">{m.causes_context()}</h3>
							</div>
						</div>
						<div class="space-y-6 p-6">
							<div>
								<p class="mb-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.cause_categories()}
								</p>
								<div class="flex flex-wrap gap-2">
									{#each incident.causeCategories as category (category)}
										<span
											class="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-muted dark:bg-zinc-900"
										>
											{causeCategoryLabels[category]()}
										</span>
									{/each}
								</div>
							</div>
							<div>
								<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.detailed_cause()}
								</p>
								<p class="mt-2 text-sm leading-relaxed text-text">
									{incident.causeExplanation || m.no_cause_explanation()}
								</p>
							</div>
						</div>
					</section>

					<!-- Notifications -->
					<section class="rounded-3xl border border-border bg-surface shadow-sm">
						<div class="flex items-center justify-between border-b border-border/50 p-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600"
								>
									<Bell class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-text">{m.notifications()}</h3>
							</div>
						</div>
						<div class="space-y-6 p-6">
							<div>
								<p class="mb-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.informed_parties()}
								</p>
								<div class="flex flex-wrap gap-2">
									{#each incident.informedParties as party (party)}
										<span
											class="flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400"
										>
											<CheckCircle2 class="h-3.5 w-3.5" />
											{informedPartyLabels[party]()}
										</span>
									{/each}
								</div>
							</div>
							{#if incident.emails.length > 0}
								<div>
									<p class="mb-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
										{m.notification_emails()}
									</p>
									<div class="space-y-2">
										{#each incident.emails as email (email)}
											<div class="flex items-center gap-2 text-sm text-text-muted">
												<Mail class="h-4 w-4 opacity-60" />
												{email}
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</section>
				</div>

				<!-- Right Column: Impact & Follow-up -->
				<div class="space-y-6">
					<!-- Impact -->
					<section class="rounded-3xl border border-border bg-surface shadow-sm">
						<div class="flex items-center justify-between border-b border-border/50 p-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600"
								>
									<Activity class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-text">{m.impact_injury()}</h3>
							</div>
						</div>
						<div class="space-y-6 p-6">
							<div class="grid gap-6 sm:grid-cols-2">
								<div
									class="rounded-2xl border border-border/50 bg-zinc-50/50 p-4 dark:bg-zinc-900/50"
								>
									<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
										{m.physical_injury()}
									</p>
									<p class="mt-1 text-sm font-bold text-text">
										{physicalInjuryLabels[incident.physicalInjury]()}
									</p>
								</div>
								<div
									class="rounded-2xl border border-border/50 bg-zinc-50/50 p-4 dark:bg-zinc-900/50"
								>
									<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
										{m.psychological_damage()}
									</p>
									<p class="mt-1 text-sm font-bold text-text">
										{psychologicalDamageLabels[incident.psychologicalDamage]()}
									</p>
								</div>
							</div>
							{#if incident.physicalInjuryDesc}
								<div>
									<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
										{m.injury_description()}
									</p>
									<p class="mt-2 text-sm text-text">{incident.physicalInjuryDesc}</p>
								</div>
							{/if}
							{#if incident.psychologicalDamageDesc}
								<div>
									<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
										{m.damage_description()}
									</p>
									<p class="mt-2 text-sm text-text">{incident.psychologicalDamageDesc}</p>
								</div>
							{/if}
							<div
								class="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
							>
								<div class="flex items-center gap-3">
									<Stethoscope class="h-5 w-5 text-amber-600" />
									<div>
										<p class="text-[10px] font-bold tracking-widest text-amber-600 uppercase">
											{m.consultation_needed()}
										</p>
										<p class="text-sm font-bold text-amber-700">
											{neededConsultationLabels[incident.neededConsultation]()}
										</p>
									</div>
								</div>
							</div>
						</div>
					</section>

					<!-- Follow-up -->
					<section class="rounded-3xl border border-border bg-surface shadow-sm">
						<div class="flex items-center justify-between border-b border-border/50 p-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"
								>
									<History class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-text">{m.follow_up_actions()}</h3>
							</div>
						</div>
						<div class="space-y-6 p-6">
							<div>
								<p class="mb-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.actions_taken()}
								</p>
								<div class="flex flex-wrap gap-2">
									{#each incident.followUpActions as action (action)}
										<span
											class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
										>
											{followUpActionLabels[action]()}
										</span>
									{/each}
								</div>
							</div>
							<div>
								<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.follow_up_notes()}
								</p>
								<p class="mt-2 text-sm leading-relaxed text-text">
									{incident.followUpNotes || m.no_follow_up_notes()}
								</p>
							</div>
							<div class="flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
								{#if incident.isEmployeeAbsent}
									<XCircle class="h-5 w-5 text-rose-500" />
									<p class="text-sm font-bold text-rose-600">{m.employee_absent_incident()}</p>
								{:else}
									<CheckCircle2 class="h-5 w-5 text-emerald-500" />
									<p class="text-sm font-bold text-text-muted">{m.no_employee_absence()}</p>
								{/if}
							</div>
						</div>
					</section>

					<!-- Measures & Prevention -->
					<section class="rounded-3xl border border-border bg-surface shadow-sm">
						<div class="flex items-center justify-between border-b border-border/50 p-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
								>
									<ShieldCheck class="h-5 w-5" />
								</div>
								<h3 class="text-lg font-bold text-text">{m.measures_prevention()}</h3>
							</div>
						</div>
						<div class="space-y-6 p-6">
							<div>
								<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.measures_taken()}
								</p>
								<p class="mt-2 text-sm leading-relaxed text-text">
									{incident.incidentTakenMeasures || m.no_measures_recorded()}
								</p>
							</div>
							<div>
								<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.prevention_steps()}
								</p>
								<p class="mt-2 text-sm leading-relaxed text-text">
									{incident.incidentPreventSteps || m.no_prevention_steps()}
								</p>
							</div>
						</div>
					</section>

					<!-- Audit Meta -->
					<div class="rounded-3xl border border-border bg-zinc-50/50 p-6 dark:bg-zinc-900/20">
						<div class="grid gap-4 text-[11px] text-text-muted">
							<div class="flex items-center justify-between">
								<span class="font-bold tracking-widest uppercase">{m.incident_id()}</span>
								<span class="font-mono">{incident.id}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="font-bold tracking-widest uppercase">{m.created_at()}</span>
								<span>{formatDate(incident.createdAt)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="font-bold tracking-widest uppercase">{m.updated()}</span>
								<span>{formatDate(incident.updatedAt)}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Additional Details (Full Width) -->
			{#if incident.additionalDetails}
				<section class="rounded-3xl border border-border bg-surface shadow-sm">
					<div class="flex items-center justify-between border-b border-border/50 p-6">
						<div class="flex items-center gap-3">
							<Info class="h-5 w-5 text-text-subtle" />
							<h3 class="text-lg font-bold text-text">{m.additional_details()}</h3>
						</div>
					</div>
					<div class="p-6">
						<p class="text-sm leading-relaxed text-text">
							{incident.additionalDetails}
						</p>
					</div>
				</section>
			{/if}
		{/if}
	{/await}
</div>
