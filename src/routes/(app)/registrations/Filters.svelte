<script lang="ts">
	import { Filter, X, Check, ChevronDown } from 'lucide-svelte';
	import { slide, scale } from 'svelte/transition';
	import type { RegistrationFilters } from './+page';
	import Button from '$lib/components/ui/Button.svelte';

	let { filters, onUpdate, onClear } = $props<{
		filters: RegistrationFilters;
		onUpdate: (newFilters: RegistrationFilters) => void;
		onClear: () => void;
	}>();

	let isOpen = $state(false);

	const groups = [
		{
			label: 'Behavioral Risks',
			items: [
				{ key: 'riskAggressiveBehavior', label: 'Aggressive behavior' },
				{ key: 'riskSexualBehavior', label: 'Sexual behavior' },
				{ key: 'riskFlightBehavior', label: 'Flight behavior' }
			]
		},
		{
			label: 'Clinical Factors',
			items: [
				{ key: 'riskPsychiatricIssues', label: 'Psychiatric issues' },
				{ key: 'riskSuicidalSelfharm', label: 'Suicidal / Self-harm' },
				{ key: 'riskSubstanceAbuse', label: 'Substance abuse' },
				{ key: 'riskDayNightRhythm', label: 'Day/night rhythm' }
			]
		},
		{
			label: 'Safety & Legal',
			items: [
				{ key: 'riskCriminalHistory', label: 'Criminal history' },
				{ key: 'riskWeaponPossession', label: 'Weapon possession' }
			]
		}
	] as const;

	function toggleOpen() {
		isOpen = !isOpen;
	}

	function handleOutsideClick(node: HTMLElement) {
		const handleClick = (e: MouseEvent) => {
			if (!node.contains(e.target as Node) && isOpen) {
				isOpen = false;
			}
		};
		document.addEventListener('click', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	function toggleRisk(key: keyof RegistrationFilters) {
		const current = filters[key] as boolean | undefined;
		// Toggle between true (active) and undefined (inactive)
		// This prevents sending ?param=false which might be interpreted as "must not be true"
		const next = current ? undefined : true;
		onUpdate({ ...filters, [key]: next });
	}

	const activeFilterCount = $derived.by(() => {
		let count = 0;
		for (const group of groups) {
			for (const item of group.items) {
				if (filters[item.key as keyof RegistrationFilters]) count++;
			}
		}
		return count;
	});
</script>

<div class="relative inline-block w-full text-left sm:w-auto" use:handleOutsideClick>
	<button
		onclick={toggleOpen}
		class="group inline-flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-text-muted transition-all hover:border-brand/50 hover:text-text focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-auto sm:justify-start {isOpen
			? 'border-brand/50 text-text ring-2 ring-brand/20'
			: ''} {activeFilterCount > 0 ? 'border-brand/20 bg-brand/5 text-brand' : ''}"
	>
		<div class="flex items-center gap-2">
			<Filter class="h-4 w-4" />
			<span>Filters</span>
			{#if activeFilterCount > 0}
				<span
					class="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand/10 px-1 text-[10px] font-bold text-brand"
				>
					{activeFilterCount}
				</span>
			{/if}
		</div>
		<ChevronDown class="h-3.5 w-3.5 opacity-50 transition-transform {isOpen ? 'rotate-180' : ''}" />
	</button>

	{#if isOpen}
		<div
			transition:scale={{ start: 0.95, duration: 100 }}
			class="absolute top-full left-0 z-50 mt-2 w-full origin-top-right rounded-2xl border border-border bg-surface shadow-xl ring-1 ring-black/5 focus:outline-none sm:right-0 sm:left-auto sm:w-[340px]"
		>
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<h3 class="text-sm font-semibold text-text">Filter registrations</h3>
				{#if activeFilterCount > 0}
					<button
						onclick={onClear}
						class="text-xs font-medium text-text-muted hover:text-brand hover:underline"
					>
						Clear all
					</button>
				{/if}
			</div>

			<div class="max-h-[60vh] overflow-y-auto p-4">
				<!-- Risk Factors -->
				<div class="space-y-6">
					{#each groups as group (group.label)}
						<div>
							<h4 class="mb-3 text-xs font-bold tracking-wider text-text-subtle uppercase">
								{group.label}
							</h4>
							<div class="space-y-2">
								{#each group.items as item (item.key)}
									{@const isChecked = filters[item.key as keyof RegistrationFilters]}
									<button
										onclick={() => toggleRisk(item.key as keyof RegistrationFilters)}
										class="hover:bg-surface-alt flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors"
									>
										<span class={isChecked ? 'font-medium text-text' : 'text-text-muted'}>
											{item.label}
										</span>
										<div
											class="flex h-5 w-5 items-center justify-center rounded border transition-all {isChecked
												? 'border-brand bg-brand text-white'
												: 'border-border bg-surface'}"
										>
											{#if isChecked}
												<Check class="h-3.5 w-3.5" />
											{/if}
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
