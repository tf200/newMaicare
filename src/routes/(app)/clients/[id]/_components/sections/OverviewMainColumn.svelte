<script lang="ts">
	import OverviewAlertsSection from './OverviewAlertsSection.svelte';
	import OverviewGoalsSection from './OverviewGoalsSection.svelte';
	import OverviewNextSection from './OverviewNextSection.svelte';
	import OverviewTimelineSection from './OverviewTimelineSection.svelte';
	import type { ClientOverviewData, ClientOverviewStatus } from '$lib/mock/client-overview';

	interface Props {
		client: ClientOverviewData;
		status: ClientOverviewStatus;
	}

	let { client, status }: Props = $props();
</script>

<div class="space-y-6">
	<div class="grid gap-6 md:grid-cols-2">
		<OverviewNextSection {client} {status} />
		<OverviewAlertsSection alerts={client.alerts} />
	</div>

	<OverviewGoalsSection goals={client.goals} />
	<OverviewTimelineSection timeline={client.timeline} />
</div>
