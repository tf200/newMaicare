<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import {
		Calendar,
		User,
		Activity,
		FileText,
		ShieldAlert,
		CheckCircle2,
		AlertTriangle,
		UserPlus,
		Target,
		ListChecks,
		Plus,
		Info,
		Building2,
		PenLine,
		Clock,
		Lock
	} from 'lucide-svelte';
	import { untrack } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import GoalAssessmentModal from '$lib/components/intake/GoalAssessmentModal.svelte';
	import IntakeConclusionModal from '$lib/components/intake/IntakeConclusionModal.svelte';
	import EditIntakeModal from '$lib/components/intake/EditIntakeModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { intakes } from '$lib/api/intakes';
	import type { PageData } from './$types';
	import type { CreateIntakeFormGoalsRequest, UpdateIntakeConclusionRequest } from '$lib/types/api';

	let { data }: { data: PageData } = $props();

	let intake = $state(untrack(() => data.intake));
	let isGoalModalOpen = $state(false);
	let isConclusionModalOpen = $state(false);
	let isEditModalOpen = $state(false);
	let isPromoting = $state(false);
	let actionSuccess = $state<string | null>(null);
	let actionError = $state<string | null>(null);

	const canProcessIntake = $derived.by(
		() => intake.intake_conclusion !== 'suitable' && !intake.has_client
	);
	const canPromoteToClient = $derived.by(
		() => intake.intake_conclusion === 'suitable' && !intake.has_client
	);
	const canEditGoals = $derived(!intake.has_client);
	const canEditIntake = $derived(!intake.has_client);

	// Sync state if data changes
	const breadcrumbs = getBreadcrumbsState();
	$effect(() => {
		intake = data.intake;
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: '/dashboard' },
			{ label: m.intakes(), href: '/intakes' },
			{ label: m.intake_details() }
		];
		return () => {
			breadcrumbs.items = [];
		};
	});

	const handleSaveIntake = async () => {
		try {
			actionError = null;
			actionSuccess = null;
			const refreshed = await intakes.getById(intake.id);
			intake = refreshed.data;
			actionSuccess = m.intake_form_updated();
		} catch (err) {
			actionError = err instanceof Error ? err.message : m.failed_refresh_intake();
			console.error('Failed to refresh intake data:', err);
		}
	};

	const handleSaveGoals = async (requestData: CreateIntakeFormGoalsRequest) => {
		if (!canEditGoals) {
			actionSuccess = null;
			actionError = m.goals_locked_error();
			isGoalModalOpen = false;
			return;
		}

		try {
			actionError = null;
			actionSuccess = null;
			await intakes.updateGoals(intake.id, requestData);
			const refreshed = await intakes.getById(intake.id);
			intake = refreshed.data;
			actionSuccess = m.goals_updated();
			isGoalModalOpen = false;
		} catch (err) {
			actionError = err instanceof Error ? err.message : m.failed_update_goals();
			console.error('Failed to update goals:', err);
		}
	};

	const handleUpdateConclusion = async (payload: UpdateIntakeConclusionRequest) => {
		try {
			actionError = null;
			actionSuccess = null;
			await intakes.updateConclusion(intake.id, payload);
			const refreshed = await intakes.getById(intake.id);
			intake = refreshed.data;
			actionSuccess = m.intake_conclusion_updated();
		} catch (err) {
			actionError = err instanceof Error ? err.message : m.failed_update_conclusion();
			console.error('Failed to update intake conclusion:', err);
		}
	};

	const handlePromoteToClient = async () => {
		try {
			actionError = null;
			actionSuccess = null;
			isPromoting = true;
			const response = await intakes.promote(intake.id);
			const refreshed = await intakes.getById(intake.id);
			intake = refreshed.data;
			actionSuccess = m.intake_promoted({
				contacts: String(response.data.emergency_contacts_created)
			});
		} catch (err) {
			actionError = err instanceof Error ? err.message : m.failed_promote_intake();
			console.error('Failed to promote intake to client:', err);
		} finally {
			isPromoting = false;
		}
	};

	// --- Styling Helpers ---
	const priorityColors = {
		high: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
		medium: 'bg-secondary/10 text-secondary border-secondary/20',
		low: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const formatFullDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};
</script>

