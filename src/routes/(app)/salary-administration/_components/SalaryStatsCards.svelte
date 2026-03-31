<script lang="ts">
	import { Euro, Clock, Calculator, TrendingUp } from 'lucide-svelte';
	import type { SalaryTotals } from '$lib/types/api/salary';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		totals: SalaryTotals;
	}

	let { totals }: Props = $props();

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('nl-NL', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	};

	const items = $derived([
		{
			label: m.salaris_total_hours(),
			value: totals.regularHours.toFixed(1),
			unit: 'uur',
			detail: `${totals.totalShifts} diensten`,
			icon: Clock,
			accent: 'text-teal-600 dark:text-teal-400',
			line: 'bg-teal-500'
		},
		{
			label: m.salaris_ort_hours(),
			value: totals.totalOrtHours.toFixed(1),
			unit: 'uur',
			detail: `${totals.eveningOrtHours.toFixed(1)} avond · ${totals.nightOrtHours.toFixed(1)} nacht · ${totals.saturdayOrtHours.toFixed(1)} za`,
			icon: Calculator,
			accent: 'text-amber-600 dark:text-amber-400',
			line: 'bg-amber-500'
		},
		{
			label: m.salaris_regular_pay(),
			value: formatCurrency(totals.regularPay),
			unit: '',
			detail: 'Exclusief ORT',
			icon: Euro,
			accent: 'text-indigo-600 dark:text-indigo-400',
			line: 'bg-indigo-500'
		},
		{
			label: m.salaris_gross_total(),
			value: formatCurrency(totals.totalGross),
			unit: '',
			detail: `+${formatCurrency(totals.totalOrt)} ORT toeslag`,
			icon: TrendingUp,
			accent: 'text-emerald-600 dark:text-emerald-400',
			line: 'bg-emerald-500'
		}
	]);
</script>

<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
	{#each items as item, i}
		<div class="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-md" style="--i: {i}">
			<!-- Top accent line -->
			<div class="h-1 {item.line} opacity-60"></div>

			<div class="p-5">
				<div class="flex items-start justify-between">
					<div class="space-y-1.5">
						<div class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">
							{item.label}
						</div>
						<div class="flex items-baseline gap-1.5">
							<span class="text-2xl font-extrabold tracking-tight text-text">{item.value}</span>
							{#if item.unit}
								<span class="text-xs font-semibold text-text-muted">{item.unit}</span>
							{/if}
						</div>
						<div class="text-[11px] font-medium text-text-subtle">{item.detail}</div>
					</div>
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-border/40 {item.accent} opacity-50 transition-opacity group-hover:opacity-100">
						<item.icon class="h-4 w-4" />
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
