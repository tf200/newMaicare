<script lang="ts">
	import { Mail, Phone, Users } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewContact } from '$lib/mock/client-overview';

	interface Props {
		contacts: ClientOverviewContact[];
	}

	let { contacts }: Props = $props();
</script>

<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Users class="h-4 w-4 text-text-subtle" />
			<h3 class="font-bold text-text">{m.key_contacts()}</h3>
		</div>
		<button class="text-xs font-bold text-brand">{m.add()}</button>
	</div>
	<div class="space-y-3">
		{#each contacts as contact, index (`${contact.name}-${index}`)}
			<div class="rounded-2xl border border-border/50 bg-zinc-50/50 p-3 dark:bg-zinc-900/50">
				<div class="flex items-center justify-between gap-2">
					<p class="text-sm font-bold text-text">{contact.name}</p>
					{#if contact.primary}
						<span class="rounded bg-brand/10 px-1.5 py-0.5 text-[9px] font-black text-brand uppercase">
							{m.primary()}
						</span>
					{/if}
				</div>
				<p class="text-xs text-text-muted">{contact.relation}</p>
				<div class="mt-3 space-y-1.5 border-t border-border/40 pt-3">
					<div class="flex items-center gap-2 text-[11px]">
						<Phone class="h-3 w-3 text-text-subtle" />
						<span class="font-medium text-text-muted">{contact.phone || m.no_phone()}</span>
					</div>
					<div class="flex items-center gap-2 text-[11px]">
						<Mail class="h-3 w-3 text-text-subtle" />
						<span class="truncate font-medium text-text-muted">
							{contact.email || m.no_email()}
						</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
