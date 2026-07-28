<script lang="ts">
	import { GraduationCap } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewData } from '../../overview.shared';

	interface Props {
		education: ClientOverviewData['education'];
	}

	let { education }: Props = $props();
</script>

<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center gap-2">
		<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info-strong">
			<GraduationCap class="h-4 w-4" aria-hidden="true" />
		</div>
		<h2 class="text-lg font-semibold tracking-tight text-text">{m.education_section()}</h2>
	</div>
	{#if education}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-xs text-text-muted">{m.currently_enrolled()}</span>
				<span
					class={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
						education.currentlyEnrolled
							? 'bg-success/10 text-success-strong'
							: 'bg-border/50 text-text-muted'
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
				<div class="rounded-xl bg-bg p-3">
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
</section>
