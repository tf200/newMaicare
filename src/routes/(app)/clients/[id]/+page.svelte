<script lang="ts">
	import type { OverviewLoadResult } from './overview.shared';
	import OverviewScreen from './_components/shell/OverviewScreen.svelte';

	let { data } = $props<{
		data: {
			overviewData: Promise<OverviewLoadResult>;
		};
	}>();
</script>

{#await data.overviewData}
	<div class="space-y-4">
		<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then result}
	<OverviewScreen overview={result.overview} />
{/await}
