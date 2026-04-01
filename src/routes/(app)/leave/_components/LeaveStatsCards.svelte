<script lang="ts">
	import { CheckCircle, Clock, Stethoscope, XCircle } from 'lucide-svelte';
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

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<StatsCard
		label={m.leave_stats_open()}
		value={pendingCount}
		sub={m.leave_stats_open_sub()}
		icon={Clock}
		color="text-warning"
	/>
	<StatsCard
		label={m.leave_stats_approved()}
		value={approvedCount}
		sub={m.leave_stats_approved_sub()}
		icon={CheckCircle}
		color="text-success"
	/>
	<StatsCard
		label={m.leave_stats_rejected()}
		value={rejectedCount}
		sub={m.leave_stats_rejected_sub()}
		icon={XCircle}
		color="text-error"
	/>
	<StatsCard
		label={m.leave_stats_sick()}
		value={sickCount}
		sub={m.leave_stats_sick_sub()}
		icon={Stethoscope}
		color="text-error"
	/>
</div>
