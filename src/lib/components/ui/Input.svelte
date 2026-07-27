<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { selectSizeClasses, type SelectSize } from './_sizes';

	interface Props extends Omit<HTMLInputAttributes, 'size'> {
		label?: string;
		error?: string;
		value?: string | number;
		size?: SelectSize;
		children?: Snippet;
	}

	const generatedId = $props.id();
	let {
		label,
		error,
		value = $bindable(),
		size = 'lg',
		id,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		class: className,
		children,
		...props
	}: Props = $props();

	let inputId = $derived(id ?? generatedId);
	let errorId = $derived(`${inputId}-error`);
	let describedBy = $derived(
		[ariaDescribedby, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
	);
	let sizeClass = $derived(selectSizeClasses[size]);
</script>

<div class="space-y-2">
	{#if label}
		<label for={inputId} class="ml-1 text-sm font-semibold text-text-muted">
			{label}
		</label>
	{/if}
	<div class="relative">
		<input
			{...props}
			id={inputId}
			bind:value
			aria-invalid={error ? true : ariaInvalid}
			aria-describedby={describedBy}
			class="w-full rounded-xl border border-border bg-surface text-text outline-hidden transition-[border-color,box-shadow] duration-200 placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 {sizeClass} {className}"
		/>
		{#if children}
			{@render children()}
		{/if}
	</div>
	{#if error}
		<p id={errorId} class="ml-1 text-xs font-medium text-error">
			{error}
		</p>
	{/if}
</div>
