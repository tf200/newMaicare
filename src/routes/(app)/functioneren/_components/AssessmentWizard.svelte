<script lang="ts">
	import { ChevronLeft, ChevronRight, Check, AlertTriangle, ClipboardList } from 'lucide-svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		employees: { id: string; name: string }[];
		onComplete?: () => void;
	}

	let { employees, onComplete }: Props = $props();

	interface Question { id: string; question: string }
	interface Domain { id: string; title: string; short: string; questions: Question[] }

	const domains: Domain[] = [
		{
			id: 'veilig-stabiel-leefklimaat',
			title: 'Veilig en stabiel leefklimaat',
			short: 'VSL',
			questions: [
				{ id: 'vsl-1', question: 'Voorspelbaarheid als fundament: Consistent dagritme hanteren met vaste tijdstippen voor maaltijden, school, huiswerk, vrije tijd en bedtijd.' },
				{ id: 'vsl-2', question: 'Fysieke en emotionele veiligheid: Zorgen voor een schone, ordelijke en huiselijke leefomgeving. Een sfeer creëren waarin jeugdigen zich gehoord voelen.' },
				{ id: 'vsl-3', question: 'Structuur door heldere kaders: Duidelijke, haalbare en consistente groepsregels hanteren. De waarom achter regels uitleggen.' },
				{ id: 'vsl-4', question: 'Rust en ruimte voor herstel: Prikkelniveaus bewaken, conflicten de-escaleren en ontspanning faciliteren.' },
				{ id: 'vsl-5', question: 'Rituelen en groepsgevoel: Vaste gewoontes gebruiken die geborgenheid en groepsgevoel versterken.' }
			]
		},
		{
			id: 'adl-begeleiding',
			title: 'ADL-begeleiding',
			short: 'ADL',
			questions: [
				{ id: 'adl-1', question: 'Praktische levensvaardigheden: Koken, boodschappen doen, budgetbeheer, huishouden en administratie.' },
				{ id: 'adl-2', question: 'Zelfzorg en hygiëne: Sensitief begeleiden bij persoonlijke verzorging met respect voor privacy en autonomie.' },
				{ id: 'adl-3', question: 'Gezondheid en welzijn: Gezond eten, beweging en slaapritme stimuleren. Medicatiebegeleiding volgens protocol.' },
				{ id: 'adl-4', question: 'Dagindeling en tijdmanagement: Plannen van schooltaken, afspraken en vrijetijdsbesteding.' },
				{ id: 'adl-5', question: 'Vrijetijdsbesteding: Zinvolle hobby\'s, sport en sociale contacten buiten de groep faciliteren.' }
			]
		},
		{
			id: 'stimuleren-ontwikkeling',
			title: 'Stimuleren van ontwikkeling',
			short: 'SO',
			questions: [
				{ id: 'so-1', question: 'Sociale vaardigheden trainen: Oefenen met contact maken, conflicten oplossen en samenwerken via groepsactiviteiten.' },
				{ id: 'so-2', question: 'Emotieregulatie versterken: Herkennen, benoemen en constructief uiten van emoties.' },
				{ id: 'so-3', question: 'Zelfredzaamheid vergroten: Stapsgewijs verantwoordelijkheid geven passend bij ontwikkelingsniveau.' },
				{ id: 'so-4', question: 'Zelfvertrouwen opbouwen: Successen benadrukken, positieve bekrachtiging geven, talenten ontdekken.' },
				{ id: 'so-5', question: 'Cognitieve ontwikkeling ondersteunen: Hulp bij huiswerk, contact met school, leeromgeving bieden.' }
			]
		},
		{
			id: 'opvoeden-begrenzen',
			title: 'Opvoeden en begrenzen',
			short: 'OB',
			questions: [
				{ id: 'ob-1', question: 'Positief en constructief corrigeren: Focus op gewenst gedrag, uitleg geven over gevolgen.' },
				{ id: 'ob-2', question: 'Relationeel begrenzen: Grenzen stellen vanuit verbinding. Relatie herstellen na correctie.' },
				{ id: 'ob-3', question: 'Afstemmen op onderliggende behoeftes: Kijken voorbij het gedrag naar angst, onmacht of aandacht.' },
				{ id: 'ob-4', question: 'Variëren in opvoedstijlen: Schakelen tussen autoritatieve en coachende stijl.' },
				{ id: 'ob-5', question: 'Methodische interventies: Technieken toepassen zoals Geef me de 5 of Nieuwe Autoriteit.' }
			]
		},
		{
			id: 'individuele-begeleiding',
			title: 'Individuele begeleiding',
			short: 'IB',
			questions: [
				{ id: 'ib-1', question: 'Behandelplannen vertalen: Dagelijkse doelen koppelen aan behandeldoelen.' },
				{ id: 'ib-2', question: 'Persoonlijk ontwikkelingsplan: Samen haalbare doelen opstellen en evalueren.' },
				{ id: 'ib-3', question: '1-op-1 gesprekken: Individuele tijd inplannen voor voortgang, zorgen en wensen.' },
				{ id: 'ib-4', question: 'Multidisciplinaire samenwerking: Bevindingen delen met pedagogen, psychologen en artsen.' },
				{ id: 'ib-5', question: 'Systemisch werken: Begeleiding afstemmen op groep, familie en school.' }
			]
		}
	];

	let currentStep = $state(0);
	let selectedEmployee = $state('');
	let answers = $state<Record<string, number>>({});
	let remarks = $state<Record<string, string>>({});
	let submitted = $state(false);

	const totalSteps = domains.length + 2; // start + 5 domains + finish

	function currentDomain(): Domain | null {
		if (currentStep < 1 || currentStep > domains.length) return null;
		return domains[currentStep - 1];
	}

	function canProceed(): boolean {
		if (currentStep === 0) return selectedEmployee !== '';
		const domain = currentDomain();
		if (!domain) return true;
		return domain.questions.every((q) => answers[q.id] !== undefined);
	}

	function allLowScores(): { question: Question; domain: Domain; score: number }[] {
		const low: { question: Question; domain: Domain; score: number }[] = [];
		for (const [qId, score] of Object.entries(answers)) {
			if (score <= 5) {
				const d = domains.find((d) => d.questions.some((q) => q.id === qId));
				const q = d?.questions.find((q) => q.id === qId);
				if (d && q) low.push({ question: q, domain: d, score });
			}
		}
		return low;
	}

	function handleSubmit() {
		submitted = true;
	}

	function handleReset() {
		currentStep = 0;
		selectedEmployee = '';
		answers = {};
		remarks = {};
		submitted = false;
	}

	function ratingVisual(r: number): { cls: string; label: string } {
		if (r >= 8) return { cls: 'bg-emerald-500 border-emerald-600 text-white', label: 'Goed' };
		if (r >= 6) return { cls: 'bg-teal-500 border-teal-600 text-white', label: 'Voldoende' };
		if (r === 5) return { cls: 'bg-amber-500 border-amber-600 text-white', label: 'Matig' };
		return { cls: 'bg-rose-500 border-rose-600 text-white', label: 'Onvoldoende' };
	}
