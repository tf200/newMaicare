<script lang="ts">
	import { Search, SlidersHorizontal } from 'lucide-svelte';
	import FilterDropdown from '$lib/components/ui/FilterDropdown.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { DropdownFilters, FilterOption, HandbooksFilters } from '../+page';

	type Props = {
		searchTerm: string;
		appliedFilters: HandbooksFilters;
		departmentOptions: Array<{ value: string; label: string }>;
		hasActiveFilters: boolean;
		filterGroups: Array<{ label: string; items: FilterOption[] }>;
		activeFilters: DropdownFilters;
		onSearchTermChange: (value: string) => void;
		onSearchApply: () => void;
		onFilterUpdate: (filters: DropdownFilters) => void;
		onDepartmentChange: (value: string) => void;
		onReset: () => void;
	};

	let {
		searchTerm,
		appliedFilters,
		departmentOptions,
		hasActiveFilters,
		filterGroups,
		activeFilters,
		onSearchTermChange,
		onSearchApply,
		onFilterUpdate,
		onDepartmentChange,
		onReset
	}: Props = $props();
</script>

<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
	<div class="relative w-full sm:max-w-[13rem] lg:max-w-[14rem]">
		<Search
			class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-subtle"
		/>
		<input
			type="text"
			placeholder="Search employee..."
			value={searchTerm}
			oninput={(e) => onSearchTermChange((e.target as HTMLInputElement).value)}
			class="h-10 w-full rounded-2xl border border-border bg-surface/80 pr-3 pl-9 text-sm font-medium text-text transition-all placeholder:text-text-subtle focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none"
			onkeydown={(event) => {
				if (event.key === 'Enter') onSearchApply();
			}}
			onblur={onSearchApply}
		/>
	</div>

	<div class="flex flex-1 flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
		<div class="w-full sm:w-40 lg:w-44">
			<Select
				className="!space-y-0"
				size="sm"
				placeholder="Department"
				options={departmentOptions}
				value={appliedFilters.departmentId}
				onchange={onDepartmentChange}
			/>
		</div>

		<FilterDropdown
			filters={activeFilters}
			groups={filterGroups}
			onUpdate={onFilterUpdate}
			onClear={onReset}
			buttonLabel="Filters"
			title="Filter Handbooks"
		/>

		{#if hasActiveFilters}
			<button
				type="button"
				onclick={onReset}
				class="inline-flex h-10 items-center gap-2 rounded-2xl border border-dashed border-border px-3 text-[10px] font-bold tracking-widest text-text-muted uppercase transition-all hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
				title="Reset all filters"
			>
				<SlidersHorizontal class="h-3.5 w-3.5" />
				<span class="hidden xl:inline">Reset</span>
			</button>
		{/if}
	</div>
</div>
