<script lang="ts">
	import { Eye, MessageSquare, Trash2, Clock, Send, CheckCircle, AlertCircle, ClipboardList } from 'lucide-svelte';
	import type { WorkAssignment } from '$lib/types/api/functioneren';

	interface Props {
		assignments: WorkAssignment[];
		loading: boolean;
	}

	let { assignments, loading }: Props = $props();

	const fmtDate = (d: string | null) =>
		d ? new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(new Date(d)) : '—';

	const domainLabels: Record<string, string> = {
		'veilig-stabiel-leefklimaat': 'Veilig leefklimaat',
		'adl-begeleiding': 'ADL-begeleiding',
		'stimuleren-ontwikkeling': 'Ontwikkeling',
		'opvoeden-begrenzen': 'Opvoeden',
		'individuele-begeleiding': 'Individueel'
	};

	const openCount = $derived(assignments.filter((a) => a.status === 'open').length);
	const submittedCount = $derived(assignments.filter((a) => a.status === 'submitted').length);
	const doneCount = $derived(assignments.filter((a) => ['approved', 'revision_needed'].includes(a.status)).length);

	const summaryItems = $derived([
		{ label: 'Openstaand', value: String(openCount), icon: Clock, color: 'from-amber-500/12 to-amber-500/3', valColor: 'text-amber-700 dark:text-amber-300' },
		{ label: 'Te beoordelen', value: String(submittedCount), icon: Send, color: 'from-indigo-500/12 to-indigo-500/3', valColor: 'text-indigo-700 dark:text-indigo-300' },
		{ label: 'Afgerond', value: String(doneCount), icon: CheckCircle, color: 'from-emerald-500/12 to-emerald-500/3', valColor: 'text-emerald-700 dark:text-emerald-300' }
	]);
</script>

<div class="space-y-6">
	<!-- Summary strip -->
	<div class="grid grid-cols-3 gap-3">
		{#each summaryItems as stat, i}
			<div class="relative overflow-hidden rounded-2xl border border-border/80 bg-surface" style="animation: fade-in 400ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: {i * 80}ms">
				<div class="absolute inset-0 bg-gradient-to-br {stat.color}"></div>
				<div class="relative flex items-center gap-4 px-5 py-4">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl {stat.valColor} bg-surface/60 shadow-sm">
						<stat.icon class="h-4 w-4" />
					</div>
					<div>
						<div class="text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">{stat.label}</div>
						<div class="mt-1 text-[22px] leading-none font-extrabold tracking-tight tabular-nums {stat.valColor}">{stat.value}</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Table -->
	<div>
		<div class="mb-5 flex items-baseline justify-between">
			<div>
				<h2 class="text-lg font-extrabold tracking-tight text-text">Werkadvies</h2>
				<p class="mt-0.5 text-xs font-medium text-text-subtle">Automatisch gegenereerd bij lage beoordelingsscores</p>
			</div>
			<span class="text-xs font-semibold tabular-nums text-text-subtle">{assignments.length} opdrachten</span>
		</div>

		{#if loading}
			<div class="space-y-2 py-4">
				{#each Array(4) as _, i}
					<div class="h-[52px] animate-pulse rounded-xl bg-border/20" style="animation-delay: {i * 50}ms"></div>
				{/each}
			</div>
		{:else if assignments.length === 0}
			<div class="flex flex-col items-center rounded-2xl border border-dashed border-border py-16">
				<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/8 dark:bg-emerald-500/5">
					<ClipboardList class="h-6 w-6 text-emerald-400 dark:text-emerald-500" />
				</div>
				<p class="mt-4 text-sm font-bold text-text">Geen openstaand werkadvies</p>
				<p class="mt-1 max-w-[280px] text-center text-xs text-text-subtle">
					Werkadvies wordt automatisch aangemaakt wanneer een score lager dan 6 wordt gegeven
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-border">
							<th class="pb-2.5 pt-0 text-left text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">Medewerker</th>
							<th class="pb-2.5 pt-0 text-left text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">Domein</th>
							<th class="pb-2.5 pt-0 text-left text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">Opdracht</th>
							<th class="pb-2.5 pt-0 text-left text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">Deadline</th>
							<th class="pb-2.5 pt-0 text-center text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">Status</th>
							<th class="pb-2.5 pt-0 w-24"></th>
						</tr>
					</thead>
					<tbody>
						{#each assignments as a, idx (a.id)}
							<tr class="group border-b border-border/50 transition-colors hover:bg-rose-500/[0.03] {idx % 2 === 0 ? '' : 'bg-border/[0.06]'}">
								<td class="py-3 text-[13px] font-bold text-text">{a.employee?.name ?? 'Onbekend'}</td>
								<td class="py-3">
									<span class="inline-flex items-center rounded-lg border border-border/60 bg-border/20 px-2 py-0.5 text-[10px] font-bold text-text-muted">
										{domainLabels[a.domain_id] ?? a.domain_id}
									</span>
								</td>
								<td class="py-3 text-[13px] text-text max-w-[300px] truncate">{a.question_text}</td>
								<td class="py-3 text-[13px] tabular-nums text-text-muted">{fmtDate(a.due_date)}</td>
								<td class="py-3 text-center">
									{#if a.status === 'open'}
										<span class="inline-flex items-center rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
											<Clock class="mr-1 h-2.5 w-2.5" /> Open
										</span>
									{:else if a.status === 'submitted'}
										<span class="inline-flex items-center rounded-lg bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
											<Send class="mr-1 h-2.5 w-2.5" /> Ingediend
										</span>
									{:else if a.status === 'approved'}
										<span class="inline-flex items-center rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
											<CheckCircle class="mr-1 h-2.5 w-2.5" /> Goedgekeurd
										</span>
									{:else}
										<span class="inline-flex items-center rounded-lg bg-error/10 px-2 py-1 text-[10px] font-bold text-error">
											<AlertCircle class="mr-1 h-2.5 w-2.5" /> Revisie
										</span>
									{/if}
								</td>
								<td class="py-3">
									<div class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<button class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-all hover:bg-rose-500/8 hover:text-rose-600">
											<Eye class="h-[15px] w-[15px]" />
										</button>
										{#if a.status === 'submitted'}
											<button class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-all hover:bg-rose-500/8 hover:text-rose-600">
												<MessageSquare class="h-[15px] w-[15px]" />
											</button>
										{/if}
										<button class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-all hover:bg-error/10 hover:text-error">
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
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
