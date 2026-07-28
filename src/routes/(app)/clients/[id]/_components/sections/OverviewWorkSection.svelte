<script lang="ts">
	import { Briefcase } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewData } from '../../overview.shared';
	import { formatOverviewDate } from '../overview-date';
	import { getLocale } from '$lib/paraglide/runtime';

	interface Props {
		work: ClientOverviewData['work'];
	}

	let { work }: Props = $props();

	const formatDate = (dateString?: string | null) =>
		formatOverviewDate(dateString ?? undefined, getLocale(), m.not_available_short());
</script>

<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center gap-2">
		<div
			class="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning-strong"
		>
			<Briefcase class="h-4 w-4" aria-hidden="true" />
		</div>
		<h2 class="text-lg font-semibold tracking-tight text-text">{m.work_section()}</h2>
	</div>
	{#if work}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-xs text-text-muted">{m.currently_employed()}</span>
				<span
					class={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
						work.currentlyEmployed
							? 'bg-success/10 text-success-strong'
							: 'bg-border/50 text-text-muted'
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
				<div class="rounded-xl bg-bg p-3">
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
</section>
