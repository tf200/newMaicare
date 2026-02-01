<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	interface Props extends HTMLTextareaAttributes {
		label?: string;
		error?: string;
		value?: string;
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
		<textarea
			{...props}
			bind:value
			class="min-h-[100px] w-full rounded-xl border border-zinc-200 bg-zinc-100/50 px-4 py-3.5 text-zinc-900 outline-hidden transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white {className}"
		></textarea>
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-rose-500">{error}</p>
	{/if}
</div>
