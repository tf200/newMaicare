<script lang="ts">
	import { Target } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		totalEmployees: number;
		completedCount: number;
		thisMonthCount: number;
		avgScore: number | null;
		coveragePercent: number;
		coveredCount: number;
	}

	let { totalEmployees, completedCount, thisMonthCount, avgScore, coveragePercent, coveredCount }: Props = $props();

	const items = $derived([
		{
			label: m.func_employees(),
			value: String(totalEmployees),
			sub: m.func_active_in_review(),
			color: 'from-rose-500/12 to-rose-500/3',
			valueColor: 'text-rose-700 dark:text-rose-300'
		},
		{
			label: m.func_assessments(),
			value: String(completedCount),
			sub: `${thisMonthCount} ${m.func_completed_this_month()}`,
			color: 'from-amber-500/12 to-amber-500/3',
			valueColor: 'text-amber-700 dark:text-amber-300'
		},
		{
			label: m.func_avg_score(),
			value: avgScore !== null ? avgScore.toFixed(1) : '—',
			sub: avgScore !== null ? m.func_of_ten() : m.func_no_scores(),
			color: 'from-emerald-500/12 to-emerald-500/3',
			valueColor: 'text-emerald-700 dark:text-emerald-300'
		},
		{
			label: m.func_coverage(),
			value: `${coveragePercent}%`,
			sub: `${coveredCount} ${m.func_assessed_of()} ${totalEmployees}`,
			color: 'from-indigo-500/12 to-indigo-500/3',
			valueColor: 'text-indigo-700 dark:text-indigo-300'
		}
	]);
</script>

<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
	{#each items as item, i}
		<div
			class="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface transition-all duration-200 hover:border-border hover:shadow-sm"
			style="animation: fade-in 400ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: {i * 80}ms"
		>
			<div class="absolute inset-0 bg-gradient-to-br {item.color}"></div>
			<div class="relative p-5">
				<div class="text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">{item.label}</div>
				<div class="mt-2 text-[28px] leading-none font-extrabold tracking-tight {item.valueColor}">{item.value}</div>
				<div class="mt-1.5 text-[11px] font-semibold text-text-muted">{item.sub}</div>
			</div>
		</div>
	{/each}
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
