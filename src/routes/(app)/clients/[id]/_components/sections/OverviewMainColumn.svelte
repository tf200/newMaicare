<script lang="ts">
	import OverviewAlertsSection from './OverviewAlertsSection.svelte';
	import OverviewContractSection from './OverviewContractSection.svelte';
	import OverviewGoalsSection from './OverviewGoalsSection.svelte';
	import OverviewIntakeSection from './OverviewIntakeSection.svelte';
	import OverviewNextSection from './OverviewNextSection.svelte';
	import OverviewTimelineSection from './OverviewTimelineSection.svelte';
	import type { GetClientCoordinator } from '$lib/types/api';
	import type { ClientOverviewData, ClientOverviewStatus } from '../../overview.shared';

	interface Props {
		client: ClientOverviewData;
		status: ClientOverviewStatus;
		coordinator: GetClientCoordinator | null;
	}

	let { client, status, coordinator }: Props = $props();
</script>

<div class="space-y-6">
	<div class="grid gap-6 md:grid-cols-2">
		<OverviewNextSection {client} {status} {coordinator} />
		<OverviewAlertsSection alerts={client.alerts} />
	</div>

	<OverviewGoalsSection clientId={client.id} goals={client.goals} />

	<div class="grid gap-6 xl:grid-cols-2">
		<OverviewContractSection contractSummary={client.contractSummary} />
		<OverviewIntakeSection intakeSummary={client.intakeSummary} />
	</div>

	<OverviewTimelineSection clientId={client.id} timeline={client.timeline} />
</div>
