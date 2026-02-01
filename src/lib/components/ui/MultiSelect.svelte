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
		<label for={id} class="ml-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
			{label}
		</label>
	{/if}

	<div class="relative">
		<button
			{id}
			type="button"
			onclick={toggle}
			class="flex min-h-[50px] w-full flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100/50 px-4 py-2.5 text-left text-sm transition-all hover:bg-zinc-100 focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
		>
			{#if value.length === 0}
				<span class="text-zinc-400">{placeholder}</span>
			{:else}
				{#each selectedLabels as item (item.value)}
					<span
						class="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-zinc-600"
						transition:scale={{ duration: 150 }}
					>
						{item.label}
						<div
							role="button"
							tabindex="0"
							onclick={(e) => remove(item.value, e)}
							onkeydown={(e) => e.key === 'Enter' && remove(item.value, e)}
							class="cursor-pointer rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-600"
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
				class="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900"
				transition:scale={{ start: 0.95, duration: 100 }}
			>
				{#each filteredOptions as option (option.value)}
					<button
						type="button"
						onclick={() => select(option.value)}
						class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 {value.includes(
							option.value
						)
							? 'bg-zinc-50 font-medium text-zinc-900 dark:bg-zinc-800/50 dark:text-white'
							: ''}"
					>
						{option.label}
						{#if value.includes(option.value)}
							<Check class="h-4 w-4 text-teal-600 dark:text-teal-400" />
						{/if}
					</button>
				{/each}
				{#if filteredOptions.length === 0}
					<div class="p-3 text-center text-sm text-zinc-500">No options found.</div>
				{/if}
			</div>
		{/if}
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-rose-500">{error}</p>
	{/if}
</div>
