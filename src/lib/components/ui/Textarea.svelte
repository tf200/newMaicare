<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { selectSizeClasses, type SelectSize } from './_sizes';

	interface Props extends HTMLTextareaAttributes {
		label?: string;
		error?: string;
		value?: string;
		size?: SelectSize;
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
		...props
	}: Props = $props();

	let textareaId = $derived(id ?? generatedId);
	let errorId = $derived(`${textareaId}-error`);
	let describedBy = $derived(
		[ariaDescribedby, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
	);
	let sizeClass = $derived(selectSizeClasses[size]);
</script>

<div class="space-y-2">
	{#if label}
		<label for={textareaId} class="ml-1 text-sm font-semibold text-text-muted">
			{label}
		</label>
	{/if}
	<div class="relative">
		<textarea
			{...props}
			id={textareaId}
			bind:value
			aria-invalid={error ? true : ariaInvalid}
			aria-describedby={describedBy}
			class="min-h-[100px] w-full rounded-xl border border-border bg-surface text-text outline-hidden transition-all placeholder:text-text-subtle focus:ring-2 focus:ring-brand/20 {sizeClass} {className}"
		></textarea>
	</div>
	{#if error}
		<p id={errorId} class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
