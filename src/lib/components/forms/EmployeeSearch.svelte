<script lang="ts">
	import { Search, X, Loader2 } from 'lucide-svelte';
	import { listEmployees } from '$lib/api/employees';
	import type { EmployeeListItem } from '$lib/api/employees';

	interface Props {
		labelText?: string;
		placeholder?: string;
		selectedId?: string | null;
		onSelect?: (employee: EmployeeListItem | null) => void;
	}

	let {
		labelText = 'Medewerker selecteren',
		placeholder = 'Zoek op naam...',
		selectedId = $bindable<string | null>(null),
		onSelect
	}: Props = $props();

	let searchQuery = $state('');
	let employees = $state<EmployeeListItem[]>([]);
	let isLoading = $state(false);
	let isOpen = $state(false);
	let selectedEmployee = $state<EmployeeListItem | null>(null);
	let searchInputEl = $state<HTMLInputElement | null>(null);
	let dropdownEl = $state<HTMLDivElement | null>(null);

	const inputId = 'employee-search-input';

	async function performSearch(query: string) {
		const trimmed = query.trim();
		if (trimmed.length < 2) {
			employees = [];
			return;
		}

		isLoading = true;
		try {
			const response = await listEmployees({ search: trimmed, page_size: 10, page: 1 });
			const results =
				response?.data?.results ??
				response?.data?.results ??
				(response?.data as any)?.data ??
				[];
			employees = Array.isArray(results) ? results : [];
		} catch (error) {
			console.error('Failed to fetch employees:', error);
			employees = [];
		} finally {
			isLoading = false;
		}
	}

	function handleSelectEmployee(employee: EmployeeListItem) {
		selectedEmployee = employee;
		selectedId = employee.id;
		searchQuery = '';
		isOpen = false;
		employees = [];
		onSelect?.(employee);
	}

	function clearSelection() {
		selectedEmployee = null;
		selectedId = '';
		searchQuery = '';
		employees = [];
		isOpen = false;
		if (searchInputEl) {
			searchInputEl.focus();
		}
		onSelect?.(null);
	}

	function handleInputChange(value: string) {
		searchQuery = value;
	}

	function applySearch() {
		performSearch(searchQuery);
		isOpen = true;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			applySearch();
			return;
		}
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

	$effect(() => {
		if (!selectedId) {
			selectedEmployee = null;
		}
	});
</script>

<svelte:window onmousedown={handleClickOutside} />

<div class="space-y-2">
	{#if labelText}
		<label for={inputId} class="ml-1 text-xs font-semibold text-text-muted">
			{labelText}
		</label>
	{/if}

	{#if selectedEmployee}
		<div class="flex h-9 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3">
			<div class="flex min-w-0 items-center gap-3">
				<div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-border/60 text-[10px] font-semibold text-text">
					{selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
				</div>
				<div class="min-w-0">
					<p class="truncate text-sm font-medium text-text">
						{selectedEmployee.first_name} {selectedEmployee.last_name}
					</p>
					{#if selectedEmployee.department}
						<p class="truncate text-xs text-text-muted">
							{selectedEmployee.department}
						</p>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={clearSelection}
				class="rounded-lg p-1 text-text-muted transition hover:bg-border/40 hover:text-text"
				title="Wissen"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{:else}
		<div class="relative">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				id={inputId}
				bind:this={searchInputEl}
				type="text"
				{placeholder}
				value={searchQuery}
				oninput={(e) => handleInputChange(e.currentTarget.value)}
				onblur={applySearch}
				onfocus={() => {
					isOpen = true;
				}}
				onkeydown={handleKeyDown}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-9 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
				autocomplete="off"
			/>
			{#if isLoading}
				<Loader2 class="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-brand" />
			{/if}

			{#if isOpen}
				<div
					bind:this={dropdownEl}
					class="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
				>
					{#if isLoading}
						<div class="flex items-center justify-center gap-2 px-4 py-3">
							<Loader2 class="h-4 w-4 animate-spin text-brand" />
							<span class="text-xs text-text-muted">Laden...</span>
						</div>
					{:else if searchQuery.trim().length < 2}
						<div class="px-4 py-3 text-xs text-text-muted">Typ minimaal 2 letters</div>
					{:else if employees.length === 0}
						<div class="px-4 py-3 text-xs text-text-muted">Geen medewerkers gevonden</div>
					{:else}
						<div class="max-h-64 overflow-y-auto">
							{#each employees as employee (employee.id)}
								<button
									type="button"
									onclick={() => handleSelectEmployee(employee)}
									class="flex w-full items-center gap-3 border-b border-border/50 px-4 py-2.5 text-left text-sm transition hover:bg-surface-subtle last:border-b-0"
								>
									<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-xs font-semibold text-brand">
										{employee.first_name[0]}{employee.last_name[0]}
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium text-text">
											{employee.first_name} {employee.last_name}
										</p>
										{#if employee.department}
											<p class="truncate text-xs text-text-muted">{employee.department}</p>
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
