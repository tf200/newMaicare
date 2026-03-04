<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { WaitlistClientLoadResult } from './+page';

	let { data } = $props<{
		data: {
			waitlistClientData: Promise<WaitlistClientLoadResult>;
		};
	}>();

	const waitlistClientDataPromise = $derived(data.waitlistClientData);
</script>

{#await waitlistClientDataPromise}
	<div class="space-y-4">
		<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then waitlistClientData}
	{#if waitlistClientData.loadError}
		<InlineErrorBanner message={waitlistClientData.loadError} onRetry={() => invalidateAll()} />
	{/if}
	<ClientOverviewPage
		client={waitlistClientData.client}
		status="on_waiting_list"
		breadcrumbSectionLabel="On Waiting List"
	/>
{/await}
