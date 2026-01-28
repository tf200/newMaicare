<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'ghost' | 'destructive';
		isLoading?: boolean;
		children?: any;
	}

	let {
		variant = 'primary',
		isLoading = false,
		children,
		class: className,
		...props
	}: Props = $props();

	const variants = {
		primary: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 shadow-sm',
		ghost: 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800',
		destructive:
			'bg-rose-50 text-rose-600 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30'
	};
</script>

<button
	{...props}
	disabled={isLoading || props.disabled}
	class="relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-70 {variants[
		variant
	]} {className}"
>
	{#if isLoading}
		<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24">
			<circle
				class="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				stroke-width="4"
				fill="none"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{@render children?.()}
</button>
