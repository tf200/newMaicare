<script lang="ts">
	import {
		Activity,
		CheckCircle2,
		Clock,
		ExternalLink,
		FileText,
		ShieldAlert
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { ClientTimelineItem } from '$lib/mock/client-overview';
	import { formatOverviewDate } from '../overview-date';

	interface Props {
		timeline: ClientTimelineItem[];
	}

	let { timeline }: Props = $props();

	const formatDate = (dateString?: string) =>
		formatOverviewDate(dateString, getLocale(), m.not_available_short());
</script>

<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"
			>
				<Clock class="h-5 w-5" />
			</div>
			<h3 class="text-lg font-bold text-text">{m.recent_activity()}</h3>
		</div>
	</div>

	<div
		class="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-0.5 before:bg-border/60"
	>
		{#each timeline as item, index (`${item.link}-${index}`)}
			<div class="relative pl-12">
				<div
					class="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-sm ring-4 ring-surface dark:bg-zinc-900"
				>
					{#if item.type === 'report'}
						<FileText class="h-4 w-4 text-brand" />
					{:else if item.type === 'incident'}
						<ShieldAlert class="h-4 w-4 text-rose-500" />
					{:else if item.type === 'evaluation'}
						<CheckCircle2 class="h-4 w-4 text-emerald-500" />
					{:else}
						<Activity class="h-4 w-4 text-blue-500" />
					{/if}
				</div>
				<div class="flex flex-col gap-1">
					<div class="flex items-center justify-between gap-2">
						<p class="text-sm font-bold text-text">{item.title}</p>
						<span class="text-[10px] font-medium text-text-subtle uppercase">
							{formatDate(item.date)}
						</span>
					</div>
					<p class="text-xs text-text-muted">{item.meta}</p>
					<a
						href={item.link}
						class="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
					>
						{m.view_details()}
						<ExternalLink class="h-3 w-3" />
					</a>
				</div>
			</div>
		{/each}
	</div>
	<button
		class="mt-8 w-full rounded-xl border border-border bg-zinc-50 py-2.5 text-xs font-bold text-text-muted transition hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
	>
		{m.load_full_history()}
	</button>
</section>
