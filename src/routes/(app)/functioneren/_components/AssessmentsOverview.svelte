<script lang="ts">
	import { Eye, Trash2, ClipboardList } from 'lucide-svelte';
	import type { Assessment } from '$lib/types/api/functioneren';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		assessments: Assessment[];
		loading: boolean;
		onView: (id: string) => void;
		onDelete: (id: string, name: string) => void;
	}

	let { assessments, loading, onView, onDelete }: Props = $props();

	const fmtDate = (d: string) =>
		new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));

	function scoreInfo(score: number | null): { label: string; cls: string; bar: string } {
		if (score === null) return { label: '—', cls: 'text-text-subtle', bar: 'bg-border' };
		if (score >= 8) return { label: score.toFixed(1), cls: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' };
		if (score >= 6) return { label: score.toFixed(1), cls: 'text-teal-700 dark:text-teal-300', bar: 'bg-teal-500' };
		if (score === 5) return { label: score.toFixed(1), cls: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' };
		return { label: score.toFixed(1), cls: 'text-rose-700 dark:text-rose-300', bar: 'bg-rose-500' };
	}
</script>

<div>
	<div class="mb-5 flex items-baseline justify-between">
		<div>
			<h2 class="text-lg font-extrabold tracking-tight text-text">{m.func_all_assessments()}</h2>
			<p class="mt-0.5 text-xs font-medium text-text-subtle">{m.func_all_assessments()}</p>
		</div>
		<span class="text-xs font-semibold tabular-nums text-text-subtle">{assessments.length} totaal</span>
	</div>

	{#if loading}
		<div class="space-y-2 py-4">
			{#each Array(5) as _, i}
				<div class="h-[52px] animate-pulse rounded-xl bg-border/20" style="animation-delay: {i * 50}ms"></div>
			{/each}
		</div>
	{:else if assessments.length === 0}
		<div class="flex flex-col items-center rounded-2xl border border-dashed border-border py-16">
			<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/8 dark:bg-rose-500/5">
				<ClipboardList class="h-6 w-6 text-rose-400 dark:text-rose-500" />
			</div>
			<p class="mt-4 text-sm font-bold text-text">{m.func_no_results()}</p>
			<p class="mt-1 max-w-[280px] text-center text-xs text-text-subtle">
				Start een nieuwe beoordeling om het functioneren van medewerkers te evalueren
			</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b border-border">
						<th class="pb-2.5 pt-0 text-left text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">{m.salaris_employee()}</th>
						<th class="pb-2.5 pt-0 text-left text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">Datum</th>
						<th class="pb-2.5 pt-0 text-left text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">{m.func_detail_score()}</th>
						<th class="pb-2.5 pt-0 text-center text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">{m.func_status_label()}</th>
						<th class="pb-2.5 pt-0 w-20"></th>
					</tr>
				</thead>
				<tbody>
					{#each assessments as a, idx (a.id)}
						{@const si = scoreInfo(a.total_score)}
						<tr class="group border-b border-border/50 transition-colors hover:bg-rose-500/[0.03] {idx % 2 === 0 ? '' : 'bg-border/[0.06]'}">
							<td class="py-3">
								<div class="flex items-center gap-3">
									<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/8 text-[11px] font-bold tracking-tight text-rose-600 dark:text-rose-400">
										{a.employee?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2) ?? '??'}
									</div>
									<div>
										<div class="text-[13px] font-bold text-text">{a.employee?.name ?? 'Onbekend'}</div>
									</div>
								</div>
							</td>
							<td class="py-3 text-[13px] tabular-nums text-text-muted">{fmtDate(a.assessment_date)}</td>
							<td class="py-3">
								<div class="flex items-center gap-2.5">
									<div class="h-1.5 w-16 overflow-hidden rounded-full bg-border/50">
										<div class="h-full rounded-full {si.bar} transition-all" style="width: {a.total_score !== null ? (a.total_score / 10) * 100 : 0}%"></div>
									</div>
									<span class="text-[13px] font-extrabold tabular-nums {si.cls}">{si.label}</span>
								</div>
							</td>
							<td class="py-3 text-center">
								{#if a.status === 'completed'}
									<span class="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-700 dark:text-emerald-400">{m.func_status_completed()}</span>
								{:else}
									<span class="inline-flex items-center rounded-lg bg-border/40 px-2.5 py-1 text-[10px] font-bold tracking-wide text-text-muted">{m.func_status_draft()}</span>
								{/if}
							</td>
							<td class="py-3">
								<div class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
									<button
										class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-all hover:bg-rose-500/8 hover:text-rose-600"
										onclick={() => onView(a.id)}
										aria-label="Bekijken"
									>
										<Eye class="h-[15px] w-[15px]" />
									</button>
									<button
										class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-all hover:bg-error/10 hover:text-error"
										onclick={() => onDelete(a.id, a.employee?.name ?? 'Onbekend')}
										aria-label="Verwijderen"
									>
										<Trash2 class="h-[15px] w-[15px]" />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
