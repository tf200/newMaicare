<script lang="ts" generics="Option">
	import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';
	import { m } from '$lib/paraglide/messages';
	import { selectSizeClasses, type SelectSize } from './_sizes';

	interface Props {
		label?: string;
		value?: string[];
		placeholder?: string;
		searchPlaceholder?: string;
		error?: string;
		size?: SelectSize;
		id?: string;
		loadOptions: (query: string) => Promise<Option[]>;
		labelFn?: (opt: Option) => string;
		valueFn?: (opt: Option) => string;
		loadErrorText?: string;
	}

	const generatedId = $props.id();
	let {
		label,
		value = $bindable<string[]>([]),
		placeholder = undefined,
		searchPlaceholder = undefined,
		error = undefined,
		size = 'md',
		id = generatedId,
		loadOptions,
		labelFn = (opt: Option) => String((opt as { label?: unknown } | null)?.label ?? ''),
		valueFn = (opt: Option) => String((opt as { value?: unknown } | null)?.value ?? ''),
		loadErrorText = m.options_load_error()
	}: Props = $props();

	let isOpen = $state(false);
	let isLoading = $state(false);
	let options = $state<Option[]>([]);
	let searchQuery = $state('');
	let loadError = $state(false);
	let requestSequence = 0;
	let searchInput = $state<HTMLInputElement>();
	let triggerEl = $state<HTMLButtonElement>();
	let anchorEl = $state<HTMLDivElement>();
	let dropdownEl = $state<HTMLElement>();
	let resolvedPlaceholder = $derived(placeholder ?? m.select_items_placeholder());
	let resolvedSearchPlaceholder = $derived(searchPlaceholder ?? m.search_placeholder_short());
	let sizeClass = $derived(selectSizeClasses[size]);
	let errorId = $derived(`${id}-error`);
	let listboxId = $derived(`${id}-listbox`);

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
		const sequence = ++requestSequence;
		isLoading = true;
		loadError = false;
		try {
			const result = (await loadOptions(query)) || [];
			if (sequence === requestSequence) options = result;
		} catch (e) {
			console.error(e);
			if (sequence === requestSequence) {
				options = [];
				loadError = true;
			}
		} finally {
			if (sequence === requestSequence) isLoading = false;
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

	function remove(val: string) {
		value = value.filter((v: string) => v !== val);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !isOpen) return;
		event.preventDefault();
		isOpen = false;
		triggerEl?.focus();
	}

	function handleOutsideClick(node: HTMLElement) {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (!node.contains(target) && (!dropdownEl || !dropdownEl.contains(target))) {
				isOpen = false;
			}
		};
		document.addEventListener('click', handleClick);
		document.addEventListener('keydown', handleKeydown);
		return {
			destroy() {
				document.removeEventListener('click', handleClick);
				document.removeEventListener('keydown', handleKeydown);
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
		<div
			bind:this={anchorEl}
			class="flex w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-surface {sizeClass} text-text transition-[border-color,box-shadow,background-color] duration-150 focus-within:ring-2 focus-within:ring-brand/20 {error
				? 'border-error'
				: ''}"
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
						<button
							type="button"
							onclick={() => remove(valueFn(item))}
							aria-label={`${m.remove()} ${labelFn(item)}`}
							class="cursor-pointer rounded-full p-0.5 hover:bg-border/50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
						>
							<X class="h-3 w-3" />
						</button>
					</span>
				{/each}
			{/if}

			<button
				{id}
				bind:this={triggerEl}
				type="button"
				onclick={toggle}
				class="ml-auto shrink-0 rounded-lg p-1 text-text-subtle focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
				role="combobox"
				aria-haspopup="listbox"
				aria-controls={listboxId}
				aria-expanded={isOpen}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				aria-label={label ?? resolvedPlaceholder}
			>
				<ChevronsUpDown class="h-4 w-4" />
			</button>
		</div>

		{#if isOpen && anchorEl}
			<div
				bind:this={dropdownEl}
				use:portal
				use:floating={{ anchor: anchorEl, matchWidth: true }}
				class="z-[9999] mt-2 max-h-60 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
				transition:scale={{ start: 0.95, duration: 100 }}
				id={listboxId}
				role="listbox"
				aria-multiselectable="true"
			>
				<div class="border-b border-border p-2">
					<div class="relative">
						<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-text-subtle" />
						<input
							bind:this={searchInput}
							type="text"
							value={searchQuery}
							oninput={handleSearch}
							placeholder={resolvedSearchPlaceholder}
							class="w-full rounded-lg bg-bg py-2 pr-4 pl-9 text-sm text-text outline-hidden placeholder:text-text-subtle focus:ring-2 focus:ring-brand/20"
						/>
					</div>
				</div>

				<div class="max-h-48 overflow-y-auto p-1">
					{#if isLoading}
						<div class="flex items-center justify-center p-4 text-text-subtle">
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{m.loading()}...
						</div>
					{:else if loadError}
						<div class="p-3 text-center text-sm text-error" role="alert">{loadErrorText}</div>
					{:else if options.length === 0}
						<div class="p-3 text-center text-sm text-text-muted">
							{m.no_results_found()}
						</div>
					{:else}
						{#each options as option (valueFn(option))}
							<button
								type="button"
								role="option"
								aria-selected={value.includes(valueFn(option))}
								onclick={() => select(option)}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-border/50 {value.includes(
									valueFn(option)
								)
									? 'bg-brand/10 font-semibold text-brand'
									: 'text-text'}"
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
		<p id={errorId} class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
