<script lang="ts">
	import {
		AlertTriangle,
		Clock,
		CalendarClock,
		Mail,
		ChevronRight,
		ArrowRight
	} from 'lucide-svelte';
	import type { UpcomingAssessment } from '$lib/types/api/functioneren';

	interface Props {
		items: UpcomingAssessment[];
		loading: boolean;
	}

	let { items, loading }: Props = $props();

	const fmtDate = (d: string) =>
		new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(new Date(d));

	const fmtDateFull = (d: string) =>
		new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' }).format(
			new Date(d)
		);

	const overdueCount = $derived(items.filter((a) => a.isOverdue).length);
	const dueSoonCount = $derived(items.filter((a) => a.isDueSoon).length);
	const plannedCount = $derived(items.filter((a) => !a.isOverdue && !a.isDueSoon).length);

	function daysUntil(dateStr: string): number {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const target = new Date(dateStr);
		target.setHours(0, 0, 0, 0);
		return Math.round((target.getTime() - now.getTime()) / 86400000);
	}

	function progressPercent(last: string, next: string): number {
		const now = new Date();
		const lastD = new Date(last);
		const nextD = new Date(next);
		const total = nextD.getTime() - lastD.getTime();
		const elapsed = now.getTime() - lastD.getTime();
		return Math.min(100, Math.max(0, (elapsed / total) * 100));
	}
</script>

