<script lang="ts">
	import { Target } from 'lucide-svelte';
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { ClientOverviewGoal } from '../../overview.shared';

	interface Props {
		clientId: string;
		goals: ClientOverviewGoal[];
	}

	let { clientId, goals }: Props = $props();

	const priorityStyles = {
		high: 'bg-error/10 text-error-strong',
		medium: 'bg-warning/10 text-warning-strong',
		low: 'bg-info/10 text-info-strong'
	};

	const priorityLabels = {
		high: m.high,
		medium: m.medium,
		low: m.low
	};
</script>

<section class="rounded-3xl border border-border bg-surface shadow-sm">
	<div class="flex items-center justify-between px-5 py-4">
		<div class="flex items-center gap-2.5">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-bg text-text-muted">
				<Target class="h-4 w-4" aria-hidden="true" />
			</div>
			<h2 class="text-lg font-semibold tracking-tight text-text">
				{m.top_care_goals()}
			</h2>
		</div>
		<a
			href={resolve(
				localizeHref(
					resolve('/(app)/clients/[id]/goals', { id: clientId })
				) as `/clients/${string}/goals/`
			)}
			data-sveltekit-preload-data="hover"
			class="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-bold text-brand transition-colors hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
			>{m.view_all()}</a
		>
	</div>
	{#if goals.length === 0}
		<div
			class="flex flex-col items-center justify-center border-t border-dashed border-border bg-bg px-6 py-10 text-center"
		>
			<div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-border/50">
				<Target class="h-5 w-5 text-text-muted" aria-hidden="true" />
			</div>
			<p class="text-sm font-medium text-text-subtle">{m.no_care_goals_yet()}</p>
			<p class="mt-0.5 text-xs text-text-muted">{m.care_goals_will_appear()}</p>
		</div>
	{:else}
		<div class="divide-y divide-border/50">
			{#each goals as goal (`${goal.id}`)}
				<div class="flex items-center gap-4 px-5 py-3.5">
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
							{priorityLabels[goal.priority]()}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
