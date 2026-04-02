<script lang="ts">
	import StatsCard from '$lib/components/ui/StatsCard.svelte';
	import { Clock, Send, CheckCircle, XCircle } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		draft: number;
		submitted: number;
		approved: number;
		rejected: number;
	}

	let { draft, submitted, approved, rejected }: Props = $props();

	function formatHours(h: number): string {
		const whole = Math.floor(h);
		const minutes = Math.round((h - whole) * 60);
		if (minutes === 0) return `${whole}${m.uren_unit_hour_short()}`;
		return `${whole}${m.uren_unit_hour_short()} ${minutes}${m.uren_unit_minute_short()}`;
	}
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<StatsCard
		label={m.uren_status_draft()}
		value={formatHours(draft)}
		sub={m.uren_status_draft()}
		icon={Clock}
		hoverBorder="hover:border-brand/30"
	/>
	<StatsCard
		label={m.uren_status_submitted()}
		value={formatHours(submitted)}
		sub={m.uren_status_submitted()}
		icon={Send}
		color="text-brand"
		valueColor="text-brand"
	/>
	<StatsCard
		label={m.uren_status_approved()}
		value={formatHours(approved)}
		sub={m.uren_status_approved()}
		icon={CheckCircle}
		color="text-emerald-600"
		valueColor="text-emerald-600"
		hoverBorder="hover:border-emerald-500/30"
	/>
	<StatsCard
		label={m.uren_status_rejected()}
		value={formatHours(rejected)}
		sub={m.uren_status_rejected()}
		icon={XCircle}
		color="text-rose-600"
		valueColor="text-rose-600"
		hoverBorder="hover:border-rose-500/30"
	/>
</div>
