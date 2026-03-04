<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { OutOfCareClientLoadResult } from './+page';

	let { data } = $props<{
		data: {
			outOfCareClientData: Promise<OutOfCareClientLoadResult>;
		};
	}>();

	const outOfCareClientDataPromise = $derived(data.outOfCareClientData);
</script>

{#await outOfCareClientDataPromise}
	<div class="space-y-4">
		<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then outOfCareClientData}
	{#if outOfCareClientData.loadError}
		<InlineErrorBanner message={outOfCareClientData.loadError} onRetry={() => invalidateAll()} />
	{/if}
	<ClientOverviewPage
		client={outOfCareClientData.client}
		status="out_of_care"
		breadcrumbSectionLabel="Out of Care"
	/>
{/await}
