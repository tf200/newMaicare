<script lang="ts">
	import { MessageSquare } from 'lucide-svelte';
	import type { AssessmentScore } from '$lib/types/api/functioneren';

	interface Props {
		assessment: {
			id: string;
			employee?: { name: string } | null;
			assessment_date: string;
			total_score: number | null;
			status: string;
			notes: string | null;
		} | null;
		scores: AssessmentScore[];
		onClose: () => void;
	}

	let { assessment, scores }: Props = $props();

	const domainLabels: Record<string, string> = {
		'veilig-stabiel-leefklimaat': 'Veilig en stabiel leefklimaat',
		'adl-begeleiding': 'ADL-begeleiding',
		'stimuleren-ontwikkeling': 'Stimuleren van ontwikkeling',
		'opvoeden-begrenzen': 'Opvoeden en begrenzen',
		'individuele-begeleiding': 'Individuele begeleiding'
	};

	const domainShort: Record<string, string> = {
		'veilig-stabiel-leefklimaat': 'VSL',
		'adl-begeleiding': 'ADL',
		'stimuleren-ontwikkeling': 'SO',
		'opvoeden-begrenzen': 'OB',
		'individuele-begeleiding': 'IB'
	};

	const itemLabels: Record<string, string> = {
		'vsl-1': 'Voorspelbaarheid als fundament',
		'vsl-2': 'Fysieke en emotionele veiligheid',
		'vsl-3': 'Structuur door heldere kaders',
		'vsl-4': 'Rust en ruimte voor herstel',
		'vsl-5': 'Rituelen en groepsgevoel',
		'adl-1': 'Praktische levensvaardigheden',
		'adl-2': 'Zelfzorg en hygiëne',
		'adl-3': 'Gezondheid en welzijn',
		'adl-4': 'Dagindeling en tijdmanagement',
		'adl-5': 'Vrijetijdsbesteding',
		'so-1': 'Sociale vaardigheden trainen',
		'so-2': 'Emotieregulatie versterken',
		'so-3': 'Zelfredzaamheid vergroten',
		'so-4': 'Zelfvertrouwen opbouwen',
		'so-5': 'Cognitieve ontwikkeling ondersteunen',
		'ob-1': 'Positief en constructief corrigeren',
		'ob-2': 'Relationeel begrenzen',
		'ob-3': 'Afstemmen op onderliggende behoeftes',
		'ob-4': 'Variëren in opvoedstijlen',
		'ob-5': 'Methodische interventies',
		'ib-1': 'Behandelplannen vertalen',
		'ib-2': 'Persoonlijk ontwikkelingsplan',
		'ib-3': '1-op-1 gesprekken voeren',
		'ib-4': 'Multidisciplinaire samenwerking',
		'ib-5': 'Systemisch werken'
	};

	const grouped = $derived.by(() => {
		const map: Record<string, AssessmentScore[]> = {};
		for (const s of scores) {
			if (!map[s.domain_id]) map[s.domain_id] = [];
			map[s.domain_id].push(s);
		}
		return map;
	});

	function ratingVisual(r: number): { label: string; cls: string; bar: string } {
		if (r >= 8) return { label: 'Goed', cls: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' };
		if (r >= 6) return { label: 'Voldoende', cls: 'text-teal-700 dark:text-teal-300', bar: 'bg-teal-500' };
		if (r === 5) return { label: 'Matig', cls: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' };
		return { label: 'Onvoldoende', cls: 'text-rose-700 dark:text-rose-300', bar: 'bg-rose-500' };
	}

	const domainAvg = (scores: AssessmentScore[]) => {
		if (scores.length === 0) return 0;
		return scores.reduce((s, x) => s + x.rating, 0) / scores.length;
	};
</script>

{#if assessment}
	<div class="space-y-6">
		<!-- Meta cards -->
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each [
				{ label: 'Medewerker', value: assessment.employee?.name ?? '—' },
				{ label: 'Datum', value: new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(assessment.assessment_date)) },
				{ label: 'Score', value: assessment.total_score !== null ? `${assessment.total_score.toFixed(1)}/10` : '—' },
				{ label: 'Status', value: assessment.status === 'completed' ? 'Voltooid' : 'Concept' }
			] as item}
				<div class="rounded-xl border border-border/60 bg-surface px-4 py-3">
					<div class="text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">{item.label}</div>
					<div class="mt-1 text-[13px] font-bold text-text">{item.value}</div>
				</div>
			{/each}
		</div>

		{#if assessment.notes}
			<div class="rounded-xl border border-rose-200/50 bg-rose-50/50 p-4 dark:border-rose-800/30 dark:bg-rose-950/20">
				<div class="text-[10px] font-bold tracking-[0.14em] text-rose-600/70 dark:text-rose-400/70 uppercase">Opmerkingen</div>
				<p class="mt-1 text-[13px] leading-relaxed text-rose-900 dark:text-rose-100">{assessment.notes}</p>
			</div>
		{/if}

		<!-- Domain scores -->
		<div class="space-y-5">
			{#each Object.entries(grouped) as [domainId, domainScores]}
				{@const avg = domainAvg(domainScores)}
				{@const avgVis = ratingVisual(avg)}
				<div>
					<div class="mb-3 flex items-baseline justify-between border-b border-border pb-2">
						<div class="flex items-center gap-2">
							<span class="inline-flex h-6 w-8 items-center justify-center rounded-md bg-rose-500/8 text-[10px] font-bold text-rose-600 dark:text-rose-400">
								{domainShort[domainId] ?? '?'}
							</span>
							<h3 class="text-[13px] font-extrabold text-text">{domainLabels[domainId] ?? domainId}</h3>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-1.5 w-10 overflow-hidden rounded-full bg-border/50">
								<div class="h-full rounded-full {avgVis.bar}" style="width: {(avg / 10) * 100}%"></div>
							</div>
							<span class="text-xs font-extrabold tabular-nums {avgVis.cls}">{avg.toFixed(1)}</span>
						</div>
					</div>
					<div class="space-y-1.5">
						{#each domainScores as score}
							{@const rv = ratingVisual(score.rating)}
							<div class="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-border/20">
								<div class="flex-1 min-w-0">
									<div class="text-[13px] font-semibold text-text">{itemLabels[score.item_id] ?? score.item_id}</div>
									{#if score.remarks}
										<div class="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-text-muted">
											<MessageSquare class="mt-0.5 h-3 w-3 shrink-0 opacity-50" />
											<span class="italic">{score.remarks}</span>
										</div>
									{/if}
								</div>
								<div class="flex shrink-0 items-center gap-2">
									<div class="h-1.5 w-8 overflow-hidden rounded-full bg-border/50">
										<div class="h-full rounded-full {rv.bar}" style="width: {(score.rating / 10) * 100}%"></div>
									</div>
									<span class="w-6 text-right text-xs font-extrabold tabular-nums {rv.cls}">{score.rating}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
