<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import { clientOverviewMocks } from '$lib/mock/client-overview';

	const client = clientOverviewMocks.in_care;
</script>

<ClientOverviewPage {client} status="in_care" />
