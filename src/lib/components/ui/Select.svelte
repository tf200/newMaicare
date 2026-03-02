<script lang="ts">
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';

	type Option = { label: string; value: string };

	let {
		label,
		options = [],
		value = $bindable(''),
		placeholder = 'Select...',
		error = undefined,
		id = `select-${Math.random().toString(36).substr(2, 9)}`,
		className = ''
	} = $props<{
		label?: string;
		options?: Option[];
		value?: string;
		placeholder?: string;
		error?: string;
		id?: string;
		className?: string;
	}>();

	let isOpen = $state(false);
	let triggerEl = $state<HTMLElement>();
	let dropdownEl = $state<HTMLElement>();

	let selectedLabel = $derived(options.find((opt: Option) => opt.value === value)?.label || placeholder);

	function toggle() {
		isOpen = !isOpen;
	}

	function select(val: string) {
		value = val;
		isOpen = false;
	}

	function handleOutsideClick(node: HTMLElement) {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (!node.contains(target) && (!dropdownEl || !dropdownEl.contains(target))) {
				isOpen = false;
			}
		};
		document.addEventListener('click', handleClick);
		return {
			destroy() {
				document.removeEventListener('click', handleClick);
			}
		};
	}
</script>

<div class="space-y-2 {className}" use:handleOutsideClick>
	{#if label}
		<label for={id} class="ml-1 text-sm font-semibold text-text-muted">
			{label}
		</label>
	{/if}

	<div class="relative">
		<button
			{id}
			bind:this={triggerEl}
			type="button"
			onclick={toggle}
			class="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 text-sm text-text transition-all hover:bg-surface/80 {error
				? 'border-error'
				: ''}"
			aria-expanded={isOpen}
		>
			<span class="truncate">{selectedLabel}</span>
			<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</button>

		{#if isOpen && triggerEl}
			<div
				bind:this={dropdownEl}
				use:portal
				use:floating={{ anchor: triggerEl, matchWidth: true }}
				class="z-[9999] mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg ring-1 ring-black/5"
				transition:scale={{ start: 0.95, duration: 100 }}
			>
				{#each options as option (option.value)}
					<button
						type="button"
						onclick={() => select(option.value)}
						class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-border/50 {value ===
						option.value
							? 'bg-border/30 font-medium text-text'
							: ''}"
					>
						{option.label}
						{#if value === option.value}
							<Check class="h-4 w-4 text-brand" />
						{/if}
					</button>
				{/each}
				{#if options.length === 0}
					<div class="p-3 text-center text-sm text-text-muted">No options available</div>
				{/if}
			</div>
		{/if}
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
