<script lang="ts">
	import { Check, ChevronsUpDown, X } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';
	import { m } from '$lib/paraglide/messages';
	import { selectSizeClasses, type SelectSize } from './_sizes';

	type Option = { label: string; value: string };

	interface Props {
		label?: string;
		options?: Option[];
		value?: string[];
		placeholder?: string;
		error?: string;
		disabled?: boolean;
		size?: SelectSize;
		id?: string;
		removeLabel?: (label: string) => string;
	}

	const generatedId = $props.id();
	let {
		label,
		options = [],
		value = $bindable([]),
		placeholder = undefined,
		error = undefined,
		disabled = false,
		size = 'md',
		id = generatedId,
		removeLabel = (itemLabel: string) => `${m.clear_selection()}: ${itemLabel}`
	}: Props = $props();

	let isOpen = $state(false);
	let triggerEl = $state<HTMLButtonElement>();
	let dropdownEl = $state<HTMLDivElement>();
	let listboxId = $derived(`${id}-listbox`);
	let errorId = $derived(`${id}-error`);
	let resolvedPlaceholder = $derived(placeholder ?? m.select_items_placeholder());
	let sizeClass = $derived(selectSizeClasses[size]);
	let selectedLabels = $derived(options.filter((option) => value.includes(option.value)));

	function toggle() {
		if (!disabled) isOpen = !isOpen;
	}

	function select(optionValue: string) {
		value = value.includes(optionValue)
			? value.filter((selectedValue) => selectedValue !== optionValue)
			: [...value, optionValue];
	}

	function remove(optionValue: string) {
		value = value.filter((selectedValue) => selectedValue !== optionValue);
	}

	function manageRoot(node: HTMLDivElement) {
		const handleClick = (event: PointerEvent) => {
			const target = event.target as Node;
			if (!node.contains(target) && !dropdownEl?.contains(target)) isOpen = false;
		};
		document.addEventListener('pointerdown', handleClick, true);
		return () => {
			document.removeEventListener('pointerdown', handleClick, true);
		};
	}

	function captureTrigger(node: HTMLButtonElement) {
		triggerEl = node;
		return () => {
			if (triggerEl === node) triggerEl = undefined;
		};
	}

	function captureDropdown(node: HTMLDivElement) {
		dropdownEl = node;
		return () => {
			if (dropdownEl === node) dropdownEl = undefined;
		};
	}
</script>

<div class="space-y-2" {@attach manageRoot}>
	{#if label}<label for={id} class="ml-1 text-sm font-semibold text-text-muted">{label}</label>{/if}

	<div class="relative">
		<div
			class="flex w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-surface text-text transition-[border-color,box-shadow,background-color] duration-150 focus-within:ring-2 focus-within:ring-brand/20 {sizeClass} {error
				? 'border-error'
				: ''} {disabled ? 'opacity-60' : ''}"
		>
			{#if value.length === 0}
				<span class="min-w-0 flex-1 truncate text-text-subtle">{resolvedPlaceholder}</span>
			{:else}
				<div class="flex min-w-0 flex-1 flex-wrap gap-2" aria-label={label}>
					{#each selectedLabels as item (item.value)}
						<span
							class="inline-flex min-w-0 items-center gap-1 rounded-lg bg-surface px-2 py-1 text-xs font-medium text-text shadow-sm ring-1 ring-border"
							transition:scale={{ duration: 150 }}
						>
							<span class="truncate">{item.label}</span>
							<button
								type="button"
								onclick={() => remove(item.value)}
								{disabled}
								aria-label={removeLabel(item.label)}
								class="shrink-0 rounded-full p-0.5 hover:bg-border/50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
							>
								<X class="h-3 w-3" />
							</button>
						</span>
					{/each}
				</div>
			{/if}
			<button
				{id}
				{@attach captureTrigger}
				type="button"
				onclick={toggle}
				{disabled}
				role="combobox"
				aria-haspopup="listbox"
				aria-controls={listboxId}
				aria-expanded={isOpen}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				class="ml-auto shrink-0 rounded-lg p-1 text-text-subtle outline-hidden hover:bg-border/50 focus-visible:ring-2 focus-visible:ring-brand/20"
			>
				<span class="sr-only">{resolvedPlaceholder}</span>
				<ChevronsUpDown class="h-4 w-4" />
			</button>
		</div>

		{#if isOpen && triggerEl}
			<div
				{@attach captureDropdown}
				use:portal
				use:floating={{ anchor: triggerEl, matchWidth: true }}
				id={listboxId}
				role="listbox"
				aria-multiselectable="true"
				class="z-[9999] mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-border bg-surface p-1 shadow-xl"
				transition:scale={{ start: 0.95, duration: 100 }}
			>
				{#each options as option (option.value)}
					<button
						type="button"
						role="option"
						aria-selected={value.includes(option.value)}
						onclick={() => select(option.value)}
						class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-border/50 {value.includes(
							option.value
						)
							? 'bg-brand/10 font-semibold text-brand'
							: 'text-text'}"
					>
						<span class="min-w-0 truncate">{option.label}</span>
						{#if value.includes(option.value)}<Check class="h-4 w-4 shrink-0 text-brand" />{/if}
					</button>
				{/each}
				{#if options.length === 0}<div class="p-3 text-center text-sm text-text-muted">
						{m.no_options_found()}
					</div>{/if}
			</div>
		{/if}
	</div>
	{#if error}<p id={errorId} class="ml-1 text-xs font-medium text-error">{error}</p>{/if}
</div>
