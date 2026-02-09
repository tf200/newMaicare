<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import { clientOverviewMocks } from '$lib/mock/client-overview';

	const client = clientOverviewMocks.on_waiting_list;
</script>

<ClientOverviewPage {client} status="on_waiting_list" />
