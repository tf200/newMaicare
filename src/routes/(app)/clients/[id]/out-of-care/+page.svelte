<script lang="ts">
	import ClientOverviewPage from '$lib/components/clients/ClientOverviewPage.svelte';
	import { clientOverviewMocks } from '$lib/mock/client-overview';

	const client = clientOverviewMocks.out_of_care;
</script>

<ClientOverviewPage {client} status="out_of_care" />
