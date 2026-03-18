<script lang="ts">
	import { Search, X, Loader2 } from 'lucide-svelte';

	interface Props {
		labelText?: string;
		placeholder?: string;
		selectedId?: string | null;
		items?: any[];
		isLoading?: boolean;
		getDisplayText?: (item: any) => string;
		getInitials?: (item: any) => string;
		getSubtext?: (item: any) => string;
		onSearch?: (query: string) => Promise<void>;
		onSelect?: (item: any | null) => void;
	}

	let {
		labelText = 'Select item',
		placeholder = 'Search...',
		selectedId = $bindable<string | null>(null),
		items = [],
		isLoading = false,
		getDisplayText = (item: any) => item.name || item.title || String(item.id),
		getInitials = (item: any) => {
			const text = getDisplayText(item);
			return text
				.split(' ')
				.map((w: string) => w[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		},
		getSubtext = (item: any) => item.department || item.subtitle || '',
		onSearch,
		onSelect
	}: Props = $props();

	let searchQuery = $state('');
	let isOpen = $state(false);
	let selectedItem = $state<any | null>(null);
	let searchInputEl = $state<HTMLInputElement | null>(null);
	let dropdownEl = $state<HTMLDivElement | null>(null);

	async function performSearch(query: string) {
		if (query.trim().length < 2) {
			items = [];
			return;
		}

		if (onSearch) {
			try {
				await onSearch(query);
				isOpen = true;
			} catch (error) {
				console.error('Search failed:', error);
				items = [];
			}
		}
	}

	function handleSelectItem(item: any) {
		selectedItem = item;
		selectedId = item.id as string;
		searchQuery = '';
		isOpen = false;
		items = [];
		onSelect?.(item);
	}

	function clearSelection() {
		selectedItem = null;
		selectedId = null;
		searchQuery = '';
		items = [];
		isOpen = false;
		if (searchInputEl) {
			searchInputEl.focus();
		}
		onSelect?.(null);
	}

	function handleInputChange(value: string) {
		searchQuery = value;
		if (value.trim().length >= 2) {
			performSearch(value);
		} else {
			items = [];
			isOpen = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
			searchQuery = '';
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (
			dropdownEl &&
			searchInputEl &&
			!dropdownEl.contains(event.target as Node) &&
			!searchInputEl.contains(event.target as Node)
		) {
			isOpen = false;
		}
	}
</script>

<svelte:window onmousedown={handleClickOutside} />

<div class="w-full space-y-2">
	{#if labelText}
		<label class="block text-sm font-semibold uppercase tracking-wide text-text">
			{labelText}
		</label>
	{/if}

	{#if selectedItem}
		<!-- Selected State -->
		<div class="flex items-center justify-between gap-3 rounded-lg border-2 border-brand bg-brand/5 px-4 py-3">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand/20 text-sm font-bold text-brand">
					{getInitials(selectedItem)}
				</div>
				<div>
					<p class="text-sm font-semibold text-text">
						{getDisplayText(selectedItem)}
					</p>
					{#if getSubtext(selectedItem)}
						<p class="text-xs text-text-muted">
							{getSubtext(selectedItem)}
						</p>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={clearSelection}
				class="flex-shrink-0 rounded-lg p-1.5 transition hover:bg-error/10 text-text-muted hover:text-error"
				title="Change selection"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{:else}
		<!-- Search Input -->
		<div class="relative">
			<div class="relative flex items-center gap-2 rounded-lg border-2 border-border/60 bg-surface px-3 py-2 shadow-sm transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
				<Search class="h-4 w-4 flex-shrink-0 text-text-muted" />
				<input
					bind:this={searchInputEl}
					type="text"
					{placeholder}
					value={searchQuery}
					oninput={(e) => handleInputChange(e.currentTarget.value)}
					onfocus={() => {
						if (searchQuery.trim().length >= 2) {
							isOpen = true;
						}
					}}
					onkeydown={handleKeyDown}
					class="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
					autocomplete="off"
				/>
				{#if isLoading}
					<Loader2 class="h-4 w-4 flex-shrink-0 animate-spin text-brand" />
				{/if}
			</div>

			<!-- Dropdown -->
			{#if isOpen && (items.length > 0 || isLoading)}
				<div bind:this={dropdownEl} class="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border border-border/60 bg-surface shadow-lg">
					{#if isLoading}
						<div class="flex items-center justify-center gap-2 px-4 py-3">
							<Loader2 class="h-4 w-4 animate-spin text-brand" />
							<span class="text-sm text-text-muted">Loading...</span>
						</div>
					{:else if items.length === 0}
						<div class="px-4 py-3 text-sm text-text-muted text-center">
							No items found
						</div>
					{:else}
						<div class="max-h-64 overflow-y-auto">
							{#each items as item (item.id)}
								<button
									type="button"
									onclick={() => handleSelectItem(item)}
									class="w-full px-4 py-2.5 text-left text-sm transition hover:bg-surface-subtle border-b border-border/30 last:border-b-0 flex items-center gap-3"
								>
									<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
										{getInitials(item)}
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium text-text">
											{getDisplayText(item)}
										</p>
										{#if getSubtext(item)}
											<p class="truncate text-xs text-text-muted">
												{getSubtext(item)}
											</p>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
