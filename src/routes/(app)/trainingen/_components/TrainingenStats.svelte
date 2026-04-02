<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { GraduationCap, CheckCircle2, XCircle, AlertTriangle } from 'lucide-svelte';
	import StatsCard from '$lib/components/ui/StatsCard.svelte';

	interface Props {
		total: number;
		completed: number;
		expired: number;
		expiringSoon: number;
	}

	let { total, completed, expired, expiringSoon }: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<StatsCard
		label={m.train_total()}
		value={total}
		icon={GraduationCap}
		color="text-indigo-600"
		hoverBorder="hover:border-indigo-500/30"
	/>
	<StatsCard
		label={m.train_completed()}
		value={completed}
		icon={CheckCircle2}
		color="text-emerald-600"
		hoverBorder="hover:border-emerald-500/30"
	/>
	<StatsCard
		label={m.train_expired()}
		value={expired}
		icon={XCircle}
		color="text-rose-600"
		hoverBorder="hover:border-rose-500/30"
	/>
	<StatsCard
		label={m.train_expiring_soon()}
		value={expiringSoon}
		icon={AlertTriangle}
		color="text-amber-600"
		hoverBorder="hover:border-amber-500/30"
	/>
</div>
