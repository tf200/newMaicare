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
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import type { ClientTimelineItem } from '../../overview.shared';
	import { formatOverviewDate } from '../overview-date';

	interface Props {
		clientId: string;
		timeline: ClientTimelineItem[];
	}

	let { clientId, timeline }: Props = $props();

	const formatDate = (dateString?: string) =>
		formatOverviewDate(dateString, getLocale(), m.not_available_short());

	const getTimelineHref = (item: ClientTimelineItem) => {
		if (item.type === 'report')
			return localizeHref(resolve('/(app)/clients/[id]/reports', { id: clientId }));
		if (item.type === 'evaluation')
			return localizeHref(resolve('/(app)/clients/[id]/goals', { id: clientId }));
		if (item.type === 'document')
			return localizeHref(resolve('/(app)/clients/[id]/documents', { id: clientId }));
		return null;
	};
</script>

<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info-strong"
			>
				<Clock class="h-5 w-5" aria-hidden="true" />
			</div>
			<h2 class="text-lg font-semibold tracking-tight text-text">{m.recent_activity()}</h2>
		</div>
	</div>

	{#if timeline.length > 0}
		<div
			class="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-0.5 before:bg-border"
		>
			{#each timeline as item (item.id)}
				{@const href = getTimelineHref(item)}
				<div class="relative pl-12">
					<div
						class="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-sm ring-4 ring-surface"
					>
						{#if item.type === 'report'}
							<FileText class="h-4 w-4 text-brand" aria-hidden="true" />
						{:else if item.type === 'incident'}
							<ShieldAlert class="h-4 w-4 text-error-strong" aria-hidden="true" />
						{:else if item.type === 'evaluation'}
							<CheckCircle2 class="h-4 w-4 text-success-strong" aria-hidden="true" />
						{:else}
							<Activity class="h-4 w-4 text-info-strong" aria-hidden="true" />
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
						{#if href}
							<!-- href is built exclusively with resolve() and localizeHref(). -->
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<a
								{href}
								data-sveltekit-preload-data="hover"
								class="mt-1 inline-flex min-h-8 items-center gap-1 rounded-lg text-[11px] font-bold text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
							>
								{m.view_details()}
								<ExternalLink class="h-3 w-3" aria-hidden="true" />
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-text-muted">{m.no_recent_activity()}</p>
	{/if}
</section>
