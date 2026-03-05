<script lang="ts">
	import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';
	import { m } from '$lib/paraglide/messages';

	type Option = any;

	interface Props {
		label?: string;
		value?: string[];
		placeholder?: string;
		searchPlaceholder?: string;
		error?: string;
		id?: string;
		loadOptions: (query: string) => Promise<Option[]>;
		labelFn?: (opt: Option) => string;
		valueFn?: (opt: Option) => string;
	}

	let {
		label,
		value = $bindable<string[]>([]),
		placeholder = undefined,
		searchPlaceholder = undefined,
		error = undefined,
		id = `multi-search-${Math.random().toString(36).substr(2, 9)}`,
		loadOptions,
		labelFn = (opt: Option) => String(opt?.label ?? ''),
		valueFn = (opt: Option) => String(opt?.value ?? '')
	}: Props = $props();

	let isOpen = $state(false);
	let isLoading = $state(false);
	let options = $state<Option[]>([]);
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement>();
	let triggerEl = $state<HTMLElement>();
	let dropdownEl = $state<HTMLElement>();
	let resolvedPlaceholder = $derived(placeholder ?? m.select_items_placeholder());
	let resolvedSearchPlaceholder = $derived(searchPlaceholder ?? m.search_placeholder_short());

	let selectedOptions = $derived(options.filter((opt) => value.includes(valueFn(opt))));

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
		isOpen = !isOpen;
		if (isOpen) {
			setTimeout(() => searchInput?.focus(), 50);
			fetchOptions('');
		}
	}

	function select(opt: Option) {
		const val = valueFn(opt);
		if (value.includes(val)) {
			value = value.filter((v) => v !== val);
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
				<span class="text-text-subtle">{resolvedPlaceholder}</span>
			{:else}
				{#each selectedOptions as item (valueFn(item))}
					<span
						class="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-xs font-medium text-text shadow-sm ring-1 ring-border"
						transition:scale={{ duration: 150 }}
					>
						{labelFn(item)}
						<div
							role="button"
							tabindex="0"
							onclick={(e) => remove(valueFn(item), e)}
							onkeydown={(e) => e.key === 'Enter' && remove(valueFn(item), e)}
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
				class="z-[9999] mt-2 max-h-60 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg ring-1 ring-black/5"
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
							placeholder={resolvedSearchPlaceholder}
							class="bg-background w-full rounded-lg py-2 pr-4 pl-9 text-sm outline-none placeholder:text-text-muted focus:ring-2 focus:ring-brand/20"
						/>
					</div>
				</div>

				<div class="max-h-48 overflow-y-auto p-1">
					{#if isLoading}
						<div class="flex items-center justify-center p-4 text-text-muted">
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{m.loading()}...
						</div>
					{:else if options.length === 0}
						<div class="p-3 text-center text-sm text-text-muted">
							{m.no_results_found()}
						</div>
					{:else}
						{#each options as option (valueFn(option))}
							<button
								type="button"
								onclick={() => select(option)}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-text-muted hover:bg-border/50 {value.includes(
									valueFn(option)
								)
									? 'bg-border/30 font-medium text-text'
									: ''}"
							>
								<span class="truncate">{labelFn(option)}</span>
								{#if value.includes(valueFn(option))}
									<Check class="h-4 w-4 shrink-0 text-brand" />
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
