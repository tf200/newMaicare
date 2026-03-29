<script lang="ts">
	import { Mail, Phone, Users } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { invalidateAll } from '$app/navigation';
	import CreateEmergencyContactModal from '$lib/components/forms/CreateEmergencyContactModal.svelte';
	import EmergencyContactsListModal from '$lib/components/modals/EmergencyContactsListModal.svelte';
	import type { ClientOverviewContact } from '$lib/mock/client-overview';

	interface Props {
		clientId: string;
		contacts: ClientOverviewContact[];
	}

	let { clientId, contacts }: Props = $props();
	let showCreateModal = $state(false);
	let showListModal = $state(false);

	const visibleContacts = $derived(contacts.slice(0, 2));
</script>

<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Users class="h-4 w-4 text-brand/60" />
			<h3 class="font-bold text-text">{m.key_contacts()}</h3>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={() => (showListModal = true)}
				class="text-xs font-bold text-brand transition hover:underline"
			>
				{m.view_all()}
			</button>
			<button
				onclick={() => (showCreateModal = true)}
				class="rounded-lg bg-brand px-3 py-1 text-xs font-bold text-white transition hover:bg-brand-strong dark:text-zinc-900"
			>
				{m.add()}
			</button>
		</div>
	</div>
	{#if contacts.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-bg px-6 py-10 text-center"
		>
			<div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
				<Users class="h-5 w-5 text-brand/60" />
			</div>
			<p class="text-sm font-medium text-text-subtle">{m.empty_general_title()}</p>
			<p class="mt-0.5 text-xs text-text-muted">{m.empty_general_description()}</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each visibleContacts as contact (contact.id)}
				<div
					class="overflow-hidden rounded-2xl border border-border/50 {contact.primary
						? 'border-brand/20 ring-1 ring-brand/10'
						: ''}"
				>
					<div class="p-3">
						<div class="flex items-center justify-between gap-2">
							<p class="text-sm font-bold text-text">{contact.name}</p>
							{#if contact.primary}
								<span
									class="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand uppercase"
								>
									{m.primary()}
								</span>
							{/if}
						</div>
						<p class="text-xs text-text-muted">{contact.relation}</p>
					</div>
					<div
						class="space-y-1.5 border-t border-border/40 bg-brand/[0.02] px-3 py-2.5 dark:bg-brand/[0.03]"
					>
						{#if contact.phone}
							<a
								href="tel:{contact.phone}"
								class="flex items-center gap-2 text-xs text-text transition hover:text-brand"
							>
								<Phone class="h-3.5 w-3.5 text-text-muted" />
								<span class="font-medium">{contact.phone}</span>
							</a>
						{:else}
							<div class="flex items-center gap-2 text-xs text-text-subtle">
								<Phone class="h-3.5 w-3.5" />
								<span class="font-medium">{m.no_phone()}</span>
							</div>
						{/if}
						{#if contact.email}
							<a
								href="mailto:{contact.email}"
								title={contact.email}
								class="flex items-center gap-2 text-xs text-text transition hover:text-brand"
							>
								<Mail class="h-3.5 w-3.5 text-text-muted" />
								<span class="truncate font-medium">{contact.email}</span>
							</a>
						{:else}
							<div class="flex items-center gap-2 text-xs text-text-subtle">
								<Mail class="h-3.5 w-3.5" />
								<span class="font-medium">{m.no_email()}</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<CreateEmergencyContactModal
	bind:open={showCreateModal}
	{clientId}
	onCreated={() => invalidateAll()}
/>

<EmergencyContactsListModal bind:open={showListModal} {clientId} />
