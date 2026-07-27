<script lang="ts" generics="Option">
	import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';
	import { m } from '$lib/paraglide/messages';
	import { selectSizeClasses, type SelectSize } from './_sizes';

	interface Props {
		label?: string;
		value?: string;
		displayValue?: string;
		placeholder?: string;
		searchPlaceholder?: string;
		disabled?: boolean;
		error?: string;
		id?: string;
		className?: string;
		size?: SelectSize;
		/** @deprecated Use size="sm" instead. */
		compact?: boolean;
		item?: Snippet<[Option]>;
		loadOptions: (query: string) => Promise<Option[]>;
		onchange?: (value: string) => void;
		labelFn?: (option: Option) => string;
		valueFn?: (option: Option) => string;
		loadErrorText?: string;
		retryLabel?: string;
	}

	const generatedId = $props.id();
	let {
		label,
		value = $bindable(),
		displayValue = $bindable(),
		placeholder = undefined,
		searchPlaceholder = undefined,
		disabled = false,
		error = undefined,
		id = generatedId,
		className = '',
		size = 'lg',
		compact = false,
		item,
		loadOptions,
		onchange,
		labelFn = (option: Option) => String((option as { label?: unknown } | null)?.label ?? ''),
		valueFn = (option: Option) => String((option as { value?: unknown } | null)?.value ?? ''),
		loadErrorText = 'Unable to load options.',
		retryLabel = m.retry()
	}: Props = $props();

	let isOpen = $state(false);
	let isLoading = $state(false);
	let options = $state<Option[]>([]);
	let searchQuery = $state('');
	let loadError = $state<string | null>(null);
	let searchInput = $state<HTMLInputElement>();
	let triggerEl = $state<HTMLButtonElement>();
	let dropdownEl = $state<HTMLDivElement>();
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let requestSequence = 0;

	let listboxId = $derived(`${id}-listbox`);
	let errorId = $derived(`${id}-error`);
	let resolvedPlaceholder = $derived(placeholder ?? m.select_placeholder());
	let resolvedSearchPlaceholder = $derived(searchPlaceholder ?? m.search_placeholder_short());
	let currentValue = $derived(value ?? '');
	let currentDisplayValue = $derived(displayValue ?? '');
	let selectedLabel = $derived.by(() => {
		const found = options.find((option) => valueFn(option) === currentValue);
		return found ? labelFn(found) : currentDisplayValue || resolvedPlaceholder;
	});
	let hasValue = $derived(Boolean(currentValue));
	let resolvedSize = $derived(compact ? 'sm' : size);
	let sizeClass = $derived(selectSizeClasses[resolvedSize]);

	function handleSearch(event: Event) {
		const query = (event.currentTarget as HTMLInputElement).value;
		searchQuery = query;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => void fetchOptions(query), 300);
	}

	async function fetchOptions(query: string) {
		const sequence = ++requestSequence;
		isLoading = true;
		loadError = null;
		try {
			const result = await loadOptions(query);
			if (sequence !== requestSequence) return;
			options = result ?? [];
		} catch {
			if (sequence !== requestSequence) return;
			options = [];
			loadError = loadErrorText;
		} finally {
			if (sequence === requestSequence) isLoading = false;
		}
	}

	function toggle() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			void fetchOptions('');
			queueMicrotask(() => searchInput?.focus());
		} else {
			requestSequence += 1;
		}
	}

	function select(option: Option) {
		value = valueFn(option);
		displayValue = labelFn(option);
		isOpen = false;
		searchQuery = '';
		onchange?.(value);
		triggerEl?.focus();
	}

	function clear() {
		value = '';
		displayValue = '';
		searchQuery = '';
		onchange?.('');
		triggerEl?.focus();
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			isOpen = false;
			triggerEl?.focus();
		}
	}

	function manageRoot(node: HTMLDivElement) {
		const handleClick = (event: Event) => {
			const target = event.target as Node;
			if (!node.contains(target) && !dropdownEl?.contains(target)) isOpen = false;
		};
		document.addEventListener('pointerdown', handleClick, true);
		return () => {
			document.removeEventListener('pointerdown', handleClick, true);
			if (debounceTimer) clearTimeout(debounceTimer);
			requestSequence += 1;
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

	function captureSearchInput(node: HTMLInputElement) {
		searchInput = node;
		return () => {
			if (searchInput === node) searchInput = undefined;
		};
	}
</script>

<div class="{compact ? '' : 'space-y-2'} {className}" {@attach manageRoot}>
	{#if label}
		<label for={id} class="ml-1 text-sm font-semibold text-text-muted">{label}</label>
	{/if}

	<div class="relative flex items-center">
		<button
			{id}
			{@attach captureTrigger}
			type="button"
			onclick={toggle}
			{disabled}
			role="combobox"
			class="flex w-full items-center justify-between rounded-xl border border-border bg-surface pr-16 text-text outline-hidden transition-[border-color,box-shadow,background-color] duration-150 focus:ring-2 focus:ring-brand/20 {sizeClass} {disabled
				? 'cursor-not-allowed opacity-60'
				: 'hover:border-border'} {error ? 'border-error' : ''}"
			aria-haspopup="listbox"
			aria-controls={listboxId}
			aria-expanded={isOpen}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? errorId : undefined}
		>
			<span class="min-w-0 truncate {hasValue ? 'font-medium' : 'text-text-subtle'}"
				>{selectedLabel}</span
			>
		</button>
		<div class="pointer-events-none absolute right-3 flex items-center gap-1.5">
			{#if hasValue && !disabled}
				<button
					type="button"
					onclick={clear}
					class="pointer-events-auto rounded-full p-0.5 text-text-subtle transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
					aria-label={m.clear_selection()}
				>
					<X class="h-3.5 w-3.5" />
				</button>
			{/if}
			<ChevronsUpDown class="h-4 w-4 shrink-0 text-text-subtle" />
		</div>

		{#if isOpen && triggerEl}
			<div
				{@attach captureDropdown}
				use:portal
				use:floating={{ anchor: triggerEl, matchWidth: true }}
				class="z-[9999] mt-2 max-h-72 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
				transition:scale={{ start: 0.95, duration: 150 }}
			>
				<div class="border-b border-border p-2">
					<div class="relative">
						<Search
							class="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-text-subtle"
						/>
						<input
							{@attach captureSearchInput}
							type="text"
							role="searchbox"
							aria-controls={listboxId}
							value={searchQuery}
							oninput={handleSearch}
							onkeydown={handleSearchKeydown}
							placeholder={resolvedSearchPlaceholder}
							class="w-full rounded-lg bg-bg py-2 pr-4 pl-9 text-sm text-text outline-hidden placeholder:text-text-subtle focus:ring-2 focus:ring-brand/20"
						/>
					</div>
				</div>

				<div id={listboxId} role="listbox" class="max-h-56 overflow-y-auto p-1">
					{#if isLoading}
						<div class="flex items-center justify-center p-4 text-text-subtle" role="status">
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{m.loading()}...
						</div>
					{:else if loadError}
						<div class="p-4 text-center text-sm" role="alert">
							<p class="text-error">{loadError}</p>
							<button
								type="button"
								onclick={() => fetchOptions(searchQuery)}
								class="mt-2 font-semibold text-brand hover:underline"
							>
								{retryLabel}
							</button>
						</div>
					{:else if options.length === 0}
						<div class="p-4 text-center text-sm text-text-muted">{m.no_results_found()}</div>
					{:else}
						{#each options as option (valueFn(option))}
							<button
								type="button"
								role="option"
								aria-selected={currentValue === valueFn(option)}
								onclick={() => select(option)}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-100 {currentValue ===
								valueFn(option)
									? 'bg-brand/10 font-semibold text-brand'
									: 'text-text hover:bg-border/50'}"
							>
								<span class="min-w-0 flex-1 overflow-hidden">
									{#if item}{@render item(option)}{:else}<span class="block truncate"
											>{labelFn(option)}</span
										>{/if}
								</span>
								{#if currentValue === valueFn(option)}<Check
										class="ml-2 h-4 w-4 shrink-0 text-brand"
									/>{/if}
							</button>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>
	{#if error}<p id={errorId} class="ml-1 text-xs font-medium text-error">{error}</p>{/if}
</div>
