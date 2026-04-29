<script lang="ts">
	import type { ClientOverviewData } from '$lib/mock/client-overview';
	import OverviewContactsSection from './OverviewContactsSection.svelte';
	import OverviewDocumentsSection from './OverviewDocumentsSection.svelte';
	import OverviewEducationSection from './OverviewEducationSection.svelte';
	import OverviewProfileSection from './OverviewProfileSection.svelte';
	import OverviewWorkSection from './OverviewWorkSection.svelte';

	interface Props {
		client: ClientOverviewData;
	}

	let { client }: Props = $props();
</script>

<div class="space-y-6">
	<OverviewProfileSection {client} />
	{#if client.education}
		<OverviewEducationSection education={client.education} />
	{/if}
	{#if client.work}
		<OverviewWorkSection work={client.work} />
	{/if}
	<OverviewContactsSection clientId={client.id} contacts={client.contacts} />
	<OverviewDocumentsSection clientId={client.id} documentsChecklist={client.documentsChecklist} />
</div>
