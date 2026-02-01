<script lang="ts">
	import { Check, ChevronsUpDown, X } from 'lucide-svelte';
	import { scale } from 'svelte/transition';

	type Option = { label: string; value: string };

	let {
		label,
		options = [],
		value = $bindable([]),
		placeholder = 'Select items...',
		error = undefined,
		id = `select-${Math.random().toString(36).substr(2, 9)}`
	} = $props();

	let isOpen = $state(false);
	let search = $state('');

	// Derived
	let filteredOptions = $derived(
		options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
	);

	let selectedLabels = $derived(options.filter((opt) => value.includes(opt.value)));

	function toggle() {
		isOpen = !isOpen;
	}

	function select(val: string) {
		if (value.includes(val)) {
			value = value.filter((v) => v !== val);
		} else {
			value = [...value, val];
		}
	}

	function remove(val: string, e: Event) {
		e.stopPropagation();
		value = value.filter((v) => v !== val);
	}

	function handleOutsideClick(node: HTMLElement) {
		const handleClick = (e: MouseEvent) => {
			if (!node.contains(e.target as Node)) {
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

<div class="space-y-2" use:handleOutsideClick>
	{#if label}
		<label for={id} class="ml-1 text-sm font-semibold text-text-muted">
			{label}
		</label>
	{/if}

	<div class="relative">
		<button
			{id}
			type="button"
			onclick={toggle}
			class="flex min-h-[50px] w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-left text-sm transition-all hover:bg-border/30 focus:ring-2 focus:ring-brand/20 focus:outline-none"
		>
			{#if value.length === 0}
				<span class="text-text-subtle">{placeholder}</span>
			{:else}
				{#each selectedLabels as item (item.value)}
					<span
						class="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-xs font-medium text-text shadow-sm ring-1 ring-border"
						transition:scale={{ duration: 150 }}
					>
						{item.label}
						<div
							role="button"
							tabindex="0"
							onclick={(e) => remove(item.value, e)}
							onkeydown={(e) => e.key === 'Enter' && remove(item.value, e)}
							class="cursor-pointer rounded-full p-0.5 hover:bg-border/50"
						>
							<X class="h-3 w-3" />
						</div>
					</span>
				{/each}
			{/if}

			<div class="ml-auto shrink-0 opacity-50">
				<ChevronsUpDown class="h-4 w-4" />
			</div>
		</button>

		{#if isOpen}
			<div
				class="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg ring-1 ring-black/5"
				transition:scale={{ start: 0.95, duration: 100 }}
			>
				{#each filteredOptions as option (option.value)}
					<button
						type="button"
						onclick={() => select(option.value)}
						class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-border/50 {value.includes(
							option.value
						)
							? 'bg-border/30 font-medium text-text'
							: ''}"
					>
						{option.label}
						{#if value.includes(option.value)}
							<Check class="h-4 w-4 text-brand" />
						{/if}
					</button>
				{/each}
				{#if filteredOptions.length === 0}
					<div class="p-3 text-center text-sm text-text-muted">No options found.</div>
				{/if}
			</div>
		{/if}
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
