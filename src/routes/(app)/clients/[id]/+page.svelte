<script lang="ts">
	import type { PageProps } from './$types';
	import OverviewScreen from './_components/shell/OverviewScreen.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { m } from '$lib/paraglide/messages';
	import { invalidate } from '$app/navigation';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.client_details()} | {m.app_name()}</title>
</svelte:head>

{#await data.overviewData}
	<div class="space-y-4" role="status" aria-label={m.loading()}>
		<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then result}
	{#if result.overview}
		<OverviewScreen overview={result.overview} />
	{:else}
		<InlineErrorBanner
			message={result.loadError ?? m.failed_load_client()}
			onRetry={() => invalidate(`app:client:${data.clientId}:detail`)}
		/>
	{/if}
{/await}