<div>
	<div class="mb-5 flex items-baseline justify-between">
		<div>
			<h2 class="text-lg font-extrabold tracking-tight text-text">Aankomende Beoordelingen</h2>
			<p class="mt-0.5 text-xs font-medium text-text-subtle">
				6-wekelijkse cyclus na laatste beoordeling
			</p>
		</div>
		{#if overdueCount > 0 || dueSoonCount > 0}
			<div class="flex gap-2">
				{#if overdueCount > 0}
					<span
						class="inline-flex items-center rounded-xl bg-error/10 px-2.5 py-1 text-[10px] font-bold text-error"
					>
						<AlertTriangle class="mr-1 h-3 w-3" />
						{overdueCount} verlopen
					</span>
				{/if}
				{#if dueSoonCount > 0}
					<span
						class="inline-flex items-center rounded-xl bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400"
					>
						<Clock class="mr-1 h-3 w-3" />
						{dueSoonCount} binnenkort
					</span>
				{/if}
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each Array(4) as _, i}
				<div
					class="h-[120px] animate-pulse rounded-2xl bg-border/20"
					style="animation-delay: {i * 60}ms"
				></div>
			{/each}
		</div>
	{:else if items.length === 0}
		<div class="flex flex-col items-center rounded-2xl border border-dashed border-border py-16">
			<div
				class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/8 dark:bg-emerald-500/5"
			>
				<CalendarClock class="h-6 w-6 text-emerald-400 dark:text-emerald-500" />
			</div>
			<p class="mt-4 text-sm font-bold text-text">Alle beoordelingen op schema</p>
			<p class="mt-1 max-w-[280px] text-center text-xs text-text-subtle">
				Er zijn momenteel geen verlopen of aankomende beoordelingen
			</p>
		</div>
	{:else}
		<!-- Sectioned card layout -->
		<div class="space-y-8">
			<!-- Overdue -->
			{#if overdueCount > 0}
				<div>
					<div class="mb-3 flex items-center gap-2">
						<div class="h-2 w-2 rounded-full bg-error"></div>
						<span class="text-[10px] font-bold tracking-[0.14em] text-error uppercase"
							>Verlopen</span
						>
						<div class="h-px flex-1 bg-error/10"></div>
					</div>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each items.filter((i) => i.isOverdue) as item, idx (item.employeeId)}
							{@const days = daysUntil(item.nextAssessmentDate)}
							{@const progress = progressPercent(item.lastAssessmentDate, item.nextAssessmentDate)}
							<div
								class="group relative overflow-hidden rounded-2xl border border-error/20 bg-error/[0.03] transition-all hover:border-error/30 hover:shadow-sm"
								style="animation: fade-in 350ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: {idx *
									60}ms"
							>
								<!-- Progress bar at top -->
								<div class="h-1 bg-error/10">
									<div class="h-full w-full bg-error/40"></div>
								</div>

								<div class="p-5">
									<div class="flex items-start justify-between">
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10 text-[12px] font-bold tracking-tight text-error"
											>
												{item.employeeName
													.split(' ')
													.map((p) => p[0])
													.join('')
													.slice(0, 2)}
											</div>
											<div>
												<div class="text-[14px] font-bold text-text">{item.employeeName}</div>
												<div class="mt-0.5 text-[11px] text-text-subtle">
													Laatst: {fmtDate(item.lastAssessmentDate)}
												</div>
											</div>
										</div>
										<div class="text-right">
											<div class="text-[24px] leading-none font-extrabold text-error tabular-nums">
												{Math.abs(days)}
											</div>
											<div class="text-[10px] font-bold text-error/70">
												{Math.abs(days) === 1 ? 'dag' : 'dagen'} te laat
											</div>
										</div>
									</div>

									<div class="mt-4 flex items-center justify-between">
										<div class="flex items-center gap-2 text-[12px] text-text-muted">
											<CalendarClock class="h-3.5 w-3.5 opacity-50" />
											<span>{fmtDateFull(item.nextAssessmentDate)}</span>
										</div>
										<button
											class="flex h-8 items-center gap-1.5 rounded-lg bg-error/10 px-3 text-[11px] font-bold text-error transition-all hover:bg-error/15 active:scale-95"
										>
											<Mail class="h-3 w-3" /> Uitnodigen
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Due soon -->
			{#if dueSoonCount > 0}
				<div>
					<div class="mb-3 flex items-center gap-2">
						<div class="h-2 w-2 rounded-full bg-amber-500"></div>
						<span
							class="text-[10px] font-bold tracking-[0.14em] text-amber-600 uppercase dark:text-amber-400"
							>Binnen 2 weken</span
						>
						<div class="h-px flex-1 bg-amber-500/10"></div>
					</div>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each items.filter((i) => i.isDueSoon) as item, idx (item.employeeId)}
							{@const days = daysUntil(item.nextAssessmentDate)}
							{@const progress = progressPercent(item.lastAssessmentDate, item.nextAssessmentDate)}
							<div
								class="group relative overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50/30 transition-all hover:border-amber-300/60 hover:shadow-sm dark:border-amber-800/30 dark:bg-amber-950/10"
								style="animation: fade-in 350ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: {idx *
									60}ms"
							>
								<!-- Progress bar -->
								<div class="h-1 bg-amber-500/10">
									<div class="h-full bg-amber-500/40" style="width: {progress}%"></div>
								</div>

								<div class="p-5">
									<div class="flex items-start justify-between">
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-[12px] font-bold tracking-tight text-amber-600 dark:text-amber-400"
											>
												{item.employeeName
													.split(' ')
													.map((p) => p[0])
													.join('')
													.slice(0, 2)}
											</div>
											<div>
												<div class="text-[14px] font-bold text-text">{item.employeeName}</div>
												<div class="mt-0.5 text-[11px] text-text-subtle">
													Laatst: {fmtDate(item.lastAssessmentDate)}
												</div>
											</div>
										</div>
										<div class="text-right">
											<div
												class="text-[24px] leading-none font-extrabold text-amber-600 tabular-nums dark:text-amber-400"
											>
												{days}
											</div>
											<div class="text-[10px] font-bold text-amber-600/60 dark:text-amber-400/60">
												{days === 1 ? 'dag' : 'dagen'}
											</div>
										</div>
									</div>

									<div class="mt-4 flex items-center justify-between">
										<div class="flex items-center gap-2 text-[12px] text-text-muted">
											<CalendarClock class="h-3.5 w-3.5 opacity-50" />
											<span>{fmtDateFull(item.nextAssessmentDate)}</span>
										</div>
										<button
											class="flex h-8 items-center gap-1.5 rounded-lg border border-amber-200 px-3 text-[11px] font-bold text-amber-600 transition-all hover:bg-amber-500/5 active:scale-95 dark:border-amber-800 dark:text-amber-400"
										>
											<Mail class="h-3 w-3" /> Uitnodigen
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Planned -->
			{#if plannedCount > 0}
				<div>
					<div class="mb-3 flex items-center gap-2">
						<div class="h-2 w-2 rounded-full bg-text-subtle"></div>
						<span class="text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase"
							>Gepland</span
						>
						<div class="h-px flex-1 bg-border/50"></div>
					</div>
					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#each items.filter((i) => !i.isOverdue && !i.isDueSoon) as item, idx (item.employeeId)}
							{@const days = daysUntil(item.nextAssessmentDate)}
							{@const progress = progressPercent(item.lastAssessmentDate, item.nextAssessmentDate)}
							<div
								class="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface transition-all hover:border-border hover:shadow-sm"
								style="animation: fade-in 350ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: {idx *
									60}ms"
							>
								<!-- Progress bar -->
								<div class="h-1 bg-border/30">
									<div
										class="h-full bg-text-subtle/30 transition-all"
										style="width: {progress}%"
									></div>
								</div>

								<div class="p-4">
									<div class="flex items-center gap-3">
										<div
											class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-border/40 text-[11px] font-bold tracking-tight text-text-muted"
										>
											{item.employeeName
												.split(' ')
												.map((p) => p[0])
												.join('')
												.slice(0, 2)}
										</div>
										<div class="min-w-0 flex-1">
											<div class="truncate text-[13px] font-bold text-text">
												{item.employeeName}
											</div>
											<div class="mt-0.5 text-[11px] text-text-subtle">
												{fmtDateFull(item.nextAssessmentDate)}
											</div>
										</div>
										<div class="text-right">
											<div
												class="text-[18px] leading-none font-extrabold text-text-muted tabular-nums"
											>
												{days}
											</div>
											<div class="text-[9px] font-bold text-text-subtle">dagen</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
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
