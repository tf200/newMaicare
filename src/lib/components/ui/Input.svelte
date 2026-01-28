<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
		value?: string | number;
	}

	let { label, error, value = $bindable(), class: className, ...props }: Props = $props();
</script>

<div class="space-y-2">
	{#if label}
		<label for={props.id} class="ml-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
			{label}
		</label>
	{/if}
	<div class="relative">
		<input
			{...props}
			bind:value
			class="w-full rounded-xl border border-zinc-200 bg-zinc-100/50 px-4 py-3.5 outline-hidden transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 {className}"
		/>
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-rose-500">{error}</p>
	{/if}
</div>
