<script lang="ts">
	import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	// Generic option type
	type Option = any;

	interface Props {
		label?: string;
		placeholder?: string;
		searchPlaceholder?: string;
		value?: string; // ID
		displayValue?: string; // Text to show when selected (initial)
		error?: string;
		id?: string;
		class?: string;
		disabled?: boolean;
		loadOptions: (query: string) => Promise<Option[]>;
		labelFn?: (option: Option) => string;
		valueFn?: (option: Option) => string;
		item?: Snippet<[Option]>;
	}

	let {
		label,
		placeholder = 'Select...',
		searchPlaceholder = 'Search...',
		value = $bindable(''),
		displayValue = $bindable(''),
		error = undefined,
		id = `search-select-${Math.random().toString(36).substr(2, 9)}`,
		class: className = '',
		disabled = false,
		loadOptions,
		labelFn = (opt: any) => opt.name || opt.label,
		valueFn = (opt: any) => opt.id || opt.value,
		item
	}: Props = $props();

	let isOpen = $state(false);
	let isLoading = $state(false);
	let options = $state<Option[]>([]);
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement>();

	let selectedLabel = $derived.by(() => {
		const found = options.find((opt) => valueFn(opt) === value);
		return found ? labelFn(found) : displayValue || placeholder;
	});

	// Debounce search
	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleSearch(e: Event) {
		const query = (e.target as HTMLInputElement).value;
		searchQuery = query;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			fetchOptions(query);
		}, 300);
	}

	async function fetchOptions(query: string) {
		isLoading = true;
		try {
			options = (await loadOptions(query)) || [];
		} catch (e) {
			console.error(e);
			options = [];
		} finally {
			isLoading = false;
		}
	}

	function toggle() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			// Focus search input after transition
			setTimeout(() => searchInput?.focus(), 50);
			// Always fetch fresh options on open
			fetchOptions('');
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggle();
		} else if (e.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}

	function select(opt: Option) {
		value = valueFn(opt);
		displayValue = labelFn(opt);
		isOpen = false;
		searchQuery = '';
	}

	function clear(e: Event) {
		e.stopPropagation();
		value = '';
		displayValue = '';
		searchQuery = '';
		// Optionally refresh options
		fetchOptions('');
	}

	function handleOutsideClick(node: HTMLElement) {
		const handleClick = (e: Event) => {
			if (!node.contains(e.target as Node)) {
				isOpen = false;
			}
		};

		document.addEventListener('mousedown', handleClick, true);
		document.addEventListener('touchstart', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('mousedown', handleClick, true);
				document.removeEventListener('touchstart', handleClick, true);
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
		<div
			{id}
			role="button"
			tabindex={disabled ? -1 : 0}
			onclick={toggle}
			onkeydown={handleKeydown}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			class="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 text-left text-sm transition-all hover:bg-surface/80 focus:ring-2 focus:ring-brand/20 focus:outline-none {disabled
				? 'cursor-not-allowed opacity-50'
				: ''}"
			class:text-text-subtle={!value}
			class:text-text={!!value}
		>
			<span class="truncate">{selectedLabel}</span>
			<div class="flex items-center gap-2">
				{#if value && !disabled}
					<button
						type="button"
						onclick={clear}
						class="text-text-muted hover:text-text"
						aria-label="Clear selection"
					>
						<X class="h-4 w-4" />
					</button>
				{/if}
				<ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
			</div>
		</div>

		{#if isOpen}
			<div
				class="absolute z-50 mt-2 max-h-60 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg ring-1 ring-black/5"
				transition:scale={{ start: 0.95, duration: 100 }}
			>
				<div class="border-b border-border p-2">
					<div class="relative">
						<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-text-muted" />
						<input
							bind:this={searchInput}
							type="text"
							value={searchQuery}
							oninput={handleSearch}
							placeholder={searchPlaceholder}
							class="bg-background w-full rounded-lg py-2 pr-4 pl-9 text-sm outline-none placeholder:text-text-muted focus:ring-2 focus:ring-brand/20"
						/>
					</div>
				</div>

				<div class="max-h-48 overflow-y-auto p-1">
					{#if isLoading}
						<div class="flex items-center justify-center p-4 text-text-muted">
							<Loader2 class="mr-2 h-4 w-4 animate-spin" /> Loading...
						</div>
					{:else if options.length === 0}
						<div class="p-3 text-center text-sm text-text-muted">No results found</div>
					{:else}
						{#each options as option (valueFn(option))}
							<button
								type="button"
								onclick={() => select(option)}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-text-muted hover:bg-border/50 {value ===
								valueFn(option)
									? 'bg-border/30 font-medium text-text'
									: ''}"
							>
								<div class="flex-1 overflow-hidden">
									{#if item}
										{@render item(option)}
									{:else}
										<span class="truncate">{labelFn(option)}</span>
									{/if}
								</div>
								{#if value === valueFn(option)}
									<Check class="ml-2 h-4 w-4 shrink-0 text-brand" />
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
