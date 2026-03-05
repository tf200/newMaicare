<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { invalidateAll } from '$app/navigation';
	import {
		deleteClientProgressReport,
		getClientProgressReport,
		updateClientProgressReport
	} from '$lib/api/clients';
	import {
		FileText,
		ArrowLeft,
		ChevronRight,
		Search,
		Plus,
		Eye,
		Pencil,
		Trash2,
		Calendar as CalendarIcon,
		User,
		MessageSquare,
		Smile,
		Meh,
		Frown,
		Angry,
		Zap,
		CloudRain,
		AlertCircle,
		Sun,
		Moon,
		Sunset,
		ClipboardList,
		UserRound,
		GitBranch,
		BookOpen,
		MoreHorizontal
	} from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import FilterDropdown from '$lib/components/ui/FilterDropdown.svelte';
	import CreateProgressReportModal from '$lib/components/forms/CreateProgressReportModal.svelte';
	import ViewProgressReportModal from '$lib/components/forms/ViewProgressReportModal.svelte';
	import type {
		GetProgressReportResponse,
		ListProgressReportsResponse,
		ProgressReportType,
		EmotionalState,
		UpdateProgressReportRequest
	} from '$lib/types/api/clients';

	let { data } = $props<{
		data: {
			reports: ListProgressReportsResponse[];
			clientId: string;
			clientName?: string;
		};
	}>();

	let searchQuery = $state('');
	let activeFilters = $state<Record<string, any>>({});
	let isCreateModalOpen = $state(false);
	let isViewModalOpen = $state(false);
	let selectedReportId = $state<string | null>(null);
	let startInEditMode = $state(false);
	let viewReport = $state<GetProgressReportResponse | null>(null);
	let viewReportLoading = $state(false);
	let reportActionLoading = $state(false);
	let viewReportError = $state<string | null>(null);
	let viewReportAbortController: AbortController | null = null;

	const openReport = async (reportId: string, editMode = false) => {
		selectedReportId = reportId;
		startInEditMode = editMode;
		isViewModalOpen = true;
		viewReport = null;
		viewReportError = null;
		viewReportLoading = true;

		viewReportAbortController?.abort();
		viewReportAbortController = new AbortController();

		try {
			const response = await getClientProgressReport(
				data.clientId,
				reportId,
				viewReportAbortController.signal
			);
			viewReport = response.data;
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			viewReportError = error instanceof Error ? error.message : 'Failed to load progress report';
		} finally {
			viewReportLoading = false;
		}
	};

	const updateReport = async (payload: UpdateProgressReportRequest) => {
		if (!selectedReportId) {
			throw new Error('No report selected.');
		}

		reportActionLoading = true;
		try {
			const response = await updateClientProgressReport(data.clientId, selectedReportId, payload);
			viewReport = response.data;
			await invalidateAll();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to update progress report';
			viewReportError = message;
			throw new Error(message);
		} finally {
			reportActionLoading = false;
		}
	};

	const deleteReport = async (reportId: string, requireConfirm = true) => {
		if (requireConfirm && !confirm('Delete this progress report? This action cannot be undone.')) {
			return;
		}

		reportActionLoading = true;
		try {
			await deleteClientProgressReport(data.clientId, reportId);
			if (selectedReportId === reportId) {
				isViewModalOpen = false;
				selectedReportId = null;
				viewReport = null;
			}
			await invalidateAll();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to delete progress report';
			if (selectedReportId === reportId) {
				viewReportError = message;
			} else {
				alert(message);
			}
			throw new Error(message);
		} finally {
			reportActionLoading = false;
		}
	};

	const typeMeta: Record<ProgressReportType, { label: string; icon: any; className: string }> = {
		morning_report: {
			label: m.morning_report(),
			icon: Sun,
			className: 'bg-amber-500 text-white border-amber-600/60 shadow-amber-600/30'
		},
		evening_report: {
			label: m.evening_report(),
			icon: Sunset,
			className: 'bg-orange-500 text-white border-orange-600/60 shadow-orange-600/30'
		},
		night_report: {
			label: m.night_report(),
			icon: Moon,
			className: 'bg-indigo-600 text-white border-indigo-700/60 shadow-indigo-700/30'
		},
		shift_report: {
			label: m.shift_report(),
			icon: ClipboardList,
			className: 'bg-slate-600 text-white border-slate-700/60 shadow-slate-700/30'
		},
		one_to_one_report: {
			label: m.one_to_one_report(),
			icon: UserRound,
			className: 'bg-teal-600 text-white border-teal-700/60 shadow-teal-700/30'
		},
		process_report: {
			label: m.process_report(),
			icon: GitBranch,
			className: 'bg-blue-600 text-white border-blue-700/60 shadow-blue-700/30'
		},
		contact_journal: {
			label: m.contact_journal(),
			icon: BookOpen,
			className: 'bg-emerald-600 text-white border-emerald-700/60 shadow-emerald-700/30'
		},
		other: {
			label: m.other(),
			icon: MoreHorizontal,
			className: 'bg-zinc-500 text-white border-zinc-600/60 shadow-zinc-600/30'
		}
	};

	const filterGroups = [
		{
			label: m.date_range(),
			items: [
				{ key: 'date_from', label: m.from(), type: 'date' as const },
				{ key: 'date_to', label: m.to(), type: 'date' as const }
			]
		},
		{
			label: m.report_type(),
			items: Object.entries(typeMeta).map(([key, meta]) => ({
				key,
				label: meta.label,
				type: 'checkbox' as const
			}))
		}
	];

	const emotionalStateMeta: Record<
		EmotionalState,
		{ label: string; icon: any; colorClass: string; bgClass: string }
	> = {
		normal: {
			label: m.normal(),
			icon: Meh,
			colorClass: 'text-zinc-600 dark:text-zinc-400',
			bgClass: 'bg-zinc-100 dark:bg-zinc-800'
		},
		excited: {
			label: m.excited(),
			icon: Zap,
			colorClass: 'text-teal-600 dark:text-teal-400',
			bgClass: 'bg-teal-50 dark:bg-teal-500/10'
		},
		happy: {
			label: m.happy(),
			icon: Smile,
			colorClass: 'text-emerald-600 dark:text-emerald-400',
			bgClass: 'bg-emerald-50 dark:bg-emerald-500/10'
		},
		sad: {
			label: m.sad(),
			icon: Frown,
			colorClass: 'text-blue-600 dark:text-blue-400',
			bgClass: 'bg-blue-50 dark:bg-blue-500/10'
		},
		angry: {
			label: m.angry(),
			icon: Angry,
			colorClass: 'text-rose-600 dark:text-rose-400',
			bgClass: 'bg-rose-50 dark:bg-rose-500/10'
		},
		anxious: {
			label: m.anxious(),
			icon: AlertCircle,
			colorClass: 'text-orange-600 dark:text-orange-400',
			bgClass: 'bg-orange-50 dark:bg-orange-500/10'
		},
		depressed: {
			label: m.depressed(),
			icon: CloudRain,
			colorClass: 'text-indigo-600 dark:text-indigo-400',
			bgClass: 'bg-indigo-50 dark:bg-indigo-500/10'
		}
	};

	const columns: DataTableColumn[] = [
		{ key: 'date', label: m.date(), width: '180px' },
		{ key: 'title', label: m.report_title() },
		{ key: 'type', label: m.type(), width: '180px' },
		{ key: 'emotional_state', label: m.emotional_state(), width: '160px' },
		{ key: 'employee', label: m.reporter(), width: '200px' },
		{ key: 'actions', label: '', align: 'right', width: '140px' }
	];

	const filteredReports = $derived(
		data.reports.filter((report: ListProgressReportsResponse) => {
			const matchesSearch =
				searchQuery === '' ||
				(report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
				`${report.employee_first_name} ${report.employee_last_name}`
					.toLowerCase()
					.includes(searchQuery.toLowerCase());

			const activeTypes = Object.entries(activeFilters)
				.filter(([key, val]) => val === true && typeMeta[key as ProgressReportType])
				.map(([key]) => key);

			const matchesType = activeTypes.length === 0 || activeTypes.includes(report.type);

			const reportDate = new Date(report.date);
			const matchesDateFrom =
				!activeFilters.date_from || reportDate >= new Date(activeFilters.date_from);
			const matchesDateTo = !activeFilters.date_to || reportDate <= new Date(activeFilters.date_to);

			return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
		})
	);

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	};
</script>

