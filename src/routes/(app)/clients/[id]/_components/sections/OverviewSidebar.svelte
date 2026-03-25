<script lang="ts">
	import type { ClientOverviewData } from '$lib/mock/client-overview';
	import OverviewContactsSection from './OverviewContactsSection.svelte';
	import OverviewContractSection from './OverviewContractSection.svelte';
	import OverviewDocumentsSection from './OverviewDocumentsSection.svelte';
	import OverviewIntakeSection from './OverviewIntakeSection.svelte';
	import OverviewProfileSection from './OverviewProfileSection.svelte';

	interface Props {
		client: ClientOverviewData;
	}

	let { client }: Props = $props();
</script>

<div class="space-y-6">
	<OverviewProfileSection {client} />
	<OverviewContactsSection contacts={client.contacts} />
	<OverviewDocumentsSection documentsChecklist={client.documentsChecklist} />
	<OverviewContractSection contractSummary={client.contractSummary} />
	<OverviewIntakeSection intakeSummary={client.intakeSummary} />
</div>
