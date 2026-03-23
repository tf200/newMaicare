<script lang="ts">
	import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';
	import { m } from '$lib/paraglide/messages';
	import { selectSizeClasses, type SelectSize } from './_sizes';

	type Option = any;

	let {
		label,
		value = $bindable(),
		displayValue = $bindable(),
		placeholder = undefined,
		searchPlaceholder = undefined,
		disabled = false,
		error = undefined,
		id = `select-${Math.random().toString(36).substr(2, 9)}`,
		className = '',
		size = 'md',
		compact = false,
		item,
		loadOptions,
		onchange,
		labelFn = (opt: Option) => String(opt?.label ?? ''),
		valueFn = (opt: Option) => String(opt?.value ?? '')
	} = $props<{
		label?: string;
		value?: string | undefined;
		displayValue?: string | undefined;
		placeholder?: string;
		searchPlaceholder?: string;
		disabled?: boolean;
		error?: string;
		id?: string;
		className?: string;
		size?: SelectSize;
		/** @deprecated Use size="sm" instead */
		compact?: boolean;
		item?: Snippet<[Option]>;
		loadOptions: (query: string) => Promise<Option[]>;
		onchange?: (value: string) => void;
		labelFn?: (opt: Option) => string;
		valueFn?: (opt: Option) => string;
	}>();

	let isOpen = $state(false);
	let isLoading = $state(false);
	let options = $state<Option[]>([]);
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement>();
	let triggerEl = $state<HTMLElement>();
	let dropdownEl = $state<HTMLElement>();

	let resolvedPlaceholder = $derived(placeholder ?? m.select_placeholder());
	let resolvedSearchPlaceholder = $derived(searchPlaceholder ?? m.search_placeholder_short());
	let currentValue = $derived(value ?? '');
	let currentDisplayValue = $derived(displayValue ?? '');
	let selectedLabel = $derived.by(() => {
		const found = options.find((opt) => valueFn(opt) === currentValue);
		return found ? labelFn(found) : currentDisplayValue || resolvedPlaceholder;
	});
	let hasValue = $derived(!!currentValue && currentValue !== '');
	let resolvedSize = $derived(compact ? 'sm' : size);
	let sizeClass = $derived(selectSizeClasses[resolvedSize as SelectSize]);

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
			setTimeout(() => searchInput?.focus(), 50);
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
		onchange?.(value);
	}

	function clear(e: Event) {
		e.stopPropagation();
		value = '';
		displayValue = '';
		searchQuery = '';
		fetchOptions('');
		onchange?.('');
	}

	function handleOutsideClick(node: HTMLElement) {
		const handleClick = (e: Event) => {
			const target = e.target as Node;
			if (!node.contains(target) && (!dropdownEl || !dropdownEl.contains(target))) {
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

<div class="{compact ? '' : 'space-y-2'} {className}" use:handleOutsideClick>
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
			tabindex={disabled ? -1 : 0}
			onclick={toggle}
			onkeydown={handleKeydown}
			class="flex w-full items-center justify-between rounded-xl border border-border bg-surface outline-hidden transition-[border-color,box-shadow,background-color] duration-150 focus:ring-2 focus:ring-brand/20 {sizeClass} text-text {disabled
				? 'cursor-not-allowed opacity-60'
				: 'hover:border-border'} {error ? 'border-error' : ''}"
			aria-expanded={isOpen}
			aria-disabled={disabled}
		>
			<span class="{hasValue ? 'font-medium' : 'text-text-subtle'} truncate">{selectedLabel}</span>
			<div class="flex items-center gap-1.5">
				{#if hasValue && !disabled}
					<span
						role="button"
						tabindex="-1"
						onclick={clear}
						onkeydown={(e) => e.key === 'Enter' && clear(e)}
						class="rounded-full p-0.5 text-text-subtle transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-brand/30"
						aria-label={m.clear_selection()}
					>
						<X class="h-3.5 w-3.5" />
					</span>
				{/if}
				<ChevronsUpDown class="h-4 w-4 shrink-0 text-text-subtle" />
			</div>
		</button>

		{#if isOpen && triggerEl}
			<div
				bind:this={dropdownEl}
				use:portal
				use:floating={{ anchor: triggerEl, matchWidth: true }}
				class="z-[9999] mt-2 max-h-72 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
				transition:scale={{ start: 0.95, duration: 150 }}
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

				<div class="max-h-56 overflow-y-auto p-1">
					{#if isLoading}
						<div class="flex items-center justify-center p-4 text-text-subtle">
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{m.loading()}...
						</div>
					{:else if options.length === 0}
						<div class="p-4 text-center text-sm text-text-muted">
							{m.no_results_found()}
						</div>
					{:else}
						{#each options as option (valueFn(option))}
							<button
								type="button"
								onclick={() => select(option)}
								class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-100 {currentValue ===
								valueFn(option)
									? 'bg-brand/10 font-semibold text-brand'
									: 'text-text hover:bg-border/50'}"
							>
								<div class="flex-1 overflow-hidden">
									{#if item}
										{@render item(option)}
									{:else}
										<span class="truncate">{labelFn(option)}</span>
									{/if}
								</div>
								{#if currentValue === valueFn(option)}
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
