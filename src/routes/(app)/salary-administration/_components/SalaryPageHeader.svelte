<script lang="ts">
	import { BadgeEuro } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		currentMonth: Date;
	}

	let { currentMonth }: Props = $props();
</script>

<header
	class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
>
	<div
		class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-teal-100/70 to-emerald-100/20 blur-2xl"
	></div>
	<div class="relative flex flex-wrap items-start justify-between gap-6">
		<div class="space-y-3">
			<div class="flex items-center gap-3 text-sm font-semibold text-brand">
				<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
					<BadgeEuro class="h-5 w-5" />
				</span>
				<span>{m.salaris_hr_finance()}</span>
			</div>
			<h1 class="text-3xl font-bold tracking-tighter text-text">{m.salaris_label()}</h1>
			<p class="max-w-2xl text-sm font-medium text-text-muted">
				{m.salaris_subtitle()}
			</p>
		</div>
	</div>
</header>
