<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import { clientOverviewMocks } from '$lib/mock/client-overview';

	const client = clientOverviewMocks.scheduled_out_of_care;
</script>

<ClientOverviewPage {client} status="scheduled_out_of_care" />
