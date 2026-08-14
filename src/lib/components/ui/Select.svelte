<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';
	import { m } from '$lib/paraglide/messages';
	import { selectSizeClasses, type SelectSize } from './_sizes';

	type Option = { label: string; value: string };
	const generatedId = $props.id();

	let {
		label,
		options = [],
		value = $bindable(),
		onchange,
		placeholder = undefined,
		error = undefined,
		id = generatedId,
		className = '',
		size = 'lg',
		prefix
	} = $props<{
		label?: string;
		options?: Option[];
		value?: string;
		onchange?: (value: string) => void;
		placeholder?: string;
		error?: string;
		id?: string;
		className?: string;
		size?: SelectSize;
		prefix?: Snippet;
	}>();

	let isOpen = $state(false);
	let triggerEl = $state<HTMLElement>();
	let dropdownEl = $state<HTMLElement>();

	let resolvedPlaceholder = $derived(placeholder ?? m.select_placeholder());
	let listboxId = $derived(`${id}-listbox`);
	let errorId = $derived(`${id}-error`);
	let currentValue = $derived(value ?? '');
	let selectedLabel = $derived(
		options.find((opt: Option) => opt.value === currentValue)?.label || resolvedPlaceholder
	);

	let sizeClass = $derived(selectSizeClasses[size as SelectSize]);

	function toggle() {
		isOpen = !isOpen;
	}

	function select(val: string) {
		value = val;
		onchange?.(val);
		isOpen = false;
	}

	function manageRoot(node: HTMLElement) {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (!node.contains(target) && (!dropdownEl || !dropdownEl.contains(target))) {
				isOpen = false;
			}
		};
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	}

	function captureTrigger(node: HTMLElement) {
		triggerEl = node;
		return () => {
			if (triggerEl === node) triggerEl = undefined;
		};
	}

	function captureDropdown(node: HTMLElement) {
		dropdownEl = node;
		return () => {
			if (dropdownEl === node) dropdownEl = undefined;
		};
	}
</script>

<div class="space-y-2 {className}" {@attach manageRoot}>
	{#if label}
		<label for={id} class="ml-1 text-sm font-semibold text-text-muted">
			{label}
		</label>
	{/if}

	<div class="relative">
		<button
			{id}
			{@attach captureTrigger}
			type="button"
			role="combobox"
			onclick={toggle}
			class="flex w-full items-center justify-between rounded-xl border border-border bg-surface text-text outline-hidden transition-[border-color,box-shadow,background-color] duration-150 hover:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/20 {sizeClass} {error
				? 'border-error'
				: ''}"
			aria-haspopup="listbox"
			aria-controls={listboxId}
			aria-expanded={isOpen}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? errorId : undefined}
		>
			{#if prefix}
				{@render prefix()}
			{/if}
			<span class="truncate">{selectedLabel}</span>
			<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
		</button>

		{#if isOpen && triggerEl}
			<div
				{@attach captureDropdown}
				id={listboxId}
				role="listbox"
				use:portal
				use:floating={{ anchor: triggerEl, matchWidth: true }}
				class="z-[9999] mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-border bg-surface p-1 shadow-xl"
				transition:scale={{ start: 0.95, duration: 100 }}
			>
				{#each options as option (option.value)}
					<button
						type="button"
						role="option"
						aria-selected={currentValue === option.value}
						onclick={() => select(option.value)}
						class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm outline-hidden hover:bg-border/50 focus-visible:ring-2 focus-visible:ring-brand/30 {currentValue ===
						option.value
							? 'bg-brand/10 font-semibold text-brand'
							: 'text-text'}"
					>
						{option.label}
						{#if currentValue === option.value}
							<Check class="h-4 w-4 text-brand" aria-hidden="true" />
						{/if}
					</button>
				{/each}
				{#if options.length === 0}
					<div class="p-3 text-center text-sm text-text-muted">
						{m.no_options_available()}
					</div>
				{/if}
			</div>
		{/if}
	</div>
	{#if error}
		<p id={errorId} class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
