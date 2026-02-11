<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { ScheduledInCareClientLoadResult } from './+page';

	let { data } = $props<{
		data: {
			scheduledClientData: Promise<ScheduledInCareClientLoadResult>;
		};
	}>();

	const scheduledClientDataPromise = $derived(data.scheduledClientData);
</script>

{#await scheduledClientDataPromise}
	<div class="space-y-4">
		<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then scheduledClientData}
	{#if scheduledClientData.loadError}
		<InlineErrorBanner message={scheduledClientData.loadError} onRetry={() => invalidateAll()} />
	{/if}
	<ClientOverviewPage client={scheduledClientData.client} status="scheduled_in_care" />
{/await}
