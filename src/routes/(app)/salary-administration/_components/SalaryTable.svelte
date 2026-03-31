<script lang="ts">
	import { ChevronDown, Download, ExternalLink, AlertTriangle } from 'lucide-svelte';
	import type { EmployeeSalaryRow, SalaryTotals } from '$lib/types/api/salary';
	import { ORT_PERCENTAGES } from '$lib/utils/ort';

	interface Props {
		rows: EmployeeSalaryRow[];
		totals: SalaryTotals;
		loading: boolean;
		includeBreaks: boolean;
		onDownloadPdf: (row: EmployeeSalaryRow) => void;
		onPreviewPdf: (row: EmployeeSalaryRow) => void;
	}

	let { rows, totals, loading, onDownloadPdf, onPreviewPdf }: Props = $props();

	let expandedRows = $state<Set<string>>(new Set());

	function toggleRow(id: string) {
		const next = new Set(expandedRows);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expandedRows = next;
	}

	const fmt = (amount: number) =>
		new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
</script>

<div>
	<!-- Header bar -->
	<div class="flex items-baseline justify-between border-b-2 border-text/10 pb-4 mb-1">
		<div>
			<h2 class="text-lg font-extrabold tracking-tight text-text">Salarisoverzicht</h2>
			<p class="text-xs text-text-subtle">Klik op een rij voor ORT details</p>
		</div>
		<div class="text-right">
			<span class="text-xs font-semibold text-text-subtle">{rows.length} medewerkers</span>
		</div>
	</div>

	{#if loading}
		<div class="space-y-2 py-6">
			{#each Array(6) as _, i}
				<div class="h-14 animate-pulse rounded-xl bg-border/20" style="animation-delay: {i * 80}ms"></div>
			{/each}
		</div>
	{:else}
		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="w-full min-w-[960px]">
				<thead>
					<tr class="border-b border-text/8">
						<th class="w-10 pb-3 pt-4"></th>
						<th class="pb-3 pt-4 text-left text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Medewerker</th>
						<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Diensten</th>
						<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Uren</th>
						<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">ORT</th>
						<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Regulier</th>
						<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Toeslag</th>
						<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Bruto</th>
						<th class="w-20 pb-3 pt-4"></th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row, idx (row.employee.id)}
						{@const isExpanded = expandedRows.has(row.employee.id)}
						<tr
							class="group border-b border-border/40 transition-colors {idx % 2 === 0
								? 'bg-transparent'
								: 'bg-border/15'} hover:bg-brand/5 {row.isOverScheduled
								? '!bg-error/5'
								: row.isUnderScheduled
									? '!bg-warning/5'
									: ''}"
						>
							<!-- Expand -->
							<td class="py-3 pl-2">
								<button
									class="flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:bg-border/50"
									onclick={() => toggleRow(row.employee.id)}
								>
									<ChevronDown
										class="h-3.5 w-3.5 text-text-subtle transition-transform duration-200 {isExpanded
											? 'rotate-180'
											: ''}"
									/>
								</button>
							</td>

							<!-- Name -->
							<td class="py-3">
								<div class="flex items-center gap-3">
									<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-text/5 text-[10px] font-bold text-text-muted">
										{row.employee.first_name[0]}{row.employee.last_name[0]}
									</div>
									<div>
										<div class="text-sm font-bold text-text">{row.employee.name}</div>
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
							</td>

							<!-- Shifts -->
							<td class="py-3 text-right">
								{#if row.isZeroHoursContract}
									<span class="text-sm tabular-nums text-text">{row.shifts}</span>
								{:else}
									<div>
										<span class="text-sm tabular-nums {row.isOverScheduled ? 'font-bold text-error' : row.isUnderScheduled ? 'font-bold text-warning' : 'text-text'}">
											{row.shifts}<span class="text-text-subtle">/{Math.floor(row.maxShifts)}</span>
										</span>
									</div>
								{/if}
							</td>

							<!-- Hours -->
							<td class="py-3 text-right">
								<span class="text-sm tabular-nums {row.isOverHours ? 'font-bold text-error' : row.isUnderHours ? 'font-bold text-warning' : 'text-text'}">
									{row.regularHours.toFixed(1)}
								</span>
								{#if (row.isOverHours || row.isUnderHours) && !row.isZeroHoursContract}
									<div class="text-[10px] tabular-nums {row.isOverHours ? 'text-error' : 'text-warning'}">
										{row.isOverHours ? '+' : ''}{row.hoursDifference.toFixed(1)}
									</div>
								{/if}
							</td>

							<!-- ORT -->
							<td class="py-3 text-right">
								{#if row.ortBreakdown.totalOrtHours > 0}
									<span class="inline-flex items-center rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400">
										{row.ortBreakdown.totalOrtHours.toFixed(1)}
									</span>
								{:else}
									<span class="text-xs text-text-subtle">—</span>
								{/if}
							</td>

							<!-- Regular pay -->
							<td class="py-3 text-right text-sm tabular-nums text-text">{fmt(row.regularPay)}</td>

							<!-- ORT amount -->
							<td class="py-3 text-right text-sm tabular-nums">
								{#if row.totalOrt > 0}
									<span class="text-emerald-600 dark:text-emerald-400">+{fmt(row.totalOrt)}</span>
								{:else}
									<span class="text-text-subtle">—</span>
								{/if}
							</td>

							<!-- Total -->
							<td class="py-3 text-right">
								<span class="text-sm font-extrabold tabular-nums text-text">{fmt(row.totalGross)}</span>
							</td>

							<!-- Actions -->
							<td class="py-3 pr-2" onclick={(e) => e.stopPropagation()}>
								<div class="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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
							</td>
						</tr>

						<!-- Expanded ORT detail -->
						{#if isExpanded}
							<tr class="border-b border-border/40 bg-brand/[0.02]">
								<td></td>
								<td colspan="8" class="px-4 py-4">
									<div class="rounded-xl border border-border/30 bg-surface p-4">
										<div class="mb-3 text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">ORT Breakdown</div>
										<div class="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-5">
											{#each [
												{ label: 'Ochtend 06-07', hours: row.ortBreakdown.earlyMorningHours, pct: ORT_PERCENTAGES.earlyMorning, amt: row.ortAmounts?.earlyMorningOrt ?? 0 },
												{ label: 'Avond 19-22', hours: row.ortBreakdown.eveningHours, pct: ORT_PERCENTAGES.evening, amt: row.ortAmounts?.eveningOrt ?? 0 },
												{ label: 'Nacht 22-06', hours: row.ortBreakdown.nightHours, pct: ORT_PERCENTAGES.night, amt: row.ortAmounts?.nightOrt ?? 0 },
												{ label: 'Zaterdag', hours: row.ortBreakdown.saturdayDayHours, pct: ORT_PERCENTAGES.saturdayDay, amt: row.ortAmounts?.saturdayDayOrt ?? 0 },
												{ label: 'Zo/Feestdag', hours: row.ortBreakdown.sundayHolidayHours, pct: ORT_PERCENTAGES.sundayHoliday, amt: row.ortAmounts?.sundayHolidayOrt ?? 0 }
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
										{#if row.hourlyRate}
											<div class="mt-3 border-t border-border/30 pt-3 text-[11px] text-text-subtle">
												Uurloon: <span class="font-semibold text-text-muted">{fmt(row.hourlyRate)}</span>
											</div>
										{/if}
									</div>
								</td>
							</tr>
						{/if}
					{/each}

					{#if rows.length === 0}
						<tr>
							<td colspan="9" class="py-16 text-center text-sm text-text-subtle">Geen medewerkers gevonden</td>
						</tr>
					{/if}
				</tbody>

				<!-- Totals footer -->
				{#if rows.length > 0}
					<tfoot>
						<tr class="border-t-2 border-text/10">
							<td></td>
							<td class="py-4 text-sm font-extrabold text-text">Totaal</td>
							<td class="py-4 text-right text-sm font-bold tabular-nums text-text">{totals.totalShifts}</td>
							<td class="py-4 text-right text-sm font-bold tabular-nums text-text">{totals.regularHours.toFixed(1)}</td>
							<td class="py-4 text-right text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{totals.totalOrtHours.toFixed(1)}</td>
							<td class="py-4 text-right text-sm font-bold tabular-nums text-text">{fmt(totals.regularPay)}</td>
							<td class="py-4 text-right text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">+{fmt(totals.totalOrt)}</td>
							<td class="py-4 text-right text-base font-extrabold tabular-nums text-text">{fmt(totals.totalGross)}</td>
							<td></td>
						</tr>
					</tfoot>
				{/if}
			</table>
		</div>
	{/if}
</div>
