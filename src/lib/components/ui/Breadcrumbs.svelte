<script lang="ts">
	import { ChevronRight, Home } from 'lucide-svelte';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	let { items }: { items: BreadcrumbItem[] } = $props();
</script>

<nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-sm font-medium">
	{#each items as item, i (i)}
		{#if i > 0}
			<ChevronRight class="h-3.5 w-3.5 shrink-0 text-text-subtle/50" />
		{/if}

		{#if i === items.length - 1}
			<!-- Current page (last crumb) -->
			<span class="truncate font-semibold text-text">{item.label}</span>
		{:else if item.href}
			<a
				href={item.href}
				class="flex items-center gap-1.5 truncate text-text-subtle transition-colors hover:text-brand"
			>
				{#if i === 0}
					<Home class="h-3.5 w-3.5 shrink-0" />
				{/if}
				{item.label}
			</a>
		{:else}
			<span class="flex items-center gap-1.5 truncate text-text-subtle">
				{#if i === 0}
					<Home class="h-3.5 w-3.5 shrink-0" />
				{/if}
				{item.label}
			</span>
		{/if}
	{/each}
</nav>
