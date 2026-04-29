<script lang="ts">
	import { GraduationCap } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewData } from '$lib/mock/client-overview';

	interface Props {
		education: ClientOverviewData['education'];
	}

	let { education }: Props = $props();
</script>

<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center gap-2">
		<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
			<GraduationCap class="h-3.5 w-3.5" />
		</div>
		<h3 class="font-bold text-text">{m.education_section()}</h3>
	</div>
	{#if education}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-xs text-text-muted">{m.currently_enrolled()}</span>
				<span
					class={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
						education.currentlyEnrolled
							? 'bg-emerald-500/10 text-emerald-700'
							: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
					}`}
				>
					{education.currentlyEnrolled ? m.yes() : m.no()}
				</span>
			</div>

			{#if education.institution}
				<div>
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.institution()}
					</p>
					<p class="mt-0.5 text-sm font-medium text-text">{education.institution}</p>
				</div>
			{/if}

			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.level()}
				</p>
				<p class="mt-0.5 text-sm font-medium text-text">{education.level}</p>
			</div>

			{#if education.mentorName}
				<div>
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.mentor()}
					</p>
					<p class="mt-0.5 text-sm font-medium text-text">{education.mentorName}</p>
					<div class="mt-1 space-y-0.5">
						{#if education.mentorPhone}
							<p class="flex items-center gap-1.5 text-xs text-text-muted">
								<span class="opacity-70">{m.phone()}:</span>
								{education.mentorPhone}
							</p>
						{/if}
						{#if education.mentorEmail}
							<p class="flex items-center gap-1.5 text-xs text-text-muted">
								<span class="opacity-70">{m.email()}:</span>
								{education.mentorEmail}
							</p>
						{/if}
					</div>
				</div>
			{/if}

			{#if education.additionalNotes}
				<div class="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.additional_notes()}
					</p>
					<p class="mt-1 text-xs text-text">{education.additionalNotes}</p>
				</div>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-text-muted">{m.not_available()}</p>
	{/if}
</div>
