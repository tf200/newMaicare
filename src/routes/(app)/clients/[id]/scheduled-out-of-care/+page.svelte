<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { ScheduledOutOfCareClientLoadResult } from './+page';

	let { data } = $props<{
		data: {
			scheduledOutOfCareClientData: Promise<ScheduledOutOfCareClientLoadResult>;
		};
	}>();

	const scheduledOutOfCareClientDataPromise = $derived(data.scheduledOutOfCareClientData);
</script>

{#await scheduledOutOfCareClientDataPromise}
	<div class="space-y-4">
		<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then scheduledOutOfCareClientData}
	{#if scheduledOutOfCareClientData.loadError}
		<InlineErrorBanner
			message={scheduledOutOfCareClientData.loadError}
			onRetry={() => invalidateAll()}
		/>
	{/if}
	<ClientOverviewPage
		client={scheduledOutOfCareClientData.client}
		status="scheduled_out_of_care"
		breadcrumbSectionLabel="Scheduled Out of Care"
	/>
{/await}
