<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { selectSizeClasses, type SelectSize } from './_sizes';

	interface Props extends HTMLTextareaAttributes {
		label?: string;
		error?: string;
		value?: string;
		size?: SelectSize;
	}

	let {
		label,
		error,
		value = $bindable(),
		size = 'lg',
		class: className,
		...props
	}: Props = $props();

	let sizeClass = $derived(selectSizeClasses[size as SelectSize]);
</script>

<div class="space-y-2">
	{#if label}
		<label for={props.id} class="ml-1 text-sm font-semibold text-text-muted">
			{label}
		</label>
	{/if}
	<div class="relative">
		<textarea
			{...props}
			bind:value
			class="min-h-[100px] w-full rounded-xl border border-border bg-surface text-text outline-hidden transition-all placeholder:text-text-subtle focus:ring-2 focus:ring-brand/20 {sizeClass} {className}"
		></textarea>
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
