<script lang="ts">
	import {
		Download,
		ExternalLink,
		Eye,
		AlertTriangle,
		Search,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { EmployeeSalaryRow, SalaryTotals } from '$lib/types/api/salary';
	import { ORT_PERCENTAGES } from '$lib/utils/ort';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		rows: EmployeeSalaryRow[];
		totals: SalaryTotals;
		loading: boolean;
		currentMonth: Date;
		onNavigate: (direction: 'prev' | 'next') => void;
		onDownloadPdf: (row: EmployeeSalaryRow) => void;
		onPreviewPdf: (row: EmployeeSalaryRow) => void;
		searchQuery: string;
	}

	let {
		rows,
		totals,
		loading,
		currentMonth,
		onNavigate,
		onDownloadPdf,
		onPreviewPdf,
		searchQuery = $bindable()
	}: Props = $props();

	let selectedRow = $state<EmployeeSalaryRow | null>(null);
	let showDetailModal = $state(false);

	function openDetail(row: EmployeeSalaryRow) {
		selectedRow = row;
		showDetailModal = true;
	}

	const fmt = (amount: number) =>
		new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

	const columns: DataTableColumn[] = [
		{ key: 'employee', label: m.salaris_employee(), headerClass: 'pl-4' },
		{ key: 'shifts', label: m.salaris_shifts(), align: 'right', width: '100px' },
		{ key: 'hours', label: m.salaris_hours(), align: 'right', width: '100px' },
		{ key: 'ort', label: m.salaris_ort_label(), align: 'right', width: '100px' },
		{ key: 'regularPay', label: m.salaris_regular(), align: 'right', width: '120px' },
		{ key: 'surcharge', label: m.salaris_surcharge(), align: 'right', width: '120px' },
		{ key: 'gross', label: m.salaris_total(), align: 'right', width: '120px' },
		{ key: 'actions', label: '', align: 'right', width: '100px' }
	];
</script>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative w-full sm:w-64">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				placeholder={m.salaris_search()}
				bind:value={searchQuery}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
			/>
		</div>

		<div class="flex items-center gap-2">
			<button
				class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted shadow-sm transition-all hover:bg-border/50 hover:text-text active:scale-95"
				onclick={() => onNavigate('prev')}
			>
				<ChevronLeft class="h-4 w-4" />
			</button>
			<div
				class="flex h-9 min-w-[140px] items-center justify-center rounded-xl border border-border bg-surface px-4 shadow-sm"
			>
				<span class="text-sm font-bold text-text capitalize">
					{new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(
						currentMonth
					)}
				</span>
			</div>
			<button
				class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted shadow-sm transition-all hover:bg-border/50 hover:text-text active:scale-95"
				onclick={() => onNavigate('next')}
			>
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>
	</div>
{/snippet}

