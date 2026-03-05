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
		<label for={props.id} class="ml-1 text-xs font-semibold text-text-muted">
			{label}
		</label>
	{/if}
	<div class="relative">
		<input
			{...props}
			bind:value
			class="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-text outline-hidden transition-all placeholder:text-text-subtle focus:ring-2 focus:ring-brand/20 {className}"
		/>
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
