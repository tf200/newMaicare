<script lang="ts">
	import type { EmployeeSalaryRow, SalaryTotals } from '$lib/types/api/salary';
	import { ORT_PERCENTAGES } from '$lib/utils/ort';

	interface Props {
		rows: EmployeeSalaryRow[];
		totals: SalaryTotals;
		loading: boolean;
	}

	let { rows, totals, loading }: Props = $props();
</script>

<div>
	<div class="mb-1 border-b-2 border-text/10 pb-4">
		<h2 class="text-lg font-extrabold tracking-tight text-text">ORT Overzicht</h2>
		<p class="text-xs text-text-subtle">Onregelmatigheidsuren per medewerker — CAO Jeugdzorg</p>
	</div>

	{#if loading}
		<div class="space-y-2 py-6">
			{#each Array(6) as _, i}
				<div
					class="h-12 animate-pulse rounded-xl bg-border/20"
					style="animation-delay: {i * 60}ms"
				></div>
			{/each}
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b border-text/8">
						<th
							class="pt-4 pb-3 text-left text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
							>Medewerker</th
						>
						<th
							class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
							>Regulier</th
						>
						<th
							class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
						>
							<span
								class="inline-block rounded-md bg-teal-500/10 px-1.5 py-0.5 text-teal-600 dark:text-teal-400"
								>25%</span
							>
							<span class="ml-1">06-07</span>
						</th>
						<th
							class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
						>
							<span
								class="inline-block rounded-md bg-teal-500/10 px-1.5 py-0.5 text-teal-600 dark:text-teal-400"
								>25%</span
							>
							<span class="ml-1">19-22</span>
						</th>
						<th
							class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
						>
							<span
								class="inline-block rounded-md bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400"
								>45%</span
							>
							<span class="ml-1">22-06</span>
						</th>
						<th
							class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
						>
							<span
								class="inline-block rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-indigo-600 dark:text-indigo-400"
								>30%</span
							>
							<span class="ml-1">Za</span>
						</th>
						<th
							class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
						>
							<span
								class="inline-block rounded-md bg-rose-500/10 px-1.5 py-0.5 text-rose-600 dark:text-rose-400"
								>45%</span
							>
							<span class="ml-1">Zo</span>
						</th>
						<th
							class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
							>Totaal</th
						>
					</tr>
				</thead>
				<tbody>
					{#each rows as row, idx (row.employee.id)}
						{@const nonOrt = row.regularHours - row.ortBreakdown.totalOrtHours}
						<tr class="border-b border-border/40 {idx % 2 === 0 ? '' : 'bg-border/15'}">
							<td class="py-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-lg bg-text/5 text-[10px] font-bold text-text-muted"
									>
										{row.employee.first_name[0]}{row.employee.last_name[0]}
									</div>
									<span class="text-sm font-bold text-text">{row.employee.name}</span>
								</div>
							</td>
							<td class="py-3 text-right text-sm text-text tabular-nums">{nonOrt.toFixed(1)}u</td>
							<td
								class="py-3 text-right text-sm tabular-nums {row.ortBreakdown.earlyMorningHours > 0
									? 'font-semibold text-teal-600 dark:text-teal-400'
									: 'text-text-subtle'}"
							>
								{row.ortBreakdown.earlyMorningHours > 0
									? `${row.ortBreakdown.earlyMorningHours.toFixed(1)}u`
									: '—'}
							</td>
							<td
								class="py-3 text-right text-sm tabular-nums {row.ortBreakdown.eveningHours > 0
									? 'font-semibold text-teal-600 dark:text-teal-400'
									: 'text-text-subtle'}"
							>
								{row.ortBreakdown.eveningHours > 0
									? `${row.ortBreakdown.eveningHours.toFixed(1)}u`
									: '—'}
							</td>
							<td
								class="py-3 text-right text-sm tabular-nums {row.ortBreakdown.nightHours > 0
									? 'font-semibold text-amber-600 dark:text-amber-400'
									: 'text-text-subtle'}"
							>
								{row.ortBreakdown.nightHours > 0
									? `${row.ortBreakdown.nightHours.toFixed(1)}u`
									: '—'}
							</td>
							<td
								class="py-3 text-right text-sm tabular-nums {row.ortBreakdown.saturdayDayHours > 0
									? 'font-semibold text-indigo-600 dark:text-indigo-400'
									: 'text-text-subtle'}"
							>
								{row.ortBreakdown.saturdayDayHours > 0
									? `${row.ortBreakdown.saturdayDayHours.toFixed(1)}u`
									: '—'}
							</td>
							<td
								class="py-3 text-right text-sm tabular-nums {row.ortBreakdown.sundayHolidayHours > 0
									? 'font-semibold text-rose-600 dark:text-rose-400'
									: 'text-text-subtle'}"
							>
								{row.ortBreakdown.sundayHolidayHours > 0
									? `${row.ortBreakdown.sundayHolidayHours.toFixed(1)}u`
									: '—'}
							</td>
							<td class="py-3 text-right">
								{#if row.ortBreakdown.totalOrtHours > 0}
									<span class="text-sm font-extrabold text-text tabular-nums"
										>{row.ortBreakdown.totalOrtHours.toFixed(1)}u</span
									>
								{:else}
									<span class="text-xs text-text-subtle">—</span>
								{/if}
							</td>
						</tr>
					{/each}

					{#if rows.length === 0}
						<tr>
							<td colspan="8" class="py-16 text-center text-sm text-text-subtle"
								>Geen medewerkers gevonden</td
							>
						</tr>
					{/if}
				</tbody>

				{#if rows.length > 0}
					<tfoot>
						<tr class="border-t-2 border-text/10">
							<td class="py-4 text-sm font-extrabold text-text">Totaal</td>
							<td class="py-4 text-right text-sm font-bold text-text tabular-nums"
								>{(totals.regularHours - totals.totalOrtHours).toFixed(1)}u</td
							>
							<td
								class="py-4 text-right text-sm font-bold text-teal-600 tabular-nums dark:text-teal-400"
								>{totals.earlyMorningOrtHours.toFixed(1)}u</td
							>
							<td
								class="py-4 text-right text-sm font-bold text-teal-600 tabular-nums dark:text-teal-400"
								>{totals.eveningOrtHours.toFixed(1)}u</td
							>
							<td
								class="py-4 text-right text-sm font-bold text-amber-600 tabular-nums dark:text-amber-400"
								>{totals.nightOrtHours.toFixed(1)}u</td
							>
							<td
								class="py-4 text-right text-sm font-bold text-indigo-600 tabular-nums dark:text-indigo-400"
								>{totals.saturdayOrtHours.toFixed(1)}u</td
							>
							<td
								class="py-4 text-right text-sm font-bold text-rose-600 tabular-nums dark:text-rose-400"
								>{totals.sundayOrtHours.toFixed(1)}u</td
							>
							<td class="py-4 text-right text-base font-extrabold text-text tabular-nums"
								>{totals.totalOrtHours.toFixed(1)}u</td
							>
						</tr>
					</tfoot>
				{/if}
			</table>
		</div>
	{/if}
</div>
