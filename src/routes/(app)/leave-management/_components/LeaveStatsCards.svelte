<script lang="ts">
	import { CheckCircle, Clock, XCircle, Stethoscope } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import StatsCard from '$lib/components/ui/StatsCard.svelte';

	type Props = {
		pendingCount: number;
		approvedCount: number;
		rejectedCount: number;
		sickCount: number;
	};

	let { pendingCount, approvedCount, rejectedCount, sickCount }: Props = $props();
</script>

<div class="grid gap-6 md:grid-cols-4">
	<StatsCard
		label={m.leave_stats_open()}
		value={pendingCount}
		sub={m.leave_stats_open_sub()}
		icon={Clock}
		color="text-warning"
		hoverBorder="hover:border-warning/30"
	/>
	<StatsCard
		label={m.leave_stats_approved()}
		value={approvedCount}
		sub={m.leave_stats_approved_sub()}
		icon={CheckCircle}
		color="text-success"
		hoverBorder="hover:border-success/30"
	/>
	<StatsCard
		label={m.leave_type_sick()}
		value={sickCount}
		sub={m.leave_tab_sick()}
		icon={Stethoscope}
		color="text-error"
		hoverBorder="hover:border-error/30"
	/>
	<StatsCard
		label={m.leave_stats_rejected()}
		value={rejectedCount}
		sub={m.leave_stats_rejected_sub()}
		icon={XCircle}
		color="text-zinc-400"
		hoverBorder="hover:border-zinc-300"
	/>
</div>