</script>

<div class="space-y-6">
	<!-- Progress steps -->
	<div class="overflow-x-auto pb-2">
		<div class="flex items-center gap-1.5 min-w-max">
			{#each ['Start', ...domains.map(d => d.short), 'Afronden'] as step, i}
				<div class="flex items-center">
					<div class="flex flex-col items-center gap-1">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-200
								{i === currentStep
									? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
									: i < currentStep
										? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
										: 'bg-border/40 text-text-subtle'}"
						>
							{#if i < currentStep}
								<Check class="h-4 w-4" />
							{:else}
								{i + 1}
							{/if}
						</div>
						<span class="text-[10px] font-bold {i === currentStep ? 'text-text' : 'text-text-subtle'}">{step}</span>
					</div>
					{#if i < totalSteps - 1}
						<div class="mx-1 h-px w-6 {i < currentStep ? 'bg-rose-500/30' : 'bg-border/50'}"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	{#if submitted}
		<!-- Success state -->
		<div class="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-8 text-center dark:border-emerald-800/30 dark:bg-emerald-950/20">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
				<Check class="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
			</div>
			<h3 class="mt-4 text-xl font-extrabold tracking-tight text-text">Beoordeling ingediend</h3>
			<p class="mt-1 text-sm text-text-muted">
				{Object.keys(answers).length} vragen beantwoord
				{#if allLowScores().length > 0}
					· <span class="font-semibold text-amber-600 dark:text-amber-400">{allLowScores().length} werkadvies(sen) aangemaakt</span>
				{/if}
			</p>
			<Button variant="primary" class="mt-6" onclick={handleReset}>Nieuwe beoordeling</Button>
		</div>
	{:else}
		<!-- Step content -->
		<div class="rounded-2xl border border-border bg-surface">
			<!-- Step header -->
			<div class="border-b border-border px-6 py-4">
				<div class="flex items-center gap-3">
					{#if currentStep === 0}
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
							<span class="text-xs font-bold">1</span>
						</div>
					{:else if currentDomain()}
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400">
							{currentDomain()?.short}
						</div>
					{:else}
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
							<Check class="h-4 w-4" />
						</div>
					{/if}
					<div>
						<h3 class="text-base font-extrabold tracking-tight text-text">
							{#if currentStep === 0}
								Medewerker selecteren
							{:else if currentDomain()}
								{currentDomain()?.title}
							{:else}
								Beoordeling afronden
							{/if}
						</h3>
						<p class="text-xs text-text-subtle">
							{#if currentStep === 0}
								Kies de medewerker en het functieniveau
							{:else if currentDomain()}
								Beoordeel elke competentie op een schaal van 1-10
							{:else}
								Controleer en dien de beoordeling in
							{/if}
						</p>
					</div>
				</div>
			</div>

			<div class="p-6">
				{#if currentStep === 0}
					<!-- Employee selection -->
					<div class="space-y-5 max-w-md">
						<div>
							<label class="mb-1.5 block text-xs font-bold tracking-wide text-text-subtle uppercase">Functie</label>
							<Select
								value="jeugdwerker-d"
								size="sm"
								options={[
									{ value: 'jeugdwerker-d', label: 'Jeugdwerker (niveau D)' },
									{ value: 'jeugdwerker-e', label: 'Jeugdwerker (niveau E)' },
									{ value: 'pedagogisch-medewerker', label: 'Pedagogisch Medewerker' }
								]}
							/>
						</div>
						<div>
							<label class="mb-1.5 block text-xs font-bold tracking-wide text-text-subtle uppercase">Medewerker</label>
							<Select
								bind:value={selectedEmployee}
								size="sm"
								options={employees.map((e) => ({ value: e.id, label: e.name }))}
								placeholder="Selecteer een medewerker"
							/>
						</div>
					</div>

				{:else if currentStep > 0 && currentStep <= domains.length}
					<!-- Domain questions -->
					<div class="space-y-6">
						{#each currentDomain()?.questions ?? [] as question, qIdx}
							<div class="space-y-3">
								<p class="text-[13px] font-semibold leading-relaxed text-text">
									<span class="mr-1 text-text-subtle">{qIdx + 1}.</span>
									{question.question}
								</p>

								<!-- Score buttons -->
								<div class="flex gap-1.5 flex-wrap">
									{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as score}
										{@const rv = ratingVisual(score)}
										{@const isSelected = answers[question.id] === score}
										<button
											class="flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-150
												{isSelected
													? rv.cls + ' scale-110 shadow-md'
													: 'border-border/50 text-text-muted hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-700'}
												active:scale-95"
											onclick={() => {
												answers[question.id] = score;
												if (score >= 6) delete remarks[question.id];
											}}
										>
											{score}
										</button>
									{/each}
								</div>

								<div class="flex justify-between text-[10px] font-semibold text-text-subtle">
									<span>1-4 Onvoldoende</span>
									<span>5 Matig</span>
									<span>6-7 Voldoende</span>
									<span>8-10 Goed</span>
								</div>

								{#if answers[question.id] !== undefined && answers[question.id] <= 5}
									<div class="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 dark:border-amber-800/30 dark:bg-amber-950/20">
										<label class="mb-1.5 block text-[11px] font-bold text-amber-700 dark:text-amber-400">
											Toelichting vereist bij score ≤ 5
										</label>
										<textarea
											class="w-full rounded-lg border border-amber-200/50 bg-surface px-3 py-2 text-[13px] text-text placeholder:text-text-subtle focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 dark:border-amber-800/50"
											rows="2"
											placeholder="Geef een toelichting waarom deze score is gegeven..."
											value={remarks[question.id] ?? ''}
											oninput={(e) => { remarks[question.id] = (e.target as HTMLTextAreaElement).value; }}
										></textarea>
									</div>
								{/if}
							</div>
						{/each}
					</div>

				{:else}
					<!-- Review / finish step -->
					<div class="space-y-6 text-center">
						<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
							<ClipboardList class="h-7 w-7 text-rose-500" />
						</div>
						<div>
							<h3 class="text-lg font-extrabold text-text">Klaar om in te dienen</h3>
							<p class="mt-1 text-sm text-text-muted">U heeft alle vragen beantwoord.</p>
						</div>

						<div class="flex justify-center gap-8">
							<div>
								<div class="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{Object.keys(answers).length}</div>
								<div class="text-[11px] font-bold text-text-subtle">Vragen</div>
							</div>
							<div>
								<div class="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{allLowScores().length}</div>
								<div class="text-[11px] font-bold text-text-subtle">Verbeterpunten</div>
							</div>
						</div>

						{#if allLowScores().length > 0}
							<div class="mx-auto max-w-lg rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 text-left dark:border-amber-800/30 dark:bg-amber-950/20">
								<div class="flex items-center gap-2 text-amber-700 dark:text-amber-400">
									<AlertTriangle class="h-4 w-4" />
									<span class="text-[11px] font-bold uppercase tracking-wider">Werkadvies wordt aangemaakt</span>
								</div>
								<div class="mt-2 space-y-1.5">
									{#each allLowScores() as item}
										<div class="flex items-center gap-2 text-[12px]">
											<span class="inline-flex h-5 w-5 items-center justify-center rounded-full {item.score <= 4 ? 'bg-error/10 text-error' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'} text-[10px] font-bold">{item.score}</span>
											<span class="text-text-muted">{item.domain.short}</span>
											<span class="text-text-subtle">·</span>
											<span class="truncate text-text">{item.question.question.split(':')[0]}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Navigation footer -->
			<div class="flex items-center justify-between border-t border-border px-6 py-4">
				{#if currentStep > 0}
					<button
						class="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-[12px] font-bold text-text-muted transition-all hover:bg-border/30 active:scale-95"
						onclick={() => currentStep--}
					>
						<ChevronLeft class="h-3.5 w-3.5" /> Vorige
					</button>
				{:else}<div></div>{/if}

				{#if currentStep < totalSteps - 1}
					<button
						class="flex h-9 items-center gap-1.5 rounded-lg bg-rose-500 px-4 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-rose-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
						onclick={() => currentStep++}
						disabled={!canProceed()}
					>
						Volgende <ChevronRight class="h-3.5 w-3.5" />
					</button>
				{:else}
					<button
						class="flex h-9 items-center gap-1.5 rounded-lg bg-rose-500 px-4 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-rose-600 active:scale-95"
						onclick={handleSubmit}
					>
						<Check class="h-3.5 w-3.5" /> Indienen
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
