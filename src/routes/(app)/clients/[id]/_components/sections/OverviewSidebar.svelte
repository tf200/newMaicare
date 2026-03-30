<script lang="ts">
	import type { ClientOverviewData } from '$lib/mock/client-overview';
	import OverviewContactsSection from './OverviewContactsSection.svelte';
	import OverviewDocumentsSection from './OverviewDocumentsSection.svelte';
	import OverviewProfileSection from './OverviewProfileSection.svelte';

	interface Props {
		client: ClientOverviewData;
	}

	let { client }: Props = $props();
</script>

<div class="space-y-6">
	<OverviewProfileSection {client} />
	<OverviewContactsSection clientId={client.id} contacts={client.contacts} />
	<OverviewDocumentsSection documentsChecklist={client.documentsChecklist} />
</div>
