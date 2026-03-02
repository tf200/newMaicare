<script lang="ts">
	import { Check, ChevronsUpDown, X } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';

	type Option = { label: string; value: string };

	let {
		label,
		options = [],
		value = $bindable([]),
		placeholder = 'Select items...',
		error = undefined,
		disabled = false,
		id = `select-${Math.random().toString(36).substr(2, 9)}`
	} = $props<{
		label?: string;
		options?: Option[];
		value?: string[];
		placeholder?: string;
		error?: string;
		disabled?: boolean;
		id?: string;
	}>();

	let isOpen = $state(false);
	let search = $state('');
	let triggerEl = $state<HTMLElement>();
	let dropdownEl = $state<HTMLElement>();
let filteredOptions = $derived(
	options.filter((opt: Option) => opt.label.toLowerCase().includes(search.toLowerCase()))
);

let selectedLabels = $derived(options.filter((opt: Option) => value.includes(opt.value)));

function toggle() {
	if (disabled) return;
	isOpen = !isOpen;
}

function select(val: string) {
	if (value.includes(val)) {
		value = value.filter((v: string) => v !== val);
	} else {
		value = [...value, val];
	}
}

function remove(val: string, e: Event) {
	e.stopPropagation();
	value = value.filter((v: string) => v !== val);
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

<div class="space-y-2" use:handleOutsideClick>
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
			class="flex w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm text-text transition-all hover:bg-surface/80 {error
				? 'border-error'
				: ''}"
			aria-expanded={isOpen}
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

		{#if isOpen && triggerEl}
			<div
				bind:this={dropdownEl}
				use:portal
				use:floating={{ anchor: triggerEl, matchWidth: true }}
				class="z-[9999] mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg ring-1 ring-black/5"
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
