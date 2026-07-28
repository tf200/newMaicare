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
		color?:
			| 'brand'
			| 'warning'
			| 'success'
			| 'error'
			| 'info'
			| 'neutral'
			| 'amber'
			| 'emerald'
			| 'rose'
			| 'blue'
			| 'slate';
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
		brand: 'bg-btn-primary-bg text-surface shadow-sm',
		warning: 'bg-warning text-surface shadow-sm',
		success: 'bg-success text-surface shadow-sm',
		error: 'bg-error text-surface shadow-sm',
		info: 'bg-info text-surface shadow-sm',
		neutral: 'bg-text-muted text-surface shadow-sm',
		amber: 'bg-warning text-surface shadow-sm',
		emerald: 'bg-success text-surface shadow-sm',
		rose: 'bg-error text-surface shadow-sm',
		blue: 'bg-info text-surface shadow-sm',
		slate: 'bg-text-muted text-surface shadow-sm'
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
			type="button"
			aria-pressed={isActive}
			onclick={() => handleClick(pill.id)}
			class="h-9 rounded-full px-4 text-xs font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none {isActive
				? activeColorMap[color]
				: inactiveClass}"
		>
			{pill.label}
		</button>
	{/each}
</div>
