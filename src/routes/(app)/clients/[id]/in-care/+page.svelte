<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { InCareClientLoadResult } from './+page';

	let { data } = $props<{
		data: {
			inCareClientData: Promise<InCareClientLoadResult>;
		};
	}>();

	const inCareClientDataPromise = $derived(data.inCareClientData);
</script>

{#await inCareClientDataPromise}
	<div class="space-y-4">
		<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then inCareClientData}
	{#if inCareClientData.loadError}
		<InlineErrorBanner message={inCareClientData.loadError} onRetry={() => invalidateAll()} />
	{/if}
	<ClientOverviewPage client={inCareClientData.client} status="in_care" />
{/await}
