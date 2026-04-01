<script lang="ts">
	import { Euro, Clock, Calculator, TrendingUp } from 'lucide-svelte';
	import type { SalaryTotals } from '$lib/types/api/salary';
	import { m } from '$lib/paraglide/messages';
	import StatsCard from '$lib/components/ui/StatsCard.svelte';

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
			value: `${totals.regularHours.toFixed(1)} ${m.salaris_hours()}`,
			sub: `${totals.totalShifts} ${m.salaris_shifts()}`,
			icon: Clock,
			color: 'text-teal-600',
			hoverBorder: 'hover:border-teal-500/30'
		},
		{
			label: m.salaris_ort_hours(),
			value: `${totals.totalOrtHours.toFixed(1)} ${m.salaris_hours()}`,
			sub: `${totals.eveningOrtHours.toFixed(1)} avond · ${totals.nightOrtHours.toFixed(1)} nacht · ${totals.saturdayOrtHours.toFixed(1)} za`,
			icon: Calculator,
			color: 'text-amber-600',
			hoverBorder: 'hover:border-amber-500/30'
		},
		{
			label: m.salaris_regular_pay(),
			value: formatCurrency(totals.regularPay),
			sub: m.salaris_excl_ort(),
			icon: Euro,
			color: 'text-indigo-600',
			hoverBorder: 'hover:border-indigo-500/30'
		},
		{
			label: m.salaris_gross_total(),
			value: formatCurrency(totals.totalGross),
			sub: `+${formatCurrency(totals.totalOrt)} ${m.salaris_ort_surcharge()}`,
			icon: TrendingUp,
			color: 'text-emerald-600',
			hoverBorder: 'hover:border-emerald-500/30'
		}
	]);
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	{#each items as item}
		<StatsCard
			label={item.label}
			value={item.value}
			sub={item.sub}
			icon={item.icon}
			color={item.color}
			hoverBorder={item.hoverBorder}
		/>
	{/each}
</div>
