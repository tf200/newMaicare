<script lang="ts">
	import { Users, Clock, Euro } from 'lucide-svelte';
	import type { ZzpSalaryRow, ZzpTotals } from '$lib/types/api/salary';
	import StatsCard from '$lib/components/ui/StatsCard.svelte';
	import { m } from '$lib/paraglide/messages';

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
	<!-- Summary cards -->
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		<StatsCard
			label={m.salaris_zzp_active()}
			value={activeCount}
			sub={m.salaris_zzp_of_total({ total: rows.length })}
			icon={Users}
			color="text-teal-600"
			hoverBorder="hover:border-teal-500/30"
		/>
		<StatsCard
			label={m.salaris_zzp_hours()}
			value={totals.totalHours.toFixed(1)}
			sub={`${totals.totalShifts} ${m.salaris_shifts()}`}
			icon={Clock}
			color="text-indigo-600"
			hoverBorder="hover:border-indigo-500/30"
		/>
		<StatsCard
			label={m.salaris_zzp_costs()}
			value={fmt(totals.totalCost)}
			sub={m.salaris_zzp_this_month()}
			icon={Euro}
			color="text-orange-600"
			hoverBorder="hover:border-orange-500/30"
		/>
	</div>

	<!-- Table -->
	<div>
		<div class="mb-1 border-b-2 border-text/10 pb-4">
			<h2 class="text-lg font-extrabold tracking-tight text-text">{m.salaris_zzp_title()}</h2>
			<p class="text-xs text-text-subtle">{m.salaris_zzp_subtitle()}</p>
		</div>

		{#if loading}
			<div class="space-y-2 py-6">
				{#each Array(4) as _, i}
					<div
						class="h-12 animate-pulse rounded-xl bg-border/20"
						style="animation-delay: {i * 60}ms"
					></div>
				{/each}
			</div>
		{:else if rows.length === 0}
			<div class="flex flex-col items-center py-16 text-text-subtle">
				<Users class="mb-3 h-10 w-10 opacity-30" />
				<p class="text-sm font-medium">{m.salaris_zzp_no_results()}</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full min-w-[600px]">
					<thead>
						<tr class="border-b border-text/8">
							<th
								class="pt-4 pb-3 text-left text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
								>{m.salaris_zzp()}</th
							>
							<th
								class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
								>{m.salaris_shifts()}</th
							>
							<th
								class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
								>{m.salaris_hours()}</th
							>
							<th
								class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
								>{m.salaris_zzp_tarieven()}</th
							>
							<th
								class="pt-4 pb-3 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"
								>{m.salaris_zzp_kosten()}</th
							>
						</tr>
					</thead>
					<tbody>
						{#each rows as row, idx (row.employee.id)}
							<tr class="border-b border-border/40 {idx % 2 === 0 ? '' : 'bg-border/15'}">
								<td class="py-3">
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-[10px] font-bold text-orange-600 dark:text-orange-400"
										>
											{row.employee.first_name[0]}{row.employee.last_name[0]}
										</div>
										<div>
											<span class="text-sm font-bold text-text">{row.employee.name}</span>
											<span
												class="ml-2 inline-block rounded-md bg-orange-500/10 px-1.5 py-px text-[9px] font-bold text-orange-600 dark:text-orange-400"
												>ZZP</span
											>
										</div>
									</div>
								</td>
								<td class="py-3 text-right text-sm text-text tabular-nums">{row.shifts}</td>
								<td class="py-3 text-right text-sm text-text tabular-nums"
									>{row.regularHours.toFixed(1)}</td
								>
								<td class="py-3 text-right text-sm text-text tabular-nums">
									{row.hourlyRate ? fmt(row.hourlyRate) : '—'}
								</td>
								<td class="py-3 text-right text-sm font-extrabold text-text tabular-nums"
									>{fmt(row.totalCost)}</td
								>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="border-t-2 border-text/10">
							<td class="py-4 text-sm font-extrabold text-text">{m.salaris_zzp_total_label()}</td>
							<td class="py-4 text-right text-sm font-bold text-text tabular-nums"
								>{totals.totalShifts}</td
							>
							<td class="py-4 text-right text-sm font-bold text-text tabular-nums"
								>{totals.totalHours.toFixed(1)}</td
							>
							<td class="py-4 text-right text-sm text-text-subtle">—</td>
							<td class="py-4 text-right text-base font-extrabold text-text tabular-nums"
								>{fmt(totals.totalCost)}</td
							>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>
