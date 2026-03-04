<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		icon?: any;
		onclick?: () => void;
		variant?: 'default' | 'destructive';
		href?: string;
		children?: Snippet;
		class?: string;
	}

	let {
		label,
		icon: Icon,
		onclick,
		variant = 'default',
		href,
		children,
		class: className = ''
	}: Props = $props();

	const baseStyles =
		'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20';
	const variants = {
		default: 'text-text-muted hover:bg-border/50 hover:text-text',
		destructive: 'text-error hover:bg-error/10'
	};
</script>

{#if href}
	<a {href} class="{baseStyles} {variants[variant]} {className}" {onclick}>
		{#if Icon}
			<Icon class="h-4 w-4 shrink-0" />
		{/if}
		<span class="flex-1 text-left">{label}</span>
		{@render children?.()}
	</a>
{:else}
	<button type="button" class="{baseStyles} {variants[variant]} {className}" {onclick}>
		{#if Icon}
			<Icon class="h-4 w-4 shrink-0" />
		{/if}
		<span class="flex-1 text-left">{label}</span>
		{@render children?.()}
	</button>
{/if}
