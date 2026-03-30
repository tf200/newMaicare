<script lang="ts">
	import { Activity } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	type Props = {
		sickCount: number;
	};

	let { sickCount }: Props = $props();

	const isUrgent = $derived(sickCount > 0);
</script>

{#if isUrgent}
	<div
		class="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-error/30 bg-error/5 p-4 transition-all duration-500 hover:bg-error/10"
	>
		<div
			class="absolute -top-8 -left-8 h-32 w-32 animate-pulse rounded-full bg-error/20 blur-2xl"
		></div>
		<div
			class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/15 text-error transition-transform duration-300 group-hover:scale-110"
		>
			<Activity class="h-5 w-5 animate-pulse" />
		</div>
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<span class="text-sm font-bold text-error">{m.leave_stats_sick()}</span>
				<span
					class="flex h-5 items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold text-white"
				>
					{sickCount}
				</span>
			</div>
			<p class="text-xs font-medium text-error/80">{m.leave_stats_sick_sub()}</p>
		</div>
	</div>
{/if}
