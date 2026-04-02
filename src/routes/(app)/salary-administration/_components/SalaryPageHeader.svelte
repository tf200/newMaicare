<script lang="ts">
	import { BadgeEuro, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		currentMonth: Date;
		includeBreaks: boolean;
		onNavigate: (direction: 'prev' | 'next') => void;
		onToggleBreaks: (value: boolean) => void;
	}

	let { currentMonth, includeBreaks, onNavigate, onToggleBreaks }: Props = $props();

	const monthName = $derived(
		new Intl.DateTimeFormat('nl-NL', { month: 'long' }).format(currentMonth)
	);
	const year = $derived(currentMonth.getFullYear());
</script>

<header class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm">
	<div
		class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-teal-100/70 to-emerald-100/20 blur-2xl"
	></div>
	<div class="relative flex flex-wrap items-start justify-between gap-6">
		<div class="space-y-3">
			<div class="flex items-center gap-3 text-sm font-semibold text-brand">
				<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
					<BadgeEuro class="h-5 w-5" />
				</span>
				<span>{m.salaris_hr_finance()}</span>
			</div>
			<h1 class="text-3xl font-bold tracking-tighter text-text">{m.salaris_label()}</h1>
			<p class="max-w-2xl text-sm font-medium text-text-muted">
				{m.salaris_subtitle()}
			</p>
		</div>

		<div class="flex flex-col items-end gap-4">
			<div class="flex items-center gap-3">
				<Button
					variant="ghost"
					class="h-9 w-9 rounded-xl border border-border bg-surface p-0 shadow-sm hover:bg-border/50"
					onclick={() => onNavigate('prev')}
				>
					<ChevronLeft class="h-4 w-4 text-text-muted" />
				</Button>
				<div class="min-w-[140px] text-center">
					<div class="text-xl font-bold capitalize tracking-tight text-text">{monthName}</div>
					<div class="text-xs font-semibold text-text-subtle">{year}</div>
				</div>
				<Button
					variant="ghost"
					class="h-9 w-9 rounded-xl border border-border bg-surface p-0 shadow-sm hover:bg-border/50"
					onclick={() => onNavigate('next')}
				>
					<ChevronRight class="h-4 w-4 text-text-muted" />
				</Button>
			</div>

			<button
				class="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-2 shadow-sm transition-all hover:bg-border/30"
				onclick={() => onToggleBreaks(!includeBreaks)}
			>
				<div
					class="relative h-5 w-9 rounded-full transition-colors {includeBreaks
						? 'bg-brand'
						: 'bg-border'}"
				>
					<div
						class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform {includeBreaks
							? 'translate-x-4'
							: 'translate-x-0.5'}"
					></div>
				</div>
				<span class="text-xs font-semibold text-text-muted">{m.salaris_breaks()}</span>
			</button>
		</div>
	</div>
</header>

