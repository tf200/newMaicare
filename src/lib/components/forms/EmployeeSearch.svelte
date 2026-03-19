<script lang="ts">
	import { Search, X, Loader2, ChevronDown, User } from 'lucide-svelte';
	import { listEmployees } from '$lib/api/employees';
	import type { EmployeeListItem } from '$lib/api/employees';

	interface Props {
		labelText?: string;
		placeholder?: string;
		selectedId?: string | null;
		onSelect?: (employee: EmployeeListItem | null) => void;
	}

	let {
		labelText = 'Medewerker',
		placeholder = 'Zoek op naam...',
		selectedId = $bindable<string | null>(null),
		onSelect
	}: Props = $props();

	let searchQuery = $state('');
	let employees = $state<EmployeeListItem[]>([]);
	let isLoading = $state(false);
	let isOpen = $state(false);
	let selectedEmployee = $state<EmployeeListItem | null>(null);
	let highlightedIndex = $state(-1);
	let searchInputEl = $state<HTMLInputElement | null>(null);
	let dropdownEl = $state<HTMLDivElement | null>(null);
	let containerEl = $state<HTMLDivElement | null>(null);

	/** Unique id for the input label association */
	const inputId = `emp-search-${Math.random().toString(36).slice(2, 7)}`;

	// ── Debounce helper ────────────────────────────────────────────────────────
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	function debounce(fn: () => void, ms: number) {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(fn, ms);
	}

	// ── API calls ──────────────────────────────────────────────────────────────
	async function fetchEmployees(query: string) {
		isLoading = true;
		try {
			const params = query.trim()
				? { search: query.trim(), page_size: 20, page: 1 }
				: { page_size: 50, page: 1 };
			const response = await listEmployees(params);
			const results = response?.data?.results ?? (response?.data as any)?.data ?? [];
			employees = Array.isArray(results) ? results : [];
		} catch {
			employees = [];
		} finally {
			isLoading = false;
		}
		highlightedIndex = -1;
	}

	// ── Input handling ─────────────────────────────────────────────────────────
	function handleInput(e: Event) {
		const value = (e.currentTarget as HTMLInputElement).value;
		searchQuery = value;
		isOpen = true;
		debounce(() => fetchEmployees(value), 300);
	}

	function handleFocus() {
		isOpen = true;
		// Load full list immediately if not already loaded
		if (employees.length === 0) {
			fetchEmployees(searchQuery);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'ArrowDown' || e.key === 'Enter') {
				isOpen = true;
				if (employees.length === 0) fetchEmployees('');
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlightedIndex = Math.min(highlightedIndex + 1, employees.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && employees[highlightedIndex]) {
					selectEmployee(employees[highlightedIndex]);
				}
				break;
			case 'Escape':
				isOpen = false;
				highlightedIndex = -1;
				break;
			case 'Tab':
				isOpen = false;
				break;
		}
	}

	// ── Selection ──────────────────────────────────────────────────────────────
	function selectEmployee(employee: EmployeeListItem) {
		selectedEmployee = employee;
		selectedId = employee.id;
		searchQuery = '';
		isOpen = false;
		employees = [];
		highlightedIndex = -1;
		onSelect?.(employee);
	}

	function clearSelection() {
		selectedEmployee = null;
		selectedId = '';
		searchQuery = '';
		employees = [];
		isOpen = false;
		highlightedIndex = -1;
		onSelect?.(null);
		// Slight delay so the input is rendered before focusing
		setTimeout(() => searchInputEl?.focus(), 0);
	}

	// ── Click outside ──────────────────────────────────────────────────────────
	function handleClickOutside(event: MouseEvent) {
		if (containerEl && !containerEl.contains(event.target as Node)) {
			isOpen = false;
			highlightedIndex = -1;
		}
	}

	// ── Sync external selectedId reset ─────────────────────────────────────────
	$effect(() => {
		if (!selectedId) selectedEmployee = null;
	});
</script>

<svelte:window onmousedown={handleClickOutside} />

