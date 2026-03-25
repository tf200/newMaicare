<script lang="ts">
	import type { ClientQuickLink } from '$lib/mock/client-overview';

	interface Props {
		quickLinks: ClientQuickLink[];
	}

	let { quickLinks }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
	{#each quickLinks as link, index (`${link.href}-${index}`)}
		<a
			href={link.href}
			class="group flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-4 text-center transition hover:border-brand/30 hover:shadow-md"
		>
			<span class="text-2xl font-bold text-text group-hover:text-brand">{link.count}</span>
			<span class="mt-1 text-xs font-medium text-text-subtle group-hover:text-text">{link.label}</span>
		</a>
	{/each}
</div>
