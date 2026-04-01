<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { FileSignature, Clock, CheckCircle2, XCircle } from 'lucide-svelte';
	import StatsCard from '$lib/components/ui/StatsCard.svelte';

	interface Props {
		total: number;
		pending: number;
		signed: number;
		rejected: number;
	}

	let { total, pending, signed, rejected }: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<StatsCard
		label={m.ondertekenen_total()}
		value={total}
		icon={FileSignature}
		color="text-sky-600"
		hoverBorder="hover:border-sky-500/30"
	/>
	<StatsCard
		label={m.ondertekenen_pending()}
		value={pending}
		icon={Clock}
		color="text-amber-600"
		hoverBorder="hover:border-amber-500/30"
	/>
	<StatsCard
		label={m.ondertekenen_signed()}
		value={signed}
		icon={CheckCircle2}
		color="text-emerald-600"
		hoverBorder="hover:border-emerald-500/30"
	/>
	<StatsCard
		label={m.ondertekenen_rejected()}
		value={rejected}
		icon={XCircle}
		color="text-rose-600"
		hoverBorder="hover:border-rose-500/30"
	/>
</div>
