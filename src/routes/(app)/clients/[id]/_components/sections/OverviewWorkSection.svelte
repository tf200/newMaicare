<script lang="ts">
	import { Briefcase } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewData } from '$lib/mock/client-overview';
	import { formatOverviewDate } from '../overview-date';
	import { getLocale } from '$lib/paraglide/runtime';

	interface Props {
		work: ClientOverviewData['work'];
	}

	let { work }: Props = $props();

	const formatDate = (dateString?: string | null) =>
		formatOverviewDate(dateString ?? undefined, getLocale(), m.not_available_short());
</script>

<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center gap-2">
		<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
			<Briefcase class="h-3.5 w-3.5" />
		</div>
		<h3 class="font-bold text-text">{m.work_section()}</h3>
	</div>
	{#if work}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-xs text-text-muted">{m.currently_employed()}</span>
				<span
					class={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
						work.currentlyEmployed
							? 'bg-emerald-500/10 text-emerald-700'
							: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
					}`}
				>
					{work.currentlyEmployed ? m.yes() : m.no()}
				</span>
			</div>

			{#if work.currentEmployer}
				<div>
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.employer()}
					</p>
					<p class="mt-0.5 text-sm font-medium text-text">{work.currentEmployer}</p>
					<div class="mt-1 space-y-0.5">
						{#if work.employerPhone}
							<p class="flex items-center gap-1.5 text-xs text-text-muted">
								<span class="opacity-70">{m.phone()}:</span>
								{work.employerPhone}
							</p>
						{/if}
						{#if work.employerEmail}
							<p class="flex items-center gap-1.5 text-xs text-text-muted">
								<span class="opacity-70">{m.email()}:</span>
								{work.employerEmail}
							</p>
						{/if}
					</div>
				</div>
			{/if}

			{#if work.currentPosition}
				<div>
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.position()}
					</p>
					<p class="mt-0.5 text-sm font-medium text-text">{work.currentPosition}</p>
				</div>
			{/if}

			{#if work.startDate}
				<div>
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.start_date()}
					</p>
					<p class="mt-0.5 text-sm font-medium text-text">{formatDate(work.startDate)}</p>
				</div>
			{/if}

			{#if work.additionalNotes}
				<div class="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.additional_notes()}
					</p>
					<p class="mt-1 text-xs text-text">{work.additionalNotes}</p>
				</div>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-text-muted">{m.not_available()}</p>
	{/if}
</div>
