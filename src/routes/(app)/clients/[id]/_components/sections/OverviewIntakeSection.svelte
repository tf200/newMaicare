<script lang="ts">
	import { ListChecks } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewData } from '$lib/mock/client-overview';

	interface Props {
		intakeSummary: ClientOverviewData['intakeSummary'];
	}

	let { intakeSummary }: Props = $props();
</script>

<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center gap-2">
		<ListChecks class="h-4 w-4 text-text-subtle" />
		<h3 class="font-bold text-text">{m.intake_summary()}</h3>
	</div>
	{#if intakeSummary}
		<div class="space-y-3">
			<div class="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.conclusion()}
				</p>
				<p class="mt-1 text-xs font-medium text-text">{intakeSummary.conclusion}</p>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-xs text-text-muted">{m.self_reliance()}</span>
				<span class="text-xs font-bold text-text">{intakeSummary.selfReliance}/100</span>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
				<div class="h-full bg-brand" style={`width: ${intakeSummary.selfReliance}%`}></div>
			</div>
			<div class="mt-4">
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.growth_areas()}
				</p>
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#each intakeSummary.lowestTopics as topic, index (`${topic}-${index}`)}
						<span class="rounded-lg border border-border bg-white px-2 py-1 text-[10px] font-medium text-text-muted dark:bg-zinc-900">
							{topic}
						</span>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
