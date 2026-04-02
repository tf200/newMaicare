<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { GraduationCap, Clock, Shield, Users } from 'lucide-svelte';
	import type { Training } from '$lib/types/api/trainingen';

	interface Props {
		trainings: Training[];
		loading: boolean;
	}

	let { trainings, loading }: Props = $props();

	const categoryColors: Record<string, { bg: string; text: string }> = {
		veiligheid: { bg: 'bg-rose-500/8', text: 'text-rose-600 dark:text-rose-400' },
		zorg: { bg: 'bg-emerald-500/8', text: 'text-emerald-600 dark:text-emerald-400' },
		communicatie: { bg: 'bg-blue-500/8', text: 'text-blue-600 dark:text-blue-400' },
		technisch: { bg: 'bg-amber-500/8', text: 'text-amber-600 dark:text-amber-400' },
		management: { bg: 'bg-violet-500/8', text: 'text-violet-600 dark:text-violet-400' },
		algemeen: { bg: 'bg-border/40', text: 'text-text-muted' }
	};

	const categoryIcon: Record<string, any> = {
		veiligheid: Shield,
		zorg: Users,
		technisch: Clock,
		management: GraduationCap
	};
</script>

<div>
	<div class="mb-5 flex items-baseline justify-between">
		<div>
			<h2 class="text-lg font-extrabold tracking-tight text-text">{m.train_catalog_title()}</h2>
			<p class="mt-0.5 text-xs font-medium text-text-subtle">{m.train_catalog_subtitle()}</p>
		</div>
		<span class="text-xs font-semibold text-text-subtle tabular-nums"
			>{m.train_count({ count: trainings.length })}</span
		>
	</div>

	{#if loading}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _, i}
				<div
					class="h-[140px] animate-pulse rounded-2xl bg-border/20"
					style="animation-delay: {i * 50}ms"
				></div>
			{/each}
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each trainings as training, idx (training.id)}
				{@const cat = categoryColors[training.category] ?? categoryColors.algemeen}
				{@const CatIcon = categoryIcon[training.category] ?? GraduationCap}
				<div
					class="group rounded-2xl border border-border/60 bg-surface p-5 transition-all hover:border-border hover:shadow-sm"
					style="animation: fade-in 350ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: {idx *
						50}ms"
				>
					<div class="flex items-start justify-between">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl {cat.bg} {cat.text}">
							<CatIcon class="h-4.5 w-4.5" />
						</div>
						{#if training.is_mandatory}
							<span
								class="inline-flex items-center rounded-lg bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400"
							>
								{m.train_mandatory()}
							</span>
						{/if}
					</div>

					<h3 class="mt-3 text-[14px] font-extrabold text-text">{training.name}</h3>
					{#if training.description}
						<p class="mt-1 line-clamp-2 text-[12px] leading-relaxed text-text-subtle">
							{training.description}
						</p>
					{/if}

					<div class="mt-3 flex flex-wrap gap-1.5">
						<span
							class="inline-flex items-center rounded-md {cat.bg} px-2 py-0.5 text-[10px] font-bold {cat.text} capitalize"
							>{training.category}</span
						>
						{#if training.duration_hours}
							<span
								class="inline-flex items-center rounded-md bg-border/30 px-2 py-0.5 text-[10px] font-bold text-text-muted"
								>{training.duration_hours}u</span
							>
						{/if}
						{#if training.validity_months}
							<span
								class="inline-flex items-center rounded-md bg-border/30 px-2 py-0.5 text-[10px] font-bold text-text-muted"
								>{training.validity_months}m geldig</span
							>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