{#snippet employeeCell(row: EmployeeSalaryRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-xs font-bold text-brand shadow-sm"
		>
			{row.employee.first_name[0]}{row.employee.last_name[0]}
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.employee.name}</p>
			<div class="mt-0.5 flex flex-wrap items-center gap-1.5">
				<span class="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
					{row.employee.salary_scale !== null
						? `S${row.employee.salary_scale}.${row.employee.salary_periodiek}`
						: '—'}
				</span>
				{#if row.isZorgcoordinator}
					<span class="text-[11px] font-semibold text-violet-600 dark:text-violet-400">COORD</span>
				{/if}
				<span
					class="text-[11px] font-semibold {row.isZeroHoursContract
						? 'text-cyan-600 dark:text-cyan-400'
						: 'text-text-muted'}"
				>
					{row.isZeroHoursContract ? '0u' : `${row.employee.hours_per_week ?? 36}u/w`}
				</span>
				{#if row.isOverScheduled}
					<span class="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
						<AlertTriangle class="h-3 w-3" /> +{Math.ceil(row.shiftsDifference)}
					</span>
				{/if}
				{#if row.isUnderScheduled}
					<span class="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
						<AlertTriangle class="h-3 w-3" />
						{Math.floor(row.shiftsDifference)}
					</span>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet shiftsCell(row: EmployeeSalaryRow)}
	<div class="flex flex-col items-end">
		{#if row.isZeroHoursContract}
			<span class="text-sm font-semibold text-text tabular-nums">{row.shifts}</span>
		{:else}
			<span
				class="text-sm font-semibold tabular-nums {row.isOverScheduled
					? 'text-rose-600 dark:text-rose-400'
					: row.isUnderScheduled
						? 'text-amber-600 dark:text-amber-400'
						: 'text-text'}"
			>
				{row.shifts}
			</span>
			<span class="text-[10px] font-medium text-text-subtle">of {Math.floor(row.maxShifts)}</span>
		{/if}
	</div>
{/snippet}

{#snippet hoursCell(row: EmployeeSalaryRow)}
	<div class="flex flex-col items-end">
		<span
			class="text-sm font-semibold tabular-nums {row.isOverHours
				? 'text-rose-600 dark:text-rose-400'
				: row.isUnderHours
					? 'text-amber-600 dark:text-amber-400'
					: 'text-text'}"
		>
			{row.regularHours.toFixed(1)}h
		</span>
		{#if (row.isOverHours || row.isUnderHours) && !row.isZeroHoursContract}
			<span class="text-[10px] font-medium {row.isOverHours ? 'text-rose-500' : 'text-amber-500'}">
				{row.isOverHours ? 'Over: ' : 'Short: '}{Math.abs(row.hoursDifference).toFixed(1)}h
			</span>
		{/if}
	</div>
{/snippet}

{#snippet ortCell(row: EmployeeSalaryRow)}
	{#if row.ortBreakdown.totalOrtHours > 0}
		<span class="text-sm font-semibold tabular-nums text-orange-600 dark:text-orange-400">
			{row.ortBreakdown.totalOrtHours.toFixed(1)}h
		</span>
	{:else}
		<span class="text-sm font-medium text-text-subtle">—</span>
	{/if}
{/snippet}

{#snippet regularPayCell(row: EmployeeSalaryRow)}
	<span class="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
		{fmt(row.regularPay)}
	</span>
{/snippet}

{#snippet surchargeCell(row: EmployeeSalaryRow)}
	{#if row.totalOrt > 0}
		<span class="text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
			+{fmt(row.totalOrt)}
		</span>
	{:else}
		<span class="text-sm font-medium text-text-subtle">—</span>
	{/if}
{/snippet}

{#snippet grossCell(row: EmployeeSalaryRow)}
	<span class="text-sm font-extrabold tabular-nums text-brand">
		{fmt(row.totalGross)}
	</span>
{/snippet}

{#snippet actionsCell(row: EmployeeSalaryRow)}
	<div class="flex items-center justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-subtle shadow-sm transition-all hover:bg-border/50 hover:text-text"
			onclick={() => openDetail(row)}
			aria-label={m.salaris_view()}
			title={m.salaris_view()}
		>
			<Eye class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-subtle shadow-sm transition-all hover:bg-border/50 hover:text-text"
			onclick={() => onDownloadPdf(row)}
			aria-label="Download"
		>
			<Download class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-subtle shadow-sm transition-all hover:bg-border/50 hover:text-text"
			onclick={() => onPreviewPdf(row)}
			aria-label="Preview"
		>
			<ExternalLink class="h-4 w-4" />
		</button>
	</div>
{/snippet}

<div class="flex flex-col gap-6">
	<DataTable
		{columns}
		{rows}
		{loading}
		title={m.salaris_overview()}
		description={m.salaris_employees_count({ count: rows.length })}
		rowKey={(row, _i) => row.employee.id}
		filters={tableFilters}
		emptyTitle={m.salaris_no_employees_found()}
		emptyDescription={m.salaris_try_other_filters()}
		cells={{
			employee: employeeCell,
			shifts: shiftsCell,
			hours: hoursCell,
			ort: ortCell,
			regularPay: regularPayCell,
			surcharge: surchargeCell,
			gross: grossCell,
			actions: actionsCell
		}}
	/>
</div>

<!-- ORT Detail Modal -->
<Modal
	bind:open={showDetailModal}
	title="{selectedRow?.employee.name ?? ''} — {m.salaris_ort_breakdown()}"
	description={m.salaris_ort_breakdown()}
	size="lg"
>
	{#if selectedRow}
		<div class="space-y-6">
			<!-- Summary row -->
			<div class="grid grid-cols-3 gap-4">
				<div class="rounded-xl border border-border bg-surface p-4">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.salaris_shifts()}
					</div>
					<div class="mt-1 text-xl font-bold text-text tabular-nums">{selectedRow.shifts}</div>
				</div>
				<div class="rounded-xl border border-border bg-surface p-4">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.salaris_regular_hours()}
					</div>
					<div class="mt-1 text-xl font-bold text-text tabular-nums">
						{selectedRow.regularHours.toFixed(1)}
					</div>
				</div>
				<div class="rounded-xl border border-border bg-surface p-4">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.salaris_gross_total_label()}
					</div>
					<div class="mt-1 text-xl font-bold text-text tabular-nums">
						{fmt(selectedRow.totalGross)}
					</div>
				</div>
			</div>

			<!-- ORT breakdown -->
			<div class="rounded-xl border border-border/30 bg-surface p-5">
				<div class="mb-4 text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">
					{m.salaris_ort_breakdown()}
				</div>
				<div class="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-5">
					{#each [{ label: m.salaris_ort_early(), hours: selectedRow.ortBreakdown.earlyMorningHours, pct: ORT_PERCENTAGES.earlyMorning, amt: selectedRow.ortAmounts?.earlyMorningOrt ?? 0 }, { label: m.salaris_ort_evening(), hours: selectedRow.ortBreakdown.eveningHours, pct: ORT_PERCENTAGES.evening, amt: selectedRow.ortAmounts?.eveningOrt ?? 0 }, { label: m.salaris_ort_night(), hours: selectedRow.ortBreakdown.nightHours, pct: ORT_PERCENTAGES.night, amt: selectedRow.ortAmounts?.nightOrt ?? 0 }, { label: m.salaris_ort_saturday(), hours: selectedRow.ortBreakdown.saturdayDayHours, pct: ORT_PERCENTAGES.saturdayDay, amt: selectedRow.ortAmounts?.saturdayDayOrt ?? 0 }, { label: m.salaris_ort_sunday(), hours: selectedRow.ortBreakdown.sundayHolidayHours, pct: ORT_PERCENTAGES.sundayHoliday, amt: selectedRow.ortAmounts?.sundayHolidayOrt ?? 0 }] as item}
						<div>
							<div class="text-[10px] font-semibold text-text-subtle">{item.label}</div>
							<div class="mt-0.5 text-sm font-bold text-text tabular-nums">
								{item.hours.toFixed(1)}u × {(item.pct * 100).toFixed(0)}%
							</div>
							<div class="text-xs text-text-muted tabular-nums">{fmt(item.amt)}</div>
						</div>
					{/each}
				</div>
				{#if selectedRow.hourlyRate}
					<div class="mt-4 border-t border-border/30 pt-4 text-[11px] text-text-subtle">
						{m.salaris_hourly_rate()}:
						<span class="font-semibold text-text-muted">{fmt(selectedRow.hourlyRate)}</span>
					</div>
				{/if}
			</div>

			<!-- Pay summary -->
			<div class="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
				<div class="space-y-1">
					<div class="text-sm text-text-muted">{m.salaris_regular_pay_label()}</div>
					<div class="text-sm text-text-muted">{m.salaris_ort_surcharge()}</div>
				</div>
				<div class="space-y-1 text-right">
					<div class="text-sm font-semibold text-text tabular-nums">
						{fmt(selectedRow.regularPay)}
					</div>
					<div class="text-sm font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
						+{fmt(selectedRow.totalOrt)}
					</div>
				</div>
			</div>
			<div
				class="flex items-center justify-between rounded-xl border-2 border-brand/20 bg-brand/5 p-4"
			>
				<div class="text-sm font-bold text-text">{m.salaris_gross_total_label()}</div>
				<div class="text-lg font-extrabold text-text tabular-nums">
					{fmt(selectedRow.totalGross)}
				</div>
			</div>
		</div>
	{/if}
</Modal>