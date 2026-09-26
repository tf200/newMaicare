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
		brand: 'bg-btn-primary-bg text-btn-primary-text shadow-sm',
		warning: 'bg-warning/15 text-warning-strong',
		success: 'bg-success/15 text-success-strong',
		error: 'bg-error/15 text-error-strong',
		info: 'bg-info/15 text-info-strong',
		neutral: 'bg-border text-text',
		amber: 'bg-warning/15 text-warning-strong',
		emerald: 'bg-success/15 text-success-strong',
		rose: 'bg-error/15 text-error-strong',
		blue: 'bg-info/15 text-info-strong',
		slate: 'bg-border text-text'
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
			class="min-h-11 rounded-full px-4 text-xs font-semibold transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none {isActive
				? activeColorMap[color]
				: inactiveClass}"
		>
			{pill.label}
		</button>
	{/each}
</div>
