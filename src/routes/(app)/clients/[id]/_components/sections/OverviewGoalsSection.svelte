<script lang="ts">
	import { Target } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewGoal } from '$lib/mock/client-overview';

	interface Props {
		goals: ClientOverviewGoal[];
	}

	let { goals }: Props = $props();

	const priorityColors = {
		high: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
		medium: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
		low: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
	};

	const prioritySolidColors = {
		high: 'bg-rose-500',
		medium: 'bg-orange-500',
		low: 'bg-blue-500'
	};
</script>

<section class="rounded-3xl border border-border bg-surface shadow-sm">
	<div class="flex items-center justify-between border-b border-border/50 p-6">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
				<Target class="h-5 w-5" />
			</div>
			<h3 class="text-lg font-bold text-text">{m.top_care_goals()}</h3>
		</div>
		<button class="text-sm font-bold text-brand transition hover:underline">{m.view_all()}</button>
	</div>
	<div class="space-y-4 p-4 sm:p-6">
		{#if goals.length === 0}
			<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-zinc-50/50 px-6 py-12 text-center dark:bg-zinc-900/20">
				<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
					<Target class="h-6 w-6 text-zinc-400" />
				</div>
				<p class="text-sm font-medium text-text-subtle">{m.no_care_goals_yet()}</p>
				<p class="mt-1 text-xs text-text-muted">{m.care_goals_will_appear()}</p>
			</div>
		{:else}
			<div class="grid gap-3">
				{#each goals as goal, index (`${goal.title}-${index}`)}
					<article class="group relative overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm transition-all hover:border-brand/30 hover:shadow-md dark:bg-zinc-900/40">
						<div class={`absolute inset-y-0 left-0 w-1.5 ${prioritySolidColors[goal.priority]}`}></div>
						<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-8">
							<div class="min-w-0 flex-1">
								<p class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">{m.title()}</p>
								<p class="mt-1 truncate text-[15px] leading-tight font-bold text-text transition-colors group-hover:text-brand">{goal.title}</p>
							</div>
							<div class="sm:w-36 sm:border-l sm:border-border/40 sm:pl-6">
								<p class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">{m.priority()}</p>
								<span class={`mt-1 inline-flex rounded-full border px-2 py-1 text-[10px] font-black tracking-wide uppercase ${priorityColors[goal.priority]}`}>{goal.priority}</span>
							</div>
							<div class="sm:w-64 sm:border-l sm:border-border/40 sm:pl-6">
								<p class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">{m.topic()}</p>
								<p class="mt-1 text-xs leading-relaxed font-medium text-text-muted">{goal.progressNote || m.not_specified()}</p>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>
