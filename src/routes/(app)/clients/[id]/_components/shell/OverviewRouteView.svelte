<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type { OverviewLoadResult } from '../../overview.shared';
	import OverviewScreen from './OverviewScreen.svelte';

	interface Props {
		overviewData: Promise<OverviewLoadResult>;
	}

	let { overviewData }: Props = $props();
</script>

{#await overviewData}
	<div class="space-y-4">
		<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then result}
	{#if result.loadError}
		<InlineErrorBanner message={result.loadError} onRetry={() => invalidateAll()} />
	{/if}
	<OverviewScreen overview={result.overview} />
{/await}