<div class="space-y-2" bind:this={containerEl}>
	{#if labelText}
		<label for={inputId} class="block text-xs font-semibold text-text-muted">
			{labelText}
		</label>
	{/if}

	{#if selectedEmployee}
		<!-- Selected state pill -->
		<div
			class="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-3.5 text-sm shadow-sm"
		>
			<div class="flex min-w-0 items-center gap-2.5">
				<div
					class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/10 text-[10px] font-bold text-brand"
				>
					{selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
				</div>
				<div class="min-w-0">
					<p class="truncate text-sm font-medium text-text">
						{selectedEmployee.first_name}
						{selectedEmployee.last_name}
					</p>
					{#if selectedEmployee.department}
						<p class="truncate text-[10px] text-text-muted">{selectedEmployee.department}</p>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={clearSelection}
				class="shrink-0 rounded-lg p-1 text-text-muted transition hover:bg-border/50 hover:text-text"
				title="Wissen"
			>
				<X class="h-3.5 w-3.5" />
			</button>
		</div>
	{:else}
		<!-- Search input + dropdown -->
		<div class="relative">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-subtle"
			/>
			<input
				id={inputId}
				bind:this={searchInputEl}
				type="text"
				{placeholder}
				value={searchQuery}
				oninput={handleInput}
				onfocus={handleFocus}
				onkeydown={handleKeyDown}
				class="w-full rounded-xl border border-border bg-surface py-3.5 pr-9 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
				autocomplete="off"
				aria-expanded={isOpen}
				aria-autocomplete="list"
			/>
			<!-- Right icon: spinner or chevron -->
			{#if isLoading}
				<Loader2
					class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-brand"
				/>
			{:else}
				<ChevronDown
					class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-subtle transition-transform {isOpen
						? 'rotate-180'
						: ''}"
				/>
			{/if}

			<!-- Dropdown -->
			{#if isOpen}
				<div
					bind:this={dropdownEl}
					class="absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
					role="listbox"
				>
					{#if isLoading}
						<div class="flex items-center justify-center gap-2 px-4 py-4 text-xs text-text-muted">
							<Loader2 class="h-3.5 w-3.5 animate-spin text-brand" />
							<span>Laden...</span>
						</div>
					{:else if employees.length === 0}
						<div class="flex flex-col items-center gap-2 px-4 py-6 text-center">
							<User class="h-8 w-8 text-text-subtle" />
							<p class="text-xs text-text-muted">
								{searchQuery.trim() ? 'Geen medewerkers gevonden' : 'Geen medewerkers beschikbaar'}
							</p>
						</div>
					{:else}
						<div class="max-h-60 overflow-y-auto">
							{#if searchQuery.trim()}
								<div class="border-b border-border/40 px-3 py-1.5">
									<p class="text-[10px] font-semibold tracking-widest text-text-subtle uppercase">
										{employees.length} resultaten
									</p>
								</div>
							{:else}
								<div class="border-b border-border/40 px-3 py-1.5">
									<p class="text-[10px] font-semibold tracking-widest text-text-subtle uppercase">
										Alle medewerkers
									</p>
								</div>
							{/if}
							{#each employees as employee, i (employee.id)}
								<button
									type="button"
									onclick={() => selectEmployee(employee)}
									onmouseenter={() => (highlightedIndex = i)}
									class="flex w-full items-center gap-3 border-b border-border/30 px-3 py-2.5 text-left transition last:border-b-0 {highlightedIndex ===
									i
										? 'bg-brand/10 text-text'
										: 'hover:bg-surface-subtle/60'}"
									role="option"
									aria-selected={highlightedIndex === i}
								>
									<div
										class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg {highlightedIndex ===
										i
											? 'bg-brand/15 text-brand'
											: 'bg-border/50 text-text-muted'} text-[10px] font-bold"
									>
										{employee.first_name[0]}{employee.last_name[0]}
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium text-text">
											{employee.first_name}
											{employee.last_name}
										</p>
										{#if employee.department}
											<p class="truncate text-[11px] text-text-muted">{employee.department}</p>
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