<svelte:head>
	<title>{m.progress_reports()} | MaiCare</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative w-full sm:w-auto">
				<Search
					class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
				/>
				<input
					type="search"
					bind:value={searchQuery}
					class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
					placeholder={m.search_reports()}
				/>
			</div>

			<FilterDropdown
				filters={activeFilters}
				groups={filterGroups}
				onUpdate={(newFilters) => (activeFilters = newFilters)}
				onClear={() => (activeFilters = {})}
				title={m.filter_reports()}
				buttonLabel={m.filters()}
			/>
		</div>
	</div>
{/snippet}

{#snippet dateCell(row: ListProgressReportsResponse)}
	<div class="flex items-center gap-2 text-sm font-semibold text-text">
		<CalendarIcon class="h-4 w-4 text-text-muted" />
		<span>{formatDate(row.date)}</span>
	</div>
{/snippet}

{#snippet titleCell(row: ListProgressReportsResponse)}
	<span class="font-semibold text-text">{row.title || m.untitled_report()}</span>
{/snippet}

{#snippet typeCell(row: ListProgressReportsResponse)}
	{@const meta = typeMeta[row.type] || typeMeta.other}
	<span
		class="inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm {meta.className}"
	>
		<meta.icon class="h-3.5 w-3.5" />
		{meta.label}
	</span>
{/snippet}

{#snippet emotionalStateCell(row: ListProgressReportsResponse)}
	{@const meta = emotionalStateMeta[row.emotional_state] || emotionalStateMeta.normal}
	<div
		class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold {meta.bgClass} {meta.colorClass}"
	>
		<meta.icon class="h-3.5 w-3.5" />
		{meta.label}
	</div>
{/snippet}

{#snippet employeeCell(row: ListProgressReportsResponse)}
	<div class="flex items-center gap-2">
		<div
			class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<User class="h-3.5 w-3.5" />
		</div>
		<span class="text-sm font-medium text-text">
			{#if row.employee_first_name || row.employee_last_name}
				{row.employee_first_name} {row.employee_last_name}
			{:else}
				<span class="text-text-muted italic">{m.system_no_employee()}</span>
			{/if}
		</span>
	</div>
{/snippet}

{#snippet actionsCell(row: ListProgressReportsResponse)}
	<div class="flex justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.view_report()}
			onclick={() => openReport(row.id)}
		>
			<Eye class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.edit_report()}
			onclick={() => openReport(row.id, true)}
		>
			<Pencil class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
			title={m.delete_report()}
			onclick={() => deleteReport(row.id)}
		>
			<Trash2 class="h-4 w-4" />
		</button>
	</div>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-teal-100/70 to-emerald-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<nav class="flex items-center gap-2 text-sm font-medium text-text-subtle">
					<a href="/clients" class="flex items-center gap-1 transition-colors hover:text-text">
						<ArrowLeft class="h-4 w-4" />
						Clients
					</a>
					<ChevronRight class="h-4 w-4" />
					<a href={`/clients/${data.clientId}`} class="transition-colors hover:text-text">
						{data.clientName ?? 'Client Detail'}
					</a>
					<ChevronRight class="h-4 w-4" />
					<span class="text-text">Progress Reports</span>
				</nav>
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<FileText class="h-5 w-5" />
					</span>
					<span>{m.client_documentation()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.progress_reports()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.progress_reports_description()}
				</p>
			</div>

			<button
				class="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 dark:text-black"
				onclick={() => (isCreateModalOpen = true)}
			>
				<Plus class="h-4 w-4" />
				{m.create_report()}
			</button>
		</div>
	</header>

	<DataTable
		{columns}
		rows={filteredReports}
		title={m.reports_history()}
		description={m.reports_history_description()}
		filters={tableFilters}
		rowKey="id"
		cells={{
			date: dateCell,
			title: titleCell,
			type: typeCell,
			emotional_state: emotionalStateCell,
			employee: employeeCell,
			actions: actionsCell
		}}
	/>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Quick Stats or recent activity could go here -->
		<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
			<h3 class="flex items-center gap-2 text-lg font-bold tracking-tight text-text">
				<Smile class="h-5 w-5 text-emerald-500" />
				{m.emotional_wellbeing()}
			</h3>
			<p class="mt-1 text-sm text-text-muted">{m.emotional_wellbeing_description()}</p>

			<div class="mt-6 flex flex-wrap gap-3">
				{#each Object.entries(emotionalStateMeta) as [key, meta] (key)}
					{@const count = data.reports.filter(
						(r: ListProgressReportsResponse) => r.emotional_state === key
					).length}
					{#if count > 0}
						<div
							class="flex items-center gap-2 rounded-2xl border border-border bg-zinc-50/50 p-3 dark:bg-zinc-800/50"
						>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-xl {meta.bgClass} {meta.colorClass}"
							>
								<meta.icon class="h-4 w-4" />
							</div>
							<div>
								<p class="text-xs font-bold text-text">{meta.label}</p>
								<p class="text-[10px] font-medium text-text-muted">{count} {m.reports()}</p>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
			<h3 class="flex items-center gap-2 text-lg font-bold tracking-tight text-text">
				<MessageSquare class="h-5 w-5 text-brand" />
				{m.reporting_volume()}
			</h3>
			<p class="mt-1 text-sm text-text-muted">{m.reporting_volume_description()}</p>

			<div class="mt-6 space-y-3">
				{#each Object.entries(typeMeta) as [key, meta] (key)}
					{@const count = data.reports.filter(
						(r: ListProgressReportsResponse) => r.type === key
					).length}
					{#if count > 0}
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-text-muted">{meta.label}</span>
							<div class="flex items-center gap-3">
								<div class="h-1.5 w-32 overflow-hidden rounded-full bg-border">
									<div
										class="h-full bg-brand"
										style="width: {(count / data.reports.length) * 100}%"
									></div>
								</div>
								<span class="text-xs font-bold text-text">{count}</span>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<CreateProgressReportModal
		bind:open={isCreateModalOpen}
		preselectedClientId={data.clientId}
		onCreated={async () => {
			await invalidateAll();
		}}
	/>

	<ViewProgressReportModal
		bind:open={isViewModalOpen}
		report={viewReport}
		loading={viewReportLoading}
		actionLoading={reportActionLoading}
		loadError={viewReportError}
		{startInEditMode}
		onUpdate={updateReport}
		onDelete={async () => {
			if (!selectedReportId) return;
			await deleteReport(selectedReportId, false);
		}}
	/>
</section>
