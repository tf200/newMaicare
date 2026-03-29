<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { selectSizeClasses, type SelectSize } from './_sizes';

	interface Props extends Omit<HTMLInputAttributes, 'size'> {
		label?: string;
		error?: string;
		value?: string | number;
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
		<input
			{...props}
			bind:value
			class="w-full rounded-xl border border-border bg-surface text-text outline-hidden transition-[border-color,box-shadow] duration-200 placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 {sizeClass} {className}"
		/>
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