<!-- Header -->
<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div></div>

		{#if canEditIntake}
			<button
				onclick={() => (isEditModalOpen = true)}
				class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-strong hover:shadow-lg hover:shadow-brand/30"
			>
				<PenLine class="h-4 w-4" />
				{m.edit_intake_form()}
			</button>
		{/if}
	</div>

	<!-- Main Header -->
	<header class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
		<div
			class="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-secondary/5 to-transparent"
		></div>
		<div class="relative flex flex-col justify-between gap-6 p-8 md:flex-row md:items-start">
			<div class="flex items-center gap-5">
				<div
					class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-2xl font-bold text-brand shadow-inner ring-1 ring-brand/10"
				>
					{intake.client_first_name[0]}{intake.client_last_name[0]}
				</div>
				<div>
					<h1 class="text-3xl font-bold tracking-tight text-text">{m.intake_details()}</h1>
					<div class="flex items-center gap-2">
						<p class="text-lg font-medium text-text-muted">
							{intake.client_first_name}
							{intake.client_last_name}
						</p>
						<span class="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-bold text-secondary">
							{intake.client_bsn_number}
						</span>
						{#if intake.has_client}
							<span
								class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/20"
							>
								{m.converted_to_client()}
							</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex flex-col items-stretch gap-2 md:items-end">
				{#if canProcessIntake}
					<button
						onclick={() => (isConclusionModalOpen = true)}
						class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-strong"
					>
						<CheckCircle2 class="h-4 w-4" />
						{m.process_intake()}
					</button>
				{:else if canPromoteToClient}
					<button
						onclick={handlePromoteToClient}
						disabled={isPromoting}
						class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-900"
					>
						<UserPlus class="h-4 w-4" />
						{isPromoting ? m.promoting() : m.promote_to_client()}
					</button>
				{/if}
			</div>
		</div>
	</header>

	{#if canPromoteToClient}
		<div
			class="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm"
		>
			<div class="flex items-start gap-2">
				<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
				<p>
					This intake is marked as suitable, but the client has not been added to the waiting list
					yet. Promote this intake to complete onboarding.
				</p>
			</div>
		</div>
	{/if}

	{#if actionSuccess}
		<div
			class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
		>
			{actionSuccess}
		</div>
	{/if}

	{#if actionError}
		<div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
			{actionError}
		</div>
	{/if}

	<div class="grid gap-6 xl:grid-cols-[1fr_380px]">
		<!-- Left Column -->
		<div class="space-y-6">
			<!-- Goals Section -->
			<section class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
				<div class="border-b border-border/60 bg-zinc-50/50 p-6 dark:bg-zinc-900/50">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary ring-1 ring-secondary/10"
							>
								<Target class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-bold text-text">{m.goals_assessments()}</h2>
								<p class="text-xs text-text-subtle">{m.maturity_matrix_description()}</p>
							</div>
						</div>
						{#if !canEditGoals}
							<div class="flex items-center gap-2 text-[10px] font-bold text-text-subtle uppercase">
								<Lock class="h-3.5 w-3.5" />
								<span>{m.goals_locked()}</span>
							</div>
						{:else}
							<Button
								variant="secondary"
								onclick={() => (isGoalModalOpen = true)}
								class="h-9 px-3 text-xs"
							>
								<span class="h-1.5 w-1.5 rounded-full bg-white/40"></span>
								{intake.intake_goals_assigned.length > 0 ? m.edit_goals() : m.add_goals()}
							</Button>
						{/if}
					</div>
				</div>

				<div class="p-6">
					{#if intake.intake_goals_assigned.length > 0}
						<!-- READ ONLY VIEW -->
						<div class="grid gap-6" in:fade>
							{#each intake.intake_goals_assigned as goalTopic (goalTopic.topic_id)}
								<div
									class="relative overflow-hidden rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all hover:border-secondary/30 hover:shadow-md dark:bg-zinc-900/50"
								>
									<div
										class="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-brand to-brand/20"
									></div>

									<div class="mb-4 flex items-start justify-between pl-2">
										<div>
											<h3 class="text-base font-bold text-text">{goalTopic.topic_name}</h3>
											{#if goalTopic.notes}
												<p class="mt-1 text-sm text-text-muted italic">"{goalTopic.notes}"</p>
											{/if}
										</div>
										<div class="flex flex-col items-end gap-1">
											<span class="text-[10px] font-bold tracking-wider text-text-subtle uppercase"
												>{m.maturity_level()}</span
											>
											<span
												class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-sm"
											>
												{goalTopic.current_level}
											</span>
										</div>
									</div>

									{#if goalTopic.proposed_goals.length > 0}
										<div class="mt-4 space-y-3 pl-2">
											{#each goalTopic.proposed_goals as goal, i (i)}
												<div
													class="group flex items-start gap-3 rounded-xl border border-border/50 bg-zinc-50 p-3 transition-colors hover:border-secondary/20 hover:bg-secondary/5 dark:bg-zinc-900"
												>
													<div
														class={`mt-1.5 h-2 w-2 rounded-full ${goal.priority === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : goal.priority === 'medium' ? 'bg-secondary' : 'bg-blue-500'}`}
													></div>
													<div class="flex-1">
														<div class="flex items-center justify-between">
															<p class="text-sm font-bold text-text">{goal.title}</p>
															<span
																class={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${priorityColors[goal.priority]}`}
															>
																{goal.priority}
															</span>
														</div>
														<p class="mt-0.5 text-xs text-text-muted group-hover:text-text-subtle">
															{goal.description}
														</p>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<!-- EMPTY STATE (Action Card) -->
						<div
							in:slide
							class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-zinc-50/50 py-12 text-center dark:bg-zinc-900/20"
						>
							<div
								class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary ring-4 ring-secondary/5"
							>
								<ListChecks class="h-8 w-8" />
							</div>
							<h3 class="text-lg font-bold text-text">{m.goals_pending()}</h3>
							<p class="mx-auto mt-2 max-w-sm text-sm text-text-muted">
								This client has not been assessed yet. Please complete the maturity matrix and
								define initial goals.
							</p>
							{#if !canEditGoals}
								<div
									class="mt-6 flex items-center gap-2 rounded-xl bg-zinc-100 px-6 py-3 text-sm font-bold text-text-subtle dark:bg-zinc-800"
								>
									<Lock class="h-5 w-5" />
									{m.goals_locked()}
								</div>
							{:else}
								<Button
									variant="secondary"
									onclick={() => (isGoalModalOpen = true)}
									class="mt-6 px-6 py-3"
								>
									<Plus class="h-5 w-5" />
									{m.start_assessment()}
								</Button>
							{/if}
						</div>
					{/if}
				</div>
			</section>

			<!-- Client Situation -->
			<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-6 flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
						<User class="h-5 w-5" />
					</div>
					<div>
						<h2 class="text-lg font-bold text-text">{m.client_situation()}</h2>
						<p class="text-xs text-text-subtle">{m.client_situation_description()}</p>
					</div>
				</div>

				<div class="grid gap-6 md:grid-cols-2">
					<div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.family_situation()}</span
						>
						<p class="mt-2 text-sm leading-relaxed text-text-muted">
							{intake.family_situation || 'N/A'}
						</p>
					</div>
					<div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.psychological_state()}</span
						>
						<p class="mt-2 text-sm leading-relaxed text-text-muted">
							{intake.psychological_state || 'N/A'}
						</p>
					</div>
				</div>
				<div class="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
					<span class="text-sm font-medium text-text-muted">{m.self_sufficiency_score()}</span>
					<div class="flex items-center gap-3">
						<div class="h-2.5 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
							<div
								class="h-full rounded-full bg-gradient-to-r from-brand to-secondary"
								style="width: {intake.self_sufficiency}%"
							></div>
						</div>
						<span class="text-sm font-bold text-text">{intake.self_sufficiency}/100</span>
					</div>
				</div>
			</section>

			<!-- Reference: Desired Goals (from Registration) -->
			<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-6 flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"
					>
						<Info class="h-5 w-5" />
					</div>
					<div>
						<h2 class="text-lg font-bold text-text">{m.registration_goals_reference()}</h2>
						<p class="text-xs text-text-subtle">{m.registration_goals_description()}</p>
					</div>
				</div>

				{#if intake.desired_goals && intake.desired_goals.length > 0}
					<div class="grid gap-3 sm:grid-cols-2">
						{#each intake.desired_goals as goal, i (i)}
							<div
								class="flex items-start gap-3 rounded-xl border border-border/50 bg-zinc-50/50 p-3 text-sm text-text-muted"
							>
								<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
								{goal}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-text-subtle italic">{m.no_goals_specified()}</p>
				{/if}
			</section>
		</div>

		<!-- Right Column: Sidebar -->
		<div class="space-y-6">
			<!-- Initial Assessment -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2">
					<Activity class="h-5 w-5 text-text-subtle" />
					<h3 class="text-lg font-bold text-text">{m.assessment_conclusion()}</h3>
				</div>

				<div class="space-y-5">
					<div
						class="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10"
					>
						<div class="flex items-center gap-2 text-rose-700 dark:text-rose-400">
							<ShieldAlert class="h-4 w-4" />
							<span class="text-xs font-bold tracking-wider uppercase">{m.risk_assessment()}</span>
						</div>
						<p class="mt-2 text-sm text-text-muted">{intake.risk_assessment || 'None'}</p>
					</div>

					<div>
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.conclusion()}</span
						>
						<div
							class="mt-2 flex items-center gap-2 rounded-xl bg-zinc-50 p-3 font-medium text-text dark:bg-zinc-900/50"
						>
							<CheckCircle2 class="h-4 w-4 text-emerald-500" />
							<span class="capitalize">{intake.intake_conclusion.replace('_', ' ')}</span>
						</div>
					</div>

					<div>
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.notes_label()}</span
						>
						<p class="mt-2 text-sm text-text-muted">
							{intake.intake_conclusion_notes || m.no_notes()}
						</p>
					</div>
				</div>
			</div>

			<!-- Location & Sender -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2">
					<Building2 class="h-5 w-5 text-text-subtle" />
					<h3 class="text-lg font-bold text-text">{m.logistics_placement()}</h3>
				</div>

				<div class="space-y-6">
					<div>
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.intake_date()}</span
						>
						<div class="mt-2 flex items-center gap-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
							<Calendar class="h-4 w-4 text-secondary" />
							<span class="text-sm font-medium text-text-muted"
								>{formatDate(intake.date_of_intake)}</span
							>
						</div>
					</div>

					<div>
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.assigned_location()}</span
						>
						{#if intake.location}
							<div class="mt-2 rounded-2xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900/50">
								<p class="font-bold text-text">{intake.location.name}</p>
								<p class="mt-1 text-text-muted">
									{intake.location.street}
									{intake.location.house_number}{intake.location.house_number_addition || ''}
								</p>
								<p class="text-text-muted">{intake.location.postal_code} {intake.location.city}</p>
							</div>
						{:else}
							<p
								class="mt-2 rounded-xl border border-dashed border-border py-4 text-center text-sm text-text-subtle italic"
							>
								{m.no_location_assigned()}
							</p>
						{/if}
					</div>

					<div>
						<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
							>{m.referrer_sender()}</span
						>
						<div class="mt-2 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 font-bold text-brand"
							>
								{intake.sender_name?.[0] || '?'}
							</div>
							<p class="text-sm font-semibold text-text">{intake.sender_name || 'N/A'}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Logistics & Details -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2">
					<FileText class="h-5 w-5 text-text-subtle" />
					<h3 class="text-lg font-bold text-text">{m.intake_configuration()}</h3>
				</div>

				<div class="space-y-4 text-sm">
					<div class="flex justify-between border-b border-border/50 pb-2">
						<span class="text-text-muted">{m.care_type()}</span>
						<span class="font-medium text-text capitalize"
							>{intake.care_type.replace(/_/g, ' ')}</span
						>
					</div>
					<div class="flex justify-between border-b border-border/50 pb-2">
						<span class="text-text-muted">{m.evaluation_label()}</span>
						<span class="font-medium text-text"
							>{m.every_weeks({ weeks: String(intake.evaluation_intervals_weeks) })}</span
						>
					</div>
					<div class="pt-1">
						<span class="mb-2 block text-text-muted">{m.participants()}</span>
						<div class="flex flex-wrap gap-1.5">
							{#each intake.intake_participants as participant, i (i)}
								<span
									class="rounded-md border border-border bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 capitalize dark:bg-zinc-800 dark:text-zinc-400"
								>
									{participant}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Signature -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2">
					<PenLine class="h-5 w-5 text-text-subtle" />
					<h3 class="text-lg font-bold text-text">{m.signature()}</h3>
				</div>
				<div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
					<p class="text-xs font-bold tracking-wider text-text-subtle uppercase">{m.signed_by()}</p>
					<p class="mt-2 text-base font-medium text-text italic">
						{intake.signature || m.not_signed()}
					</p>
				</div>
			</div>

			<!-- Metadata -->
			<div class="space-y-2 px-2">
				<div class="flex items-center gap-2 text-[10px] font-bold text-text-subtle uppercase">
					<Clock class="h-3 w-3" />
					{m.timeline()}
				</div>
				<div class="space-y-1 text-[11px] text-text-subtle">
					<p>{m.created()}: {formatFullDate(intake.created_at)}</p>
					<p>{m.updated()}: {formatFullDate(intake.updated_at)}</p>
				</div>
			</div>
		</div>
	</div>
</div>

<GoalAssessmentModal
	bind:open={isGoalModalOpen}
	intakeId={intake.id}
	initialGoals={intake.intake_goals_assigned}
	onSave={handleSaveGoals}
	onCancel={() => (isGoalModalOpen = false)}
/>

<IntakeConclusionModal
	bind:open={isConclusionModalOpen}
	onSave={handleUpdateConclusion}
	onCancel={() => (isConclusionModalOpen = false)}
/>

<EditIntakeModal bind:open={isEditModalOpen} {intake} onSave={handleSaveIntake} />
