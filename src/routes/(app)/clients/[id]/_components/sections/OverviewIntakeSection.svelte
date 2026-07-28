<script lang="ts">
	import { ListChecks } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewData } from '../../overview.shared';

	interface Props {
		intakeSummary: ClientOverviewData['intakeSummary'];
	}

	let { intakeSummary }: Props = $props();
</script>

<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center gap-2">
		<ListChecks class="h-4 w-4 text-text-muted" aria-hidden="true" />
		<h2 class="text-lg font-semibold tracking-tight text-text">{m.intake_summary()}</h2>
	</div>
	{#if intakeSummary}
		<div class="space-y-3">
			<div class="rounded-2xl bg-bg p-3">
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.conclusion()}
				</p>
				<p class="mt-1 text-xs font-medium text-text">{intakeSummary.conclusion}</p>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-xs text-text-muted">{m.self_reliance()}</span>
				<span class="text-xs font-bold text-text">{intakeSummary.selfReliance}/100</span>
			</div>
			<div
				class="h-1.5 w-full overflow-hidden rounded-full bg-border"
				role="progressbar"
				aria-label={m.self_reliance()}
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={intakeSummary.selfReliance}
			>
				<div class="h-full bg-brand" style={`width: ${intakeSummary.selfReliance}%`}></div>
			</div>
			<div class="mt-4">
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.growth_areas()}
				</p>
				{#if intakeSummary.lowestTopics.length > 0}
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each intakeSummary.lowestTopics as topic, index (`${topic}-${index}`)}
							<span
								class="rounded-lg border border-border bg-bg px-2 py-1 text-[10px] font-medium text-text-muted"
							>
								{topic}
							</span>
						{/each}
					</div>
				{:else}
					<p class="mt-2 text-xs text-text-muted">{m.no_growth_areas()}</p>
				{/if}
			</div>
		</div>
	{:else}
		<p class="text-sm text-text-muted">{m.no_intake_summary()}</p>
	{/if}
</section>
