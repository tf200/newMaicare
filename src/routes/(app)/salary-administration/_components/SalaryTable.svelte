<script lang="ts">
	import { Download, ExternalLink, Eye, AlertTriangle, Search } from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { EmployeeSalaryRow, SalaryTotals } from '$lib/types/api/salary';
	import type { EmployeeListItem } from '$lib/api/employees';
	import { ORT_PERCENTAGES } from '$lib/utils/ort';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		rows: EmployeeSalaryRow[];
		totals: SalaryTotals;
		loading: boolean;
		includeBreaks: boolean;
		onDownloadPdf: (row: EmployeeSalaryRow) => void;
		onPreviewPdf: (row: EmployeeSalaryRow) => void;
		searchQuery: string;
		employeeFilter: string;
		departmentFilter: string;
		visibleEmployees: EmployeeListItem[];
		departments: string[];
	}

	let {
		rows,
		totals,
		loading,
		onDownloadPdf,
		onPreviewPdf,
		searchQuery = $bindable(),
		employeeFilter = $bindable(),
		departmentFilter = $bindable(),
		visibleEmployees,
		departments
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
		{ key: 'employee', label: m.salaris_employee(), headerClass: 'pl-14' },
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
	<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder={m.salaris_search()}
				bind:value={searchQuery}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
			/>
		</div>
		<Select
			bind:value={employeeFilter}
			size="sm"
			options={[
				{ value: 'all', label: m.salaris_all_employees() },
				...visibleEmployees
					.sort((a, b) => a.first_name.localeCompare(b.first_name))
					.map((emp) => ({
						value: emp.id,
						label: `${emp.first_name} ${emp.last_name}`
					}))
			]}
			placeholder="Alle medewerkers"
		/>
		<Select
			bind:value={departmentFilter}
			size="sm"
			options={[
				{ value: 'all', label: m.salaris_all_depts() },
				...departments.map((d) => ({ value: d, label: d }))
			]}
			placeholder={m.salaris_all_depts()}
		/>
	</div>
{/snippet}

{#snippet employeeCell(row: EmployeeSalaryRow)}
	<div class="flex items-center gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-border/50 text-xs font-semibold text-text shadow-sm">
			{row.employee.first_name[0]}{row.employee.last_name[0]}
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.employee.name}</p>
			<div class="flex items-center gap-1.5">
				<span class="text-[11px] text-text-subtle">
					{row.employee.salary_scale !== null
						? `S${row.employee.salary_scale}.${row.employee.salary_periodiek}`
						: '—'}
				</span>
				{#if row.isZorgcoordinator}
					<span class="inline-block rounded-md bg-brand/10 px-1.5 py-px text-[9px] font-bold text-brand">COORD</span>
				{/if}
				<span class="inline-block rounded-md {row.isZeroHoursContract ? 'bg-info/10 text-info' : 'bg-text/5 text-text-muted'} px-1.5 py-px text-[9px] font-bold">
					{row.isZeroHoursContract ? '0u' : `${row.employee.hours_per_week ?? 36}u/w`}
				</span>
				{#if row.isOverScheduled}
					<span class="inline-flex items-center gap-0.5 rounded-md bg-error/10 px-1.5 py-px text-[9px] font-bold text-error">
						<AlertTriangle class="h-2.5 w-2.5" /> +{Math.ceil(row.shiftsDifference)}
					</span>
				{/if}
				{#if row.isUnderScheduled}
					<span class="inline-flex items-center gap-0.5 rounded-md bg-warning/10 px-1.5 py-px text-[9px] font-bold text-warning">
						<AlertTriangle class="h-2.5 w-2.5" /> {Math.floor(row.shiftsDifference)}
					</span>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#snippet shiftsCell(row: EmployeeSalaryRow)}
	{#if row.isZeroHoursContract}
		<span class="text-sm tabular-nums text-text">{row.shifts}</span>
	{:else}
		<span class="text-sm tabular-nums {row.isOverScheduled ? 'font-bold text-error' : row.isUnderScheduled ? 'font-bold text-warning' : 'text-text'}">
			{row.shifts}<span class="text-text-subtle">/{Math.floor(row.maxShifts)}</span>
		</span>
	{/if}
{/snippet}

{#snippet hoursCell(row: EmployeeSalaryRow)}
	<div>
		<span class="text-sm tabular-nums {row.isOverHours ? 'font-bold text-error' : row.isUnderHours ? 'font-bold text-warning' : 'text-text'}">
			{row.regularHours.toFixed(1)}
		</span>
		{#if (row.isOverHours || row.isUnderHours) && !row.isZeroHoursContract}
			<div class="text-[10px] tabular-nums {row.isOverHours ? 'text-error' : 'text-warning'}">
				{row.isOverHours ? '+' : ''}{row.hoursDifference.toFixed(1)}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet ortCell(row: EmployeeSalaryRow)}
	{#if row.ortBreakdown.totalOrtHours > 0}
		<span class="inline-flex items-center rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400">
			{row.ortBreakdown.totalOrtHours.toFixed(1)}
		</span>
	{:else}
		<span class="text-xs text-text-subtle">—</span>
	{/if}
{/snippet}

{#snippet regularPayCell(row: EmployeeSalaryRow)}
	<span class="text-sm tabular-nums text-text">{fmt(row.regularPay)}</span>
{/snippet}

{#snippet surchargeCell(row: EmployeeSalaryRow)}
	{#if row.totalOrt > 0}
		<span class="text-sm tabular-nums text-emerald-600 dark:text-emerald-400">+{fmt(row.totalOrt)}</span>
	{:else}
		<span class="text-sm text-text-subtle">—</span>
	{/if}
{/snippet}

{#snippet grossCell(row: EmployeeSalaryRow)}
	<span class="text-sm font-extrabold tabular-nums text-text">{fmt(row.totalGross)}</span>
{/snippet}

{#snippet actionsCell(row: EmployeeSalaryRow)}
	<div class="flex items-center justify-end gap-0.5">
		<button
			class="flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-border/50 hover:text-text"
			onclick={() => openDetail(row)}
			aria-label={m.salaris_view()}
			title={m.salaris_view()}
		>
			<Eye class="h-3.5 w-3.5" />
		</button>
		<button
			class="flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-border/50 hover:text-text"
			onclick={() => onDownloadPdf(row)}
			aria-label="Download"
		>
			<Download class="h-3.5 w-3.5" />
		</button>
		<button
			class="flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-border/50 hover:text-text"
			onclick={() => onPreviewPdf(row)}
			aria-label="Preview"
		>
			<ExternalLink class="h-3.5 w-3.5" />
		</button>
	</div>
{/snippet}

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

<!-- ORT Detail Modal -->
<Modal bind:open={showDetailModal} title="{selectedRow?.employee.name ?? ''} — {m.salaris_ort_breakdown()}" description={m.salaris_ort_breakdown()} size="lg">
	{#if selectedRow}
		<div class="space-y-6">
			<!-- Summary row -->
			<div class="grid grid-cols-3 gap-4">
				<div class="rounded-xl border border-border bg-surface p-4">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.salaris_shifts()}</div>
					<div class="mt-1 text-xl font-bold tabular-nums text-text">{selectedRow.shifts}</div>
				</div>
				<div class="rounded-xl border border-border bg-surface p-4">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.salaris_regular_hours()}</div>
					<div class="mt-1 text-xl font-bold tabular-nums text-text">{selectedRow.regularHours.toFixed(1)}</div>
				</div>
				<div class="rounded-xl border border-border bg-surface p-4">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.salaris_gross_total_label()}</div>
					<div class="mt-1 text-xl font-bold tabular-nums text-text">{fmt(selectedRow.totalGross)}</div>
				</div>
			</div>

			<!-- ORT breakdown -->
			<div class="rounded-xl border border-border/30 bg-surface p-5">
				<div class="mb-4 text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">{m.salaris_ort_breakdown()}</div>
				<div class="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-5">
					{#each [
						{ label: m.salaris_ort_early(), hours: selectedRow.ortBreakdown.earlyMorningHours, pct: ORT_PERCENTAGES.earlyMorning, amt: selectedRow.ortAmounts?.earlyMorningOrt ?? 0 },
						{ label: m.salaris_ort_evening(), hours: selectedRow.ortBreakdown.eveningHours, pct: ORT_PERCENTAGES.evening, amt: selectedRow.ortAmounts?.eveningOrt ?? 0 },
						{ label: m.salaris_ort_night(), hours: selectedRow.ortBreakdown.nightHours, pct: ORT_PERCENTAGES.night, amt: selectedRow.ortAmounts?.nightOrt ?? 0 },
						{ label: m.salaris_ort_saturday(), hours: selectedRow.ortBreakdown.saturdayDayHours, pct: ORT_PERCENTAGES.saturdayDay, amt: selectedRow.ortAmounts?.saturdayDayOrt ?? 0 },
						{ label: m.salaris_ort_sunday(), hours: selectedRow.ortBreakdown.sundayHolidayHours, pct: ORT_PERCENTAGES.sundayHoliday, amt: selectedRow.ortAmounts?.sundayHolidayOrt ?? 0 }
					] as item}
						<div>
							<div class="text-[10px] font-semibold text-text-subtle">{item.label}</div>
							<div class="mt-0.5 text-sm font-bold tabular-nums text-text">
								{item.hours.toFixed(1)}u × {(item.pct * 100).toFixed(0)}%
							</div>
							<div class="text-xs tabular-nums text-text-muted">{fmt(item.amt)}</div>
						</div>
					{/each}
				</div>
				{#if selectedRow.hourlyRate}
					<div class="mt-4 border-t border-border/30 pt-4 text-[11px] text-text-subtle">
						{m.salaris_hourly_rate()}: <span class="font-semibold text-text-muted">{fmt(selectedRow.hourlyRate)}</span>
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
					<div class="text-sm font-semibold tabular-nums text-text">{fmt(selectedRow.regularPay)}</div>
					<div class="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">+{fmt(selectedRow.totalOrt)}</div>
				</div>
			</div>
			<div class="flex items-center justify-between rounded-xl border-2 border-brand/20 bg-brand/5 p-4">
				<div class="text-sm font-bold text-text">{m.salaris_gross_total_label()}</div>
				<div class="text-lg font-extrabold tabular-nums text-text">{fmt(selectedRow.totalGross)}</div>
			</div>
		</div>
	{/if}
</Modal>
