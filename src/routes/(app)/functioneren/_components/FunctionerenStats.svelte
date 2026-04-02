<script lang="ts">
	import { Users, ClipboardCheck, Star, Target } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import StatsCard from '$lib/components/ui/StatsCard.svelte';

	interface Props {
		totalEmployees: number;
		completedCount: number;
		thisMonthCount: number;
		avgScore: number | null;
		coveragePercent: number;
		coveredCount: number;
	}

	let {
		totalEmployees,
		completedCount,
		thisMonthCount,
		avgScore,
		coveragePercent,
		coveredCount
	}: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<StatsCard
		label={m.func_employees()}
		value={totalEmployees}
		sub={m.func_active_in_review()}
		icon={Users}
		color="text-rose-600"
		hoverBorder="hover:border-rose-500/30"
	/>
	<StatsCard
		label={m.func_assessments()}
		value={completedCount}
		sub={`${thisMonthCount} ${m.func_completed_this_month()}`}
		icon={ClipboardCheck}
		color="text-amber-600"
		hoverBorder="hover:border-amber-500/30"
	/>
	<StatsCard
		label={m.func_avg_score()}
		value={avgScore !== null ? avgScore.toFixed(1) : '—'}
		sub={avgScore !== null ? m.func_of_ten() : m.func_no_scores()}
		icon={Star}
		color="text-emerald-600"
		hoverBorder="hover:border-emerald-500/30"
	/>
	<StatsCard
		label={m.func_coverage()}
		value={`${coveragePercent}%`}
		sub={`${coveredCount} ${m.func_assessed_of()} ${totalEmployees}`}
		icon={Target}
		color="text-indigo-600"
		hoverBorder="hover:border-indigo-500/30"
	/>
</div>
