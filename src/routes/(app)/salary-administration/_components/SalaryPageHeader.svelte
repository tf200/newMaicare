<script lang="ts">
	import { BadgeEuro, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';

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

<header class="relative overflow-hidden rounded-3xl">
	<!-- Background gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 dark:from-teal-900 dark:via-teal-950 dark:to-emerald-950"></div>
	<div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
	<div class="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl"></div>

	<div class="relative px-8 py-10">
		<div class="flex flex-wrap items-end justify-between gap-8">
			<!-- Left: Title block -->
			<div class="space-y-3">
				<div class="flex items-center gap-2.5">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
						<BadgeEuro class="h-4 w-4 text-white/90" />
					</div>
					<span class="text-[11px] font-bold tracking-[0.2em] text-white/60 uppercase">HR & Finance</span>
				</div>
				<h1 class="text-4xl font-extrabold tracking-tight text-white">
					Salaris<span class="text-emerald-300">administratie</span>
				</h1>
				<p class="max-w-md text-sm font-medium text-white/50">
					Berekening op basis van ingeroosterde diensten · CAO Jeugdzorg
				</p>
			</div>

			<!-- Right: Month + controls -->
			<div class="flex flex-col items-end gap-4">
				<!-- Month display -->
				<div class="flex items-center gap-3">
					<Button
						variant="ghost"
						class="h-10 w-10 rounded-xl border border-white/10 bg-white/5 p-0 text-white/70 hover:bg-white/10 hover:text-white"
						onclick={() => onNavigate('prev')}
					>
						<ChevronLeft class="h-4 w-4" />
					</Button>
					<div class="min-w-[180px] text-center">
						<div class="text-3xl font-extrabold capitalize tracking-tight text-white">{monthName}</div>
						<div class="text-sm font-semibold text-white/40">{year}</div>
					</div>
					<Button
						variant="ghost"
						class="h-10 w-10 rounded-xl border border-white/10 bg-white/5 p-0 text-white/70 hover:bg-white/10 hover:text-white"
						onclick={() => onNavigate('next')}
					>
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div>

				<!-- Break toggle -->
				<button
					class="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition-all hover:bg-white/10"
					onclick={() => onToggleBreaks(!includeBreaks)}
				>
					<div
						class="relative h-5 w-9 rounded-full transition-colors {includeBreaks
							? 'bg-emerald-400'
							: 'bg-white/20'}"
					>
						<div
							class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform {includeBreaks
								? 'translate-x-4'
								: 'translate-x-0.5'}"
						></div>
					</div>
					<span class="text-xs font-semibold text-white/60">Pauzes meerekenen</span>
				</button>
			</div>
		</div>
	</div>
</header>
