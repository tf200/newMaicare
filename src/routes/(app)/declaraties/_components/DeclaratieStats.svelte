<script lang="ts">
	import StatsCard from '$lib/components/ui/StatsCard.svelte';
	import { Receipt, Clock, CheckCircle, Euro } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		total: number;
		pending: number;
		approved: number;
		paid: number;
	}

	let { total, pending, approved, paid }: Props = $props();

	const fmt = (amount: number) =>
		new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<StatsCard
		label={m.decl_total()}
		value={total}
		sub={m.decl_total()}
		icon={Receipt}
		hoverBorder=""
	/>
	<StatsCard
		label={m.decl_pending()}
		value={fmt(pending)}
		icon={Clock}
		color="text-brand"
		valueColor="text-brand"
	/>
	<StatsCard
		label={m.decl_approved()}
		value={fmt(approved)}
		icon={CheckCircle}
		color="text-emerald-600"
		valueColor="text-emerald-600"
		hoverBorder="hover:border-emerald-500/30"
	/>
	<StatsCard
		label={m.decl_paid()}
		value={fmt(paid)}
		icon={Euro}
		color="text-blue-600"
		valueColor="text-blue-600"
		hoverBorder="hover:border-blue-500/30"
	/>
</div>
