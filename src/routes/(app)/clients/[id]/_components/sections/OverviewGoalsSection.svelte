<script lang="ts">
	import { Target } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewGoal } from '$lib/mock/client-overview';

	interface Props {
		goals: ClientOverviewGoal[];
	}

	let { goals }: Props = $props();

	const priorityStyles = {
		high: 'bg-rose-600 text-white',
		medium: 'bg-amber-500 text-white',
		low: 'bg-zinc-400 text-white'
	};
</script>

<section class="rounded-2xl border border-border/60 bg-surface">
	<div class="flex items-center justify-between px-5 py-4">
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
			>
				<Target class="h-3.5 w-3.5" />
			</div>
			<h3 class="text-[11px] font-bold tracking-[0.15em] text-text-subtle uppercase">
				{m.top_care_goals()}
			</h3>
		</div>
		<button
			onclick={() => goto(`/clients/${page.params.id}/goals`)}
			class="text-xs font-bold text-brand transition hover:underline">{m.view_all()}</button
		>
	</div>
	{#if goals.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-zinc-50/50 px-6 py-10 text-center dark:bg-zinc-900/20"
		>
			<div
				class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
			>
				<Target class="h-5 w-5 text-zinc-400" />
			</div>
			<p class="text-sm font-medium text-text-subtle">{m.no_care_goals_yet()}</p>
			<p class="mt-0.5 text-xs text-text-muted">{m.care_goals_will_appear()}</p>
		</div>
	{:else}
		<div class="divide-y divide-border/50">
			{#each goals as goal (`${goal.id}`)}
				<div
					class="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30"
				>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-text">{goal.title}</p>
						{#if goal.progressNote}
							<p class="mt-0.5 truncate text-xs text-text-muted">{goal.progressNote}</p>
						{/if}
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<span
							class={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${priorityStyles[goal.priority]}`}
						>
							{goal.priority}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
