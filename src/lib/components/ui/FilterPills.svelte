<script lang="ts">
	export interface FilterPill {
		/** Unique identifier for the pill */
		id: string;
		/** Display label */
		label: string;
		/**
		 * Semantic color for the active state.
		 * - `'brand'` (default): uses theme CSS variables (`bg-btn-primary-bg`)
		 * - `'amber'`: warning/pending
		 * - `'emerald'`: success/approved
		 * - `'rose'`: error/rejected
		 * - `'blue'`: info/scheduled
		 * - `'slate'`: neutral/out-of-care
		 */
		color?: 'brand' | 'amber' | 'emerald' | 'rose' | 'blue' | 'slate';
	}

	interface Props {
		/** Array of filter pills to render */
		pills: FilterPill[];
		/** Currently active pill id (two-way bindable) */
		activeId: string;
		/** Callback fired after a pill is selected. Useful for side effects like resetting page to 1. */
		onSelect?: (id: string) => void;
		/** Optional label rendered before the pill group (e.g. "Filter:") */
		label?: string;
		/** Additional classes on the wrapper */
		class?: string;
	}

	let { pills, activeId = $bindable(), onSelect, label, class: className = '' }: Props = $props();

	type PillColor = NonNullable<FilterPill['color']>;

	const activeColorMap: Record<PillColor, string> = {
		brand: 'bg-btn-primary-bg text-btn-primary-text shadow-sm',
		amber:
			'bg-amber-500 text-white shadow-sm shadow-amber-700/20 dark:shadow-amber-900/30',
		emerald:
			'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20 dark:shadow-emerald-900/30',
		rose:
			'bg-rose-600 text-white shadow-sm shadow-rose-700/20 dark:shadow-rose-900/30',
		blue:
			'bg-blue-600 text-white shadow-sm shadow-blue-700/20 dark:shadow-blue-900/30',
		slate:
			'bg-slate-500 text-white shadow-sm shadow-slate-600/20 dark:shadow-slate-800/30'
	};

	const inactiveClass =
		'border border-border text-text-muted hover:bg-border/20 hover:text-text active:scale-95';

	function handleClick(id: string) {
		if (id === activeId) return;
		activeId = id;
		onSelect?.(id);
	}
</script>

<div class="flex flex-wrap items-center gap-2 {className}">
	{#if label}
		<span class="text-xs font-semibold text-text-muted">{label}</span>
	{/if}
	{#each pills as pill (pill.id)}
		{@const isActive = activeId === pill.id}
		{@const color: PillColor = pill.color ?? 'brand'}
		<button
			onclick={() => handleClick(pill.id)}
			class="h-9 rounded-full px-4 text-xs font-semibold transition-all duration-150 {isActive
				? activeColorMap[color]
				: inactiveClass}"
		>
			{pill.label}
		</button>
	{/each}
</div>
