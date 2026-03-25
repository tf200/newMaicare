<script lang="ts">
	import type { OverviewLoadResult } from './overview.shared';
	import OverviewRouteView from './_components/shell/OverviewRouteView.svelte';

	let { data } = $props<{
		data: {
			overviewData: Promise<OverviewLoadResult>;
		};
	}>();
</script>

<OverviewRouteView overviewData={data.overviewData} />
