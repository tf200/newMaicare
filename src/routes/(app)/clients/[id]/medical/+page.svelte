<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import {
		ClipboardList,
		HeartPulse,
		Plus,
		Eye,
		Pencil
	} from 'lucide-svelte';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import CreateDiagnosisModal from '$lib/components/forms/CreateDiagnosisModal.svelte';
	import CreateMedicationOrderModal from '$lib/components/forms/CreateMedicationOrderModal.svelte';
	import EditDiagnosisModal from '$lib/components/forms/EditDiagnosisModal.svelte';
	import EditMedicationOrderModal from '$lib/components/forms/EditMedicationOrderModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type {
		ClientDiagnosisResponse,
		ClientMedicationOrderResponse,
		DiagnosisSeverity,
		DiagnosisStatus,
		MedicationAdminMode
	} from '$lib/types/api';
	import type { ClientMedicalOverviewLoadResult } from './+page';

	let { data } = $props<{
		data: {
			medicalOverviewData: Promise<ClientMedicalOverviewLoadResult>;
			clientName?: string;
		};
	}>();

	const medicalOverviewDataPromise = $derived(data.medicalOverviewData);
	
	const breadcrumbs = getBreadcrumbsState();
	$effect(() => {
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: '/dashboard' },
			{ label: m.clients(), href: '/clients' },
			{ label: data.clientName ?? m.breadcrumb_client_detail(), href: `/clients/${page.params.id}` },
			{ label: m.breadcrumb_medical() }
		];
		return () => { breadcrumbs.items = []; };
	});

	let showCreateDiagnosisModal = $state(false);
	let showCreateMedicationModal = $state(false);
	let showEditMedicationModal = $state(false);
	let showEditDiagnosisModal = $state(false);
	let selectedMedicationOrderId = $state<string | null>(null);
	let selectedDiagnosisId = $state<string | null>(null);

	interface MedicationRow {
		id: string;
		medication_name: string;
		dosage_text: string;
		admin_mode: MedicationAdminMode;
		responsible_name: string | null;
		is_prn: boolean;
		prn_indication: string | null;
		is_critical: boolean;
		frequency_text: string | null;
		schedule: Array<{ time: string }>;
		start_date: string;
		end_date: string | null;
		diagnosis_title: string | null;
		diagnosis_code_system: string | null;
		diagnosis_code: string | null;
		notes: string | null;
	}

	const medicationColumns: DataTableColumn[] = [
		{ key: 'medication', label: m.medication(), width: '220px' },
		{ key: 'dosage', label: m.dosage(), width: '200px' },
		{ key: 'administration', label: m.administration(), width: '180px' },
		{ key: 'schedule', label: m.schedule(), width: '200px' },
		{ key: 'timeline', label: m.timeline(), width: '160px' },
		{ key: 'diagnosis', label: m.diagnosis_link(), width: '220px' },
		{ key: 'actions', label: '', align: 'right', width: '100px' }
	];

	const diagnosisStatusWeight: Record<DiagnosisStatus, number> = {
		confirmed: 0,
		suspected: 1,
		resolved: 2,
		ruled_out: 3
	};

	const adminModeBadge: Record<MedicationAdminMode, string> = {
		self: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
		staff: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
		shared: 'bg-amber-500/10 text-amber-700 border-amber-500/20'
	};

	const diagnosisStatusBadge: Record<DiagnosisStatus, string> = {
		confirmed: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
		suspected: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
		resolved: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20',
		ruled_out: 'bg-rose-500/10 text-rose-700 border-rose-500/20'
	};

	const severityBadge: Record<DiagnosisSeverity, string> = {
		mild: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
		moderate: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
		severe: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
		unknown: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20'
	};

	const formatDate = (value: string | null) => {
		if (!value) return m.ongoing();
		return new Intl.DateTimeFormat('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(value));
	};

	const formatCodeLine = (codeSystem: string, code: string) => `${codeSystem} ${code}`;

	const toMedicationRows = (medicationOrders: ClientMedicationOrderResponse[]): MedicationRow[] =>
		medicationOrders
			.slice()
			.sort(
				(left, right) =>
					Number(right.is_critical) - Number(left.is_critical) ||
					left.medication_name.localeCompare(right.medication_name)
			)
			.map((order) => ({
				id: order.id,
				medication_name: order.medication_name,
				dosage_text: order.dosage_text,
				admin_mode: order.admin_mode,
				responsible_name:
					order.admin_mode === 'self'
						? null
						: [order.responsible_employee_first_name, order.responsible_employee_last_name]
								.filter(Boolean)
								.join(' ') || null,
				is_prn: order.is_prn,
				prn_indication: order.prn_indication,
				is_critical: order.is_critical,
				frequency_text: order.frequency_text,
				schedule: order.schedule,
				start_date: order.start_date,
				end_date: order.end_date,
				diagnosis_title: order.diagnosis_title,
				diagnosis_code_system: order.diagnosis_code_system,
				diagnosis_code: order.diagnosis_code,
				notes: order.notes
			}));

	const sortDiagnoses = (diagnoses: ClientDiagnosisResponse[]): ClientDiagnosisResponse[] =>
		diagnoses
			.slice()
			.sort(
				(left, right) =>
					diagnosisStatusWeight[left.status] - diagnosisStatusWeight[right.status] ||
					new Date(right.diagnosed_on ?? 0).getTime() - new Date(left.diagnosed_on ?? 0).getTime()
			);

	const formatStatusLabel = (value: string) => value.replace('_', ' ');

	const handleDiagnosisCreated = async () => {
		await invalidateAll();
	};

	const handleDiagnosisUpdated = async () => {
		selectedDiagnosisId = null;
		await invalidateAll();
	};

	const handleMedicationCreated = async () => {
		await invalidateAll();
	};

	const handleMedicationUpdated = async () => {
		selectedMedicationOrderId = null;
		await invalidateAll();
	};

	const handleMedicationEdit = (orderId: string) => {
		selectedMedicationOrderId = orderId;
		showEditMedicationModal = true;
	};

	const handleDiagnosisEdit = (diagnosisId: string) => {
		selectedDiagnosisId = diagnosisId;
		showEditDiagnosisModal = true;
	};
</script>

<svelte:head>
	<title>{m.medical_dossier()} | MaiCare</title>
</svelte:head>

{#snippet medicationCell(row: MedicationRow)}
	<div class="relative pl-4">
		<!-- Priority Indicator -->
		<div
			class="absolute top-0 bottom-0 left-0 w-1 rounded-full {row.is_critical
				? 'bg-rose-500'
				: row.is_prn
					? 'bg-amber-500'
					: 'bg-border'}"
		></div>

		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<p class="text-sm font-bold text-text">{row.medication_name}</p>
				{#if row.is_critical}
					<span
						class="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-rose-700 uppercase"
					>
						{m.critical()}
					</span>
				{/if}
				{#if row.is_prn}
					<span
						class="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-700 uppercase"
					>
						PRN
					</span>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet dosageCell(row: MedicationRow)}
	<div class="space-y-1">
		<p class="text-xs font-semibold text-text">{row.dosage_text}</p>
		{#if row.notes}
			<p
				class="max-w-[180px] truncate text-[10px] leading-relaxed text-text-subtle italic"
				title={row.notes}
			>
				{row.notes}
			</p>
		{/if}
	</div>
{/snippet}

{#snippet administrationCell(row: MedicationRow)}
	<div class="space-y-1.5">
		<span
			class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {adminModeBadge[
				row.admin_mode
			]}"
		>
			{row.admin_mode}
		</span>
		{#if row.admin_mode !== 'self'}
			<p
				class="truncate text-[11px] font-medium text-text-muted"
				title={row.responsible_name ?? m.unassigned()}
			>
				{row.responsible_name ?? m.unassigned()}
			</p>
		{/if}
	</div>
{/snippet}

{#snippet scheduleCell(row: MedicationRow)}
	<div class="space-y-2">
		<p class="text-xs font-semibold text-text">{row.frequency_text ?? m.as_needed()}</p>
		{#if row.schedule.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each row.schedule as item, index (`${row.id}-schedule-${index}`)}
					<span
						class="rounded-lg border border-border bg-bg px-2 py-1 text-[10px] font-bold text-text-muted tabular-nums"
					>
						{item.time}
					</span>
				{/each}
			</div>
		{/if}
		{#if row.is_prn && row.prn_indication}
			<p
				class="truncate text-[10px] leading-tight text-amber-800 italic"
				title={row.prn_indication}
			>
				{m.indication()}: {row.prn_indication}
			</p>
		{/if}
	</div>
{/snippet}

{#snippet timelineCell(row: MedicationRow)}
	<div class="space-y-1.5">
		<div class="flex items-center gap-2">
			<div class="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
			<p class="text-[11px] font-bold text-text tabular-nums">
				{formatDate(row.start_date)}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<div class="h-1.5 w-1.5 rounded-full {row.end_date ? 'bg-rose-400' : 'bg-zinc-300'}"></div>
			<p
				class="text-[11px] font-bold tabular-nums {row.end_date ? 'text-text' : 'text-text-subtle'}"
			>
				{formatDate(row.end_date)}
			</p>
		</div>
	</div>
{/snippet}

{#snippet diagnosisCell(row: MedicationRow)}
	{#if row.diagnosis_title}
		<div
			class="flex max-w-[210px] items-start gap-2 rounded-xl border border-border/30 bg-bg/50 p-2"
		>
			<div class="mt-0.5 shrink-0 rounded-full bg-brand/10 p-1">
				<HeartPulse class="h-3 w-3 text-brand" />
			</div>
			<div class="space-y-0.5 overflow-hidden">
				<p class="truncate text-[10px] leading-none font-bold text-text">
					{row.diagnosis_title}
				</p>
				{#if row.diagnosis_code}
					<p class="truncate text-[9px] font-medium text-text-subtle">
						{formatCodeLine(row.diagnosis_code_system ?? '', row.diagnosis_code)}
					</p>
				{/if}
			</div>
		</div>
	{:else}
		<span class="text-[10px] font-medium text-text-subtle italic">{m.no_linked_diagnosis()}</span>
	{/if}
{/snippet}

{#snippet actionsCell(row: MedicationRow)}
	<div class="flex justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.view_details()}
		>
			<Eye class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.edit_order()}
			onclick={() => handleMedicationEdit(row.id)}
		>
			<Pencil class="h-4 w-4" />
		</button>
	</div>
{/snippet}

{#snippet medicationActions()}
	<Button class="gap-2" onclick={() => (showCreateMedicationModal = true)}>
		<Plus class="h-4 w-4" />
		{m.add_medication()}
	</Button>
{/snippet}

{#await medicalOverviewDataPromise}
	<div class="space-y-4">
		<div class="h-8 w-56 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then medicalOverviewData}
	{@const overview = medicalOverviewData.overview}
	{@const medicationRows = toMedicationRows(overview.medication_orders)}
	{@const diagnoses = sortDiagnoses(overview.diagnoses)}
	{@const prnCount = medicationRows.filter((row) => row.is_prn).length}
	{@const criticalCount = medicationRows.filter((row) => row.is_critical).length}

	<section class="space-y-6 pb-12">
		<header
			class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
		>
			<div
				class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-rose-200/60 to-orange-200/20 blur-2xl"
			></div>
			<div class="relative space-y-2">
				<div class="space-y-2">
					<div class="hidden"></div>
					<div class="flex items-center gap-3 text-sm font-semibold text-brand">
						<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
							<HeartPulse class="h-5 w-5" />
						</span>
						<span>{m.client_health_overview()}</span>
					</div>
					<h1 class="text-3xl font-bold tracking-tighter text-text">{m.medical_dossier()}</h1>
					<p class="max-w-2xl text-sm font-medium text-text-muted">
						{m.medical_dossier_description()}
					</p>
				</div>
			</div>
		</header>

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.active_orders()}
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
					{medicationRows.length}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">{m.current_prescriptions()}</p>
			</div>
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.prn_orders()}
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">{prnCount}</div>
				<p class="mt-2 text-xs font-medium text-text-muted">{m.as_needed_medications()}</p>
			</div>
			<div class="rounded-3xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
				<div class="text-[10px] font-bold tracking-widest text-rose-700 uppercase">
					{m.critical_medication()}
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-rose-700 sm:text-3xl">
					{criticalCount}
				</div>
				<p class="mt-2 text-xs font-medium text-rose-600">{m.high_priority_meds()}</p>
			</div>
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.diagnoses()}
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
					{diagnoses.length}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">{m.recorded_conditions()}</p>
			</div>
		</div>

		{#if medicalOverviewData.loadError}
			<InlineErrorBanner message={medicalOverviewData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		<DataTable
			columns={medicationColumns}
			rows={medicationRows}
			currentPage={1}
			pageSize={Math.max(1, medicationRows.length)}
			totalCount={medicationRows.length}
			title={m.active_medication_orders()}
			description={m.active_medication_orders_description()}
			emptyTitle={m.no_active_medication_orders()}
			emptyDescription={m.medication_orders_empty()}
			emptyActionLabel="No action"
			emptyActionDisabled
			actions={medicationActions}
			cells={{
				medication: medicationCell,
				dosage: dosageCell,
				administration: administrationCell,
				schedule: scheduleCell,
				timeline: timelineCell,
				diagnosis: diagnosisCell,
				actions: actionsCell
			}}
		/>

		<section class="rounded-3xl border border-border bg-surface shadow-sm">
			<header
				class="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-5"
			>
				<div class="space-y-1">
					<div class="flex items-center gap-2 text-sm font-semibold text-brand">
						<ClipboardList class="h-4 w-4" />
						<span>{m.clinical_context()}</span>
					</div>
					<h2 class="text-2xl font-bold tracking-tighter text-text">{m.diagnoses()}</h2>
					<p class="text-sm font-medium text-text-muted">
						{m.diagnoses_sorted_description()}
					</p>
				</div>
				<Button class="gap-2" onclick={() => (showCreateDiagnosisModal = true)}>
					<Plus class="h-4 w-4" />
					{m.add_diagnosis()}
				</Button>
			</header>

			<div class="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">
				{#if diagnoses.length === 0}
					<div
						class="rounded-2xl border border-dashed border-border px-5 py-10 text-center lg:col-span-2"
					>
						<p class="text-base font-semibold text-text">{m.no_diagnoses_on_record()}</p>
						<p class="mt-1 text-sm text-text-muted">{m.diagnoses_will_appear()}</p>
					</div>
				{:else}
					{#each diagnoses as diagnosis (diagnosis.id)}
						<article class="group relative rounded-2xl border border-border bg-bg p-5">
							<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
								<div class="min-w-[160px] flex-1 space-y-1">
									<h3 class="text-base font-bold text-text">
										{diagnosis.title ?? m.untitled_diagnosis()}
									</h3>
									<p class="text-xs font-medium text-text-muted">
										{formatCodeLine(diagnosis.code_system, diagnosis.code)}
									</p>
								</div>
								<div class="flex items-start gap-3">
									<div class="flex flex-wrap justify-end gap-1.5">
										<span
											class="rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase {diagnosisStatusBadge[
												diagnosis.status
											]}"
										>
											{formatStatusLabel(diagnosis.status)}
										</span>
										<span
											class="rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase {severityBadge[
												diagnosis.severity
											]}"
										>
											{diagnosis.severity}
										</span>
									</div>
									<button
										type="button"
										onclick={() => handleDiagnosisEdit(diagnosis.id)}
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-subtle opacity-100 transition-all duration-200 hover:bg-border/50 hover:text-text sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
										aria-label={m.edit()}
										title={m.edit()}
									>
										<Pencil class="h-4 w-4" />
									</button>
								</div>
							</div>

							<div class="mt-4 grid gap-2 text-xs font-medium text-text-muted sm:grid-cols-2">
								<p>
									{m.diagnosed_on()}
									<span class="font-semibold text-text"> {formatDate(diagnosis.diagnosed_on)}</span>
								</p>
								<p>
									{m.resolved_on()}
									<span class="font-semibold text-text"> {formatDate(diagnosis.resolved_on)}</span>
								</p>
							</div>

							{#if diagnosis.description}
								<p class="mt-3 text-sm text-text-muted">{diagnosis.description}</p>
							{/if}

							{#if diagnosis.diagnosing_clinician || diagnosis.notes}
								<div class="mt-4 space-y-1 text-xs text-text-muted">
									{#if diagnosis.diagnosing_clinician}
										<p>
											<span class="font-semibold text-text">{m.clinician()}</span>
											{diagnosis.diagnosing_clinician}
										</p>
									{/if}
									{#if diagnosis.notes}
										<p>
											<span class="font-semibold text-text">{m.notes()}</span>
											{diagnosis.notes}
										</p>
									{/if}
								</div>
							{/if}
						</article>
					{/each}
				{/if}
			</div>
		</section>

		<CreateDiagnosisModal
			clientId={page.params.id ?? ''}
			bind:open={showCreateDiagnosisModal}
			onCreated={handleDiagnosisCreated}
		/>

		<CreateMedicationOrderModal
			clientId={page.params.id ?? ''}
			diagnoses={overview.diagnoses}
			bind:open={showCreateMedicationModal}
			onCreated={handleMedicationCreated}
		/>

		{#if showEditMedicationModal && selectedMedicationOrderId}
			<EditMedicationOrderModal
				clientId={page.params.id ?? ''}
				orderId={selectedMedicationOrderId}
				diagnoses={overview.diagnoses}
				bind:open={showEditMedicationModal}
				onUpdated={handleMedicationUpdated}
			/>
		{/if}

		{#if showEditDiagnosisModal && selectedDiagnosisId}
			<EditDiagnosisModal
				clientId={page.params.id ?? ''}
				diagnosisId={selectedDiagnosisId}
				bind:open={showEditDiagnosisModal}
				onUpdated={handleDiagnosisUpdated}
			/>
		{/if}
	</section>
{/await}
