<script lang="ts">
	import type { CaoSalaryScale } from '$lib/types/api/salary';
	import { ORT_PERCENTAGES } from '$lib/utils/ort';

	interface Props {
		scales: CaoSalaryScale[];
		loading: boolean;
		includeBreaks: boolean;
	}

	let { scales, loading, includeBreaks }: Props = $props();

	const fmt = (amount: number) =>
		new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
</script>

<div class="space-y-8">
	<!-- Reference tables side by side -->
	<div class="grid gap-6 md:grid-cols-2">
		<!-- Shift hours -->
		<div>
			<div class="border-b-2 border-text/10 pb-3 mb-1">
				<h3 class="text-base font-extrabold tracking-tight text-text">Diensttypes</h3>
				<p class="text-[11px] text-text-subtle">
					{includeBreaks ? 'Incl. 30 min pauze' : 'Excl. 30 min pauze'}
				</p>
			</div>
			<div class="divide-y divide-border/40">
				{#each [
					{ name: 'Ochtenddienst', hours: includeBreaks ? '8,0' : '7,5', time: '07:00 – 15:00' },
					{ name: 'Avonddienst', hours: includeBreaks ? '8,0' : '7,5', time: '14:30 – 22:30' },
					{ name: 'Nachtdienst', hours: includeBreaks ? '10,0' : '9,5', time: '22:00 – 07:30' }
				] as shift}
					<div class="flex items-baseline justify-between py-3">
						<div>
							<div class="text-sm font-semibold text-text">{shift.name}</div>
							<div class="text-[11px] text-text-subtle">{shift.time}</div>
						</div>
						<div class="text-sm font-extrabold tabular-nums text-text">{shift.hours}u</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- ORT percentages -->
		<div>
			<div class="border-b-2 border-text/10 pb-3 mb-1">
				<h3 class="text-base font-extrabold tracking-tight text-text">ORT Percentages</h3>
				<p class="text-[11px] text-text-subtle">CAO Jeugdzorg onregelmatigheidstoeslag</p>
			</div>
			<div class="divide-y divide-border/40">
				{#each [
					{ label: 'Ochtend 06:00–07:00 (ma-vr)', pct: ORT_PERCENTAGES.earlyMorning, color: 'bg-teal-500' },
					{ label: 'Avond 19:00–22:00 (ma-vr)', pct: ORT_PERCENTAGES.evening, color: 'bg-teal-500' },
					{ label: 'Nacht 22:00–06:00 (alle dagen)', pct: ORT_PERCENTAGES.night, color: 'bg-amber-500' },
					{ label: 'Zaterdag 06:00–22:00', pct: ORT_PERCENTAGES.saturdayDay, color: 'bg-indigo-500' },
					{ label: 'Zondag / Feestdag (hele dag)', pct: ORT_PERCENTAGES.sundayHoliday, color: 'bg-rose-500' }
				] as item}
					<div class="flex items-center justify-between py-3">
						<div class="flex items-center gap-2.5">
							<div class="h-2 w-2 rounded-full {item.color}"></div>
							<span class="text-sm text-text">{item.label}</span>
						</div>
						<span class="text-sm font-extrabold tabular-nums text-text">{(item.pct * 100).toFixed(0)}%</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- CAO Salary scales -->
	<div>
		<div class="border-b-2 border-text/10 pb-4 mb-1">
			<h3 class="text-base font-extrabold tracking-tight text-text">CAO Jeugdzorg Loonschalen</h3>
			<p class="text-xs text-text-subtle">Uurlonen en maandsalarissen per schaal</p>
		</div>

		{#if loading}
			<div class="space-y-2 py-6">
				{#each Array(8) as _, i}
					<div class="h-10 animate-pulse rounded-xl bg-border/20" style="animation-delay: {i * 40}ms"></div>
				{/each}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-text/8">
							<th class="pb-3 pt-4 text-left text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Schaal</th>
							<th class="pb-3 pt-4 text-center text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Per.</th>
							<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Maandsalaris</th>
							<th class="pb-3 pt-4 text-right text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">Uurloon</th>
							<th class="pb-3 pt-4 text-left text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase"></th>
						</tr>
					</thead>
					<tbody>
						{#each scales as scale, idx (scale.id)}
							<tr class="border-b border-border/40 {idx % 2 === 0 ? '' : 'bg-border/15'}">
								<td class="py-2.5 text-sm font-bold text-text">{scale.scale_number}</td>
								<td class="py-2.5 text-center">
									{#if scale.is_uitloop}
										<span class="inline-block rounded-md bg-text/5 px-1.5 py-px text-[10px] font-bold text-text-muted">uitloop</span>
									{:else}
										<span class="text-sm tabular-nums text-text">{scale.periodiek}</span>
									{/if}
								</td>
								<td class="py-2.5 text-right text-sm tabular-nums text-text">{fmt(scale.monthly_salary)}</td>
								<td class="py-2.5 text-right text-sm font-semibold tabular-nums text-text">
									{scale.hourly_rate ? fmt(scale.hourly_rate) : '—'}
								</td>
								<td class="py-2.5">
									{#if scale.is_uitloop}
										<span class="text-[10px] text-text-subtle">Uitloop</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
