<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import StatsCard from '$lib/components/ui/StatsCard.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { listMockTimeEntries } from '$lib/api/uren.mock';
	import type { TimeEntry, TimeEntryStatus, HourType, ActivityCategory } from '$lib/types/api/uren';
	import { addDays, subDays, isSameDay, isWeekend } from 'date-fns';
	import {
		ChevronLeft,
		ChevronRight,
		Calendar,
		Clock,
		Send,
		CheckCircle,
		XCircle,
		Plus,
		Edit,
		Trash2,
		AlertTriangle
	} from 'lucide-svelte';
	import UrenStats from './_components/UrenStats.svelte';

	const CONTRACT_HOURS_PER_DAY = 7.5;

	let currentDate = $state(new Date());
	let entries = $state<TimeEntry[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let editingEntry = $state<TimeEntry | null>(null);
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	let formHours = $state('7');
	let formMinutes = $state('0');
	let formHourType = $state<HourType>('regular');
	let formCategory = $state<ActivityCategory>('zorg');
	let formDescription = $state('');

	$effect(() => {
		void loadEntries();
	});

	async function loadEntries() {
		loading = true;
		try {
			const response = await listMockTimeEntries();
			entries = response.data;
		} catch {
			entries = [];
		} finally {
			loading = false;
		}
	}

	const locale = $derived(getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const formattedDate = $derived(
		new Intl.DateTimeFormat(locale, {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(currentDate)
	);

	const isToday = $derived(isSameDay(currentDate, new Date()));
	const isCurrentWeekend = $derived(isWeekend(currentDate));

	const dayEntries = $derived.by(() =>
		entries.filter((e) => {
			const entryDate = new Date(e.entry_date);
			return isSameDay(entryDate, currentDate);
		})
	);

	const totalHoursToday = $derived.by(() => dayEntries.reduce((sum, e) => sum + e.hours, 0));

	const stats = $derived.by(() => {
		const s = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
		for (const e of dayEntries) {
			if (e.status === 'draft') s.draft += e.hours;
			else if (e.status === 'submitted') s.submitted += e.hours;
			else if (e.status === 'approved') s.approved += e.hours;
			else if (e.status === 'rejected') s.rejected += e.hours;
		}
		return s;
	});

	const progressPercent = $derived(Math.min((totalHoursToday / CONTRACT_HOURS_PER_DAY) * 100, 100));

	const progressColor = $derived.by(() => {
		if (totalHoursToday > CONTRACT_HOURS_PER_DAY) return 'bg-rose-500';
		if (totalHoursToday >= CONTRACT_HOURS_PER_DAY) return 'bg-emerald-500';
		return 'bg-amber-500';
	});

	const progressStatus = $derived.by(() => {
		if (totalHoursToday > CONTRACT_HOURS_PER_DAY) return m.uren_progress_over();
		if (totalHoursToday >= CONTRACT_HOURS_PER_DAY) return m.uren_progress_complete();
		return m.uren_progress_incomplete({
			remaining: formatHours(CONTRACT_HOURS_PER_DAY - totalHoursToday)
		});
	});

	const columns: DataTableColumn[] = [
		{ key: 'hours', label: m.uren_col_hours(), width: '100px' },
		{ key: 'type', label: m.uren_col_type(), width: '120px' },
		{ key: 'category', label: m.uren_col_category(), width: '120px' },
		{ key: 'description', label: m.uren_col_description() },
		{ key: 'project', label: m.uren_col_project(), width: '140px' },
		{ key: 'status', label: m.uren_col_status(), width: '130px', align: 'center' as const },
		{ key: 'actions', label: m.uren_col_actions(), width: '140px', align: 'right' as const }
	];

	const hourOptions = Array.from({ length: 15 }, (_, i) => {
		const val = (i + 2) * 0.5;
		return { label: `${val}`, value: `${val}` };
	});

	const minuteOptions = [
		{ label: '0', value: '0' },
		{ label: '15', value: '15' },
		{ label: '30', value: '30' },
		{ label: '45', value: '45' }
	];

	const hourTypeOptions: { label: string; value: HourType }[] = [
		{ label: m.uren_type_regular(), value: 'regular' },
		{ label: m.uren_type_overtime(), value: 'overtime' },
		{ label: m.uren_type_evening(), value: 'evening' },
		{ label: m.uren_type_night(), value: 'night' },
		{ label: m.uren_type_weekend(), value: 'weekend' },
		{ label: m.uren_type_holiday(), value: 'holiday' }
	];

	const categoryOptions: { label: string; value: ActivityCategory }[] = [
		{ label: m.uren_cat_zorg(), value: 'zorg' },
		{ label: m.uren_cat_overleg(), value: 'overleg' },
		{ label: m.uren_cat_administratie(), value: 'administratie' },
		{ label: m.uren_cat_scholing(), value: 'scholing' },
		{ label: m.uren_cat_overig(), value: 'overig' }
	];

	const hourTypeColors: Record<HourType, string> = {
		regular: 'bg-blue-500/10 text-blue-600 border-blue-400/30',
		overtime: 'bg-purple-500/10 text-purple-600 border-purple-400/30',
		evening: 'bg-indigo-500/10 text-indigo-600 border-indigo-400/30',
		night: 'bg-slate-500/10 text-slate-600 border-slate-400/30',
		weekend: 'bg-amber-500/10 text-amber-600 border-amber-400/30',
		holiday: 'bg-rose-500/10 text-rose-600 border-rose-400/30'
	};

	const statusConfig: Record<TimeEntryStatus, { label: () => string; color: string }> = {
		draft: { label: () => m.uren_status_draft(), color: 'text-slate-500' },
		submitted: { label: () => m.uren_status_submitted(), color: 'text-amber-500' },
		approved: { label: () => m.uren_status_approved(), color: 'text-emerald-500' },
		rejected: { label: () => m.uren_status_rejected(), color: 'text-rose-500' }
	};

	const categoryColors: Record<ActivityCategory, string> = {
		zorg: 'bg-teal-500/10 text-teal-600',
		overleg: 'bg-cyan-500/10 text-cyan-600',
		administratie: 'bg-slate-500/10 text-slate-600',
		scholing: 'bg-violet-500/10 text-violet-600',
		overig: 'bg-gray-500/10 text-gray-600'
	};

	function formatHours(h: number): string {
		const whole = Math.floor(h);
		const minutes = Math.round((h - whole) * 60);
		if (minutes === 0) return `${whole}${m.uren_unit_hour_short()}`;
		return `${whole}${m.uren_unit_hour_short()} ${minutes}${m.uren_unit_minute_short()}`;
	}

	function formatEntryHours(h: number): string {
		return formatHours(h);
	}

	function truncate(str: string | null, len = 40): string {
		if (!str) return '—';
		return str.length > len ? str.slice(0, len) + '…' : str;
	}

	function prevDay() {
		currentDate = subDays(currentDate, 1);
	}

	function nextDay() {
		currentDate = addDays(currentDate, 1);
	}

	function goToday() {
		currentDate = new Date();
	}

	function setToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
		toast = { message, type };
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			toast = null;
		}, 3500);
	}

	function openNewEntryModal() {
		editingEntry = null;
		formHours = '7';
		formMinutes = '0';
		formHourType = 'regular';
		formCategory = 'zorg';
		formDescription = '';
		modalOpen = true;
	}

	function openEditModal(entry: TimeEntry) {
		editingEntry = entry;
		const whole = Math.floor(entry.hours);
		const minutes = Math.round((entry.hours - whole) * 60);
		formHours = `${whole}`;
		formMinutes = `${minutes}`;
		formHourType = entry.hour_type;
		formCategory = entry.activity_category;
		formDescription = entry.activity_description ?? '';
		modalOpen = true;
	}

	function handleSubmitEntry() {
		const totalHours = parseFloat(formHours) + parseInt(formMinutes) / 60;
		if (totalHours <= 0) {
			setToast(m.uren_toast_missing_hours(), 'warning');
			return;
		}

		if (editingEntry) {
			entries = entries.map((e) =>
				e.id === editingEntry!.id
					? {
							...e,
							hours: totalHours,
							hour_type: formHourType,
							activity_category: formCategory,
							activity_description: formDescription || null
						}
					: e
			);
			setToast(m.uren_toast_updated(), 'success');
		} else {
			const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
			const newEntry: TimeEntry = {
				id: crypto.randomUUID(),
				employee_id: 'emp-001',
				employee_name: 'Sophie de Vries',
				entry_date: dateStr,
				hours: totalHours,
				hour_type: formHourType,
				activity_category: formCategory,
				activity_description: formDescription || null,
				project_name: null,
				status: 'draft',
				created_at: new Date().toISOString()
			};
			entries = [newEntry, ...entries];
			setToast(m.uren_toast_added(), 'success');
		}

		modalOpen = false;
	}

	function handleSubmitForApproval(entry: TimeEntry) {
		entries = entries.map((e) =>
			e.id === entry.id ? { ...e, status: 'submitted' as TimeEntryStatus } : e
		);
		setToast(m.uren_toast_submitted(), 'success');
	}

	function handleDeleteEntry(entry: TimeEntry) {
		entries = entries.filter((e) => e.id !== entry.id);
		setToast(m.uren_toast_deleted(), 'warning');
	}
</script>

<svelte:head>
	<title>{m.uren_page_title()} | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<!-- Header -->
	<div
		class="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg"
	>
		<div class="px-6 py-8 sm:px-8">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
						{m.uren_page_title()}
					</h1>
					<p class="mt-1 text-sm font-medium text-amber-100">
						{m.uren_page_subtitle()}
					</p>
				</div>
				<Button
					onclick={openNewEntryModal}
					class="self-start bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
				>
					<Plus class="h-4 w-4" />
					{m.uren_register_button()}
				</Button>
			</div>

			<!-- Day navigation -->
			<div class="mt-6 flex items-center gap-3">
				<button
					onclick={prevDay}
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25"
				>
					<ChevronLeft class="h-5 w-5" />
				</button>

				<div class="flex items-center gap-2">
					<Calendar class="h-4 w-4 text-amber-100" />
					<span class="text-sm font-bold text-white capitalize">{formattedDate}</span>
					{#if isCurrentWeekend}
						<span
							class="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase"
						>
							{m.uren_weekend_badge()}
						</span>
					{/if}
				</div>

				<button
					onclick={nextDay}
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25"
				>
					<ChevronRight class="h-5 w-5" />
				</button>

				{#if !isToday}
					<button
						onclick={goToday}
						class="ml-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/25"
					>
						{m.uren_today_button()}
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Progress bar -->
	<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">
					{m.uren_daily_progress()}
				</p>
				<p class="mt-1 text-lg font-extrabold tracking-tight text-text">
					{formatHours(totalHoursToday)} / {formatHours(CONTRACT_HOURS_PER_DAY)}
				</p>
			</div>
			<div class="flex items-center gap-2">
				{#if totalHoursToday > CONTRACT_HOURS_PER_DAY}
					<AlertTriangle class="h-4 w-4 text-rose-500" />
				{:else if totalHoursToday >= CONTRACT_HOURS_PER_DAY}
					<CheckCircle class="h-4 w-4 text-emerald-500" />
				{:else}
					<Clock class="h-4 w-4 text-amber-500" />
				{/if}
				<span class="text-xs font-semibold text-text-muted">{progressStatus}</span>
			</div>
		</div>
		<div class="mt-3 h-2.5 overflow-hidden rounded-full bg-border/50">
			<div
				class="h-full rounded-full transition-all duration-500 {progressColor}"
				style="width: {progressPercent}%"
			></div>
		</div>
	</div>

	<!-- Stats -->
	<UrenStats
		draft={stats.draft}
		submitted={stats.submitted}
		approved={stats.approved}
		rejected={stats.rejected}
	/>

	<!-- Table -->
	<DataTable
		{columns}
		rows={dayEntries}
		{loading}
		rowKey="id"
		emptyTitle={m.uren_empty_title()}
		emptyDescription={m.uren_empty_description()}
		emptyActionLabel={m.uren_register_button()}
		emptyAction={openNewEntryModal}
		cells={{
			hours: hoursCell,
			type: typeCell,
			category: categoryCell,
			description: descriptionCell,
			project: projectCell,
			status: statusCell,
			actions: actionsCell
		}}
	/>
</section>

<!-- Register / Edit Modal -->
{#if modalOpen}
	<Modal
		open={true}
		title={editingEntry ? m.uren_modal_edit_title() : m.uren_modal_new_title()}
		description={editingEntry ? m.uren_modal_edit_desc() : m.uren_modal_new_desc()}
		size="md"
	>
		<div class="space-y-4">
			<!-- Hours + Minutes -->
			<div class="grid grid-cols-2 gap-3">
				<Select
					label={m.uren_form_hours()}
					options={hourOptions.map((o) => ({
						label: `${o.label}${m.uren_unit_hour_short()}`,
						value: o.value
					}))}
					bind:value={formHours}
				/>
				<Select
					label={m.uren_form_minutes()}
					options={minuteOptions.map((o) => ({
						label: `${o.label}${m.uren_unit_minute_short()}`,
						value: o.value
					}))}
					bind:value={formMinutes}
				/>
			</div>

			<!-- Hour type -->
			<Select label={m.uren_form_hour_type()} options={hourTypeOptions} bind:value={formHourType} />

			<!-- Activity category -->
			<Select label={m.uren_form_category()} options={categoryOptions} bind:value={formCategory} />

			<!-- Description -->
			<Input label={m.uren_form_description()} bind:value={formDescription} />
		</div>

		{#snippet footer()}
			<div class="flex justify-end gap-2">
				<Button variant="ghost" onclick={() => (modalOpen = false)}>
					{m.cancel()}
				</Button>
				<Button onclick={handleSubmitEntry}>
					{editingEntry ? m.save() : m.uren_register_button()}
				</Button>
			</div>
		{/snippet}
	</Modal>
{/if}

<!-- Toast -->
<Toast
	message={toast?.message ?? null}
	type={toast?.type ?? 'success'}
	onClose={() => (toast = null)}
/>

{#snippet hoursCell(row: TimeEntry)}
	<span class="text-sm font-bold text-text tabular-nums">{formatEntryHours(row.hours)}</span>
{/snippet}

{#snippet typeCell(row: TimeEntry)}
	<span
		class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold {hourTypeColors[
			row.hour_type
		] ?? 'border-gray-400/30 bg-gray-500/10 text-gray-600'}"
	>
		{row.hour_type === 'regular'
			? m.uren_type_regular()
			: row.hour_type === 'overtime'
				? m.uren_type_overtime()
				: row.hour_type === 'evening'
					? m.uren_type_evening()
					: row.hour_type === 'night'
						? m.uren_type_night()
						: row.hour_type === 'weekend'
							? m.uren_type_weekend()
							: m.uren_type_holiday()}
	</span>
{/snippet}

{#snippet categoryCell(row: TimeEntry)}
	<span
		class="inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-semibold {categoryColors[
			row.activity_category
		] ?? 'bg-gray-500/10 text-gray-600'}"
	>
		{row.activity_category === 'zorg'
			? m.uren_cat_zorg()
			: row.activity_category === 'overleg'
				? m.uren_cat_overleg()
				: row.activity_category === 'administratie'
					? m.uren_cat_administratie()
					: row.activity_category === 'scholing'
						? m.uren_cat_scholing()
						: m.uren_cat_overig()}
	</span>
{/snippet}

{#snippet descriptionCell(row: TimeEntry)}
	<span class="text-sm text-text-muted">{truncate(row.activity_description)}</span>
{/snippet}

{#snippet projectCell(row: TimeEntry)}
	<span class="text-sm text-text-muted">{row.project_name ?? '—'}</span>
{/snippet}

{#snippet statusCell(row: TimeEntry)}
	{@const cfg = statusConfig[row.status]}
	<span class="inline-flex items-center gap-1.5 text-xs font-semibold {cfg.color}">
		{#if row.status === 'draft'}
			<Clock class="h-3.5 w-3.5" />
		{:else if row.status === 'submitted'}
			<Send class="h-3.5 w-3.5" />
		{:else if row.status === 'approved'}
			<CheckCircle class="h-3.5 w-3.5" />
		{:else}
			<XCircle class="h-3.5 w-3.5" />
		{/if}
		{cfg.label()}
	</span>
{/snippet}

{#snippet actionsCell(row: TimeEntry)}
	<div class="flex items-center justify-end gap-1">
		{#if row.status === 'draft'}
			<button
				onclick={() => handleSubmitForApproval(row)}
				class="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-amber-600 transition-colors hover:bg-amber-500/10"
			>
				<Send class="h-3 w-3" />
				{m.uren_action_submit()}
			</button>
			<button
				onclick={() => openEditModal(row)}
				class="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-text-muted transition-colors hover:bg-border/30 hover:text-text"
			>
				<Edit class="h-3 w-3" />
				{m.edit()}
			</button>
			<button
				onclick={() => handleDeleteEntry(row)}
				class="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-rose-500 transition-colors hover:bg-rose-500/10"
			>
				<Trash2 class="h-3 w-3" />
				{m.delete()}
			</button>
		{:else if row.status === 'rejected'}
			<button
				onclick={() => openEditModal(row)}
				class="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-text-muted transition-colors hover:bg-border/30 hover:text-text"
			>
				<Edit class="h-3 w-3" />
				{m.edit()}
			</button>
		{/if}
	</div>
{/snippet}
