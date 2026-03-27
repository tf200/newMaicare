<script lang="ts">
	import { CheckCircle, Clock, XCircle } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	type Props = {
		pendingCount: number;
		approvedCount: number;
		rejectedCount: number;
		sickCount: number;
	};

	let { pendingCount, approvedCount, rejectedCount, sickCount }: Props = $props();

	const stats = $derived([
		{
			key: 'pending',
			value: pendingCount,
			label: () => m.leave_stats_open(),
			sub: () => m.leave_stats_open_sub(),
			bg: 'bg-warning/10',
			text: 'text-warning',
			icon: Clock
		},
		{
			key: 'approved',
			value: approvedCount,
			label: () => m.leave_stats_approved(),
			sub: () => m.leave_stats_approved_sub(),
			bg: 'bg-success/10',
			text: 'text-success',
			icon: CheckCircle
		},
		{
			key: 'rejected',
			value: rejectedCount,
			label: () => m.leave_stats_rejected(),
			sub: () => m.leave_stats_rejected_sub(),
			bg: 'bg-error/10',
			text: 'text-error',
			icon: XCircle
		}
	]);
</script>

<div class="group relative flex overflow-hidden rounded-3xl border border-border bg-surface">
	<div class="absolute inset-0 bg-gradient-to-r from-warning/3 via-success/3 to-error/3"></div>

	{#each stats as stat, i (stat.key)}
		{@const Icon = stat.icon}
		<button
			class="group/stat relative flex flex-1 items-center gap-4 px-6 py-5 transition-all hover:bg-white/50 dark:hover:bg-white/5"
		>
			<div
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl {stat.bg} {stat.text} transition-transform duration-300 group-hover/stat:scale-110"
			>
				<Icon class="h-5 w-5" />
			</div>
			<div class="flex-1 text-left">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{stat.label()}
				</div>
				<div class="mt-0.5 text-2xl font-bold tracking-tight text-text">{stat.value}</div>
				<div class="mt-0.5 text-xs font-medium text-text-muted">{stat.sub()}</div>
			</div>

			{#if i < stats.length - 1}
				<div class="absolute top-1/2 right-0 h-12 w-px -translate-y-1/2 bg-border/60"></div>
			{/if}
		</button>
	{/each}
</div>
