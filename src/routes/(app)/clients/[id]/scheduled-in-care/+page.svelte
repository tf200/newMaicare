<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import { clientOverviewMocks } from '$lib/mock/client-overview';

	const client = clientOverviewMocks.scheduled_in_care;
</script>

<ClientOverviewPage {client} status="scheduled_in_care" />
