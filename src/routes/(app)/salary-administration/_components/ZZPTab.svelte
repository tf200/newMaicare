<script lang="ts">
	import { Users, Clock, Euro } from 'lucide-svelte';
	import type { ZzpSalaryRow, ZzpTotals } from '$lib/types/api/salary';

	interface Props {
		rows: ZzpSalaryRow[];
		totals: ZzpTotals;
		loading: boolean;
	}

	let { rows, totals, loading }: Props = $props();

	const fmt = (amount: number) =>
		new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

	const activeCount = $derived(rows.filter((d) => d.shifts > 0).length);
</script>

<div class="space-y-6">
	<!-- Summary strip -->
	<div class="flex gap-4 overflow-x-auto">
		{#each [
			{ label: 'Actief', value: `${activeCount}`, sub: `van ${rows.length} totaal`, icon: Users, color: 'text-teal-600 dark:text-teal-400' },
			{ label: 'Uren', value: totals.totalHours.toFixed(1), sub: `${totals.totalShifts} diensten`, icon: Clock, color: 'text-indigo-600 dark:text-indigo-400' },
			{ label: 'Totale Kosten', value: fmt(totals.totalCost), sub: 'deze maand', icon: Euro, color: 'text-orange-600 dark:text-orange-400' }
		] as stat}
			<div class="flex min-w-[200px] flex-1 items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-border/30 {stat.color}">
					<stat.icon class="h-4 w-4" />
				</div>
				<div>
					<div class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">{stat.label}</div>
					<div class="mt-0.5 text-xl font-extrabold tracking-tight tabular-nums text-text">{stat.value}</div>
					<div class="text-[11px] text-text-subtle">{stat.sub}</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Table -->
	<div>
		<div class="border-b-2 border-text/10 pb-4 mb-1">
			<h2 class="text-lg font-extrabold tracking-tight text-text">ZZP'ers</h2>
			<p class="text-xs text-text-subtle">Ingehuurde freelancers en totale kosten</p>
		</div>

		{#if loading}
			<div class="space-y-2 py-6">
				{#each Array(4) as _, i}
					<div class="h-12 animate-pulse rounded-xl bg-border/20" style="animation-delay: {i * 60}ms"></div>
				{/each}
			</div>
		{:else if rows.length === 0}
			<div class="flex flex-col items-center py-16 text-text-subtle">
				<Users class="mb-3 h-10 w-10 opacity-30" />
				<p class="text-sm font-medium">Geen ZZP'ers gevonden</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full min-w-[600px]">
					<thead>
						<tr class="border-b border-text/8">
							<th class="pb-3 pt-4 text-left text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">ZZP'er</th>
							<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Diensten</th>
							<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Uren</th>
							<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Tarief</th>
							<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Kosten</th>
						</tr>
					</thead>
					<tbody>
						{#each rows as row, idx (row.employee.id)}
							<tr class="border-b border-border/40 {idx % 2 === 0 ? '' : 'bg-border/15'}">
								<td class="py-3">
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-[10px] font-bold text-orange-600 dark:text-orange-400">
											{row.employee.first_name[0]}{row.employee.last_name[0]}
										</div>
										<div>
											<span class="text-sm font-bold text-text">{row.employee.name}</span>
											<span class="ml-2 inline-block rounded-md bg-orange-500/10 px-1.5 py-px text-[9px] font-bold text-orange-600 dark:text-orange-400">ZZP</span>
										</div>
									</div>
								</td>
								<td class="py-3 text-right text-sm tabular-nums text-text">{row.shifts}</td>
								<td class="py-3 text-right text-sm tabular-nums text-text">{row.regularHours.toFixed(1)}</td>
								<td class="py-3 text-right text-sm tabular-nums text-text">
									{row.hourlyRate ? fmt(row.hourlyRate) : '—'}
								</td>
								<td class="py-3 text-right text-sm font-extrabold tabular-nums text-text">{fmt(row.totalCost)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="border-t-2 border-text/10">
							<td class="py-4 text-sm font-extrabold text-text">Totaal</td>
							<td class="py-4 text-right text-sm font-bold tabular-nums text-text">{totals.totalShifts}</td>
							<td class="py-4 text-right text-sm font-bold tabular-nums text-text">{totals.totalHours.toFixed(1)}</td>
							<td class="py-4 text-right text-sm text-text-subtle">—</td>
							<td class="py-4 text-right text-base font-extrabold tabular-nums text-text">{fmt(totals.totalCost)}</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>
