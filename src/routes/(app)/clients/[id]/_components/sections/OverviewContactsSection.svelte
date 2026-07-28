<script lang="ts">
	import { Mail, Phone, Users } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { invalidate } from '$app/navigation';
	import CreateEmergencyContactModal from '$lib/components/forms/CreateEmergencyContactModal.svelte';
	import EmergencyContactsListModal from '$lib/components/modals/EmergencyContactsListModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { ClientOverviewContact } from '../../overview.shared';

	interface Props {
		clientId: string;
		contacts: ClientOverviewContact[];
	}

	let { clientId, contacts }: Props = $props();
	let showCreateModal = $state(false);
	let showListModal = $state(false);

	const visibleContacts = $derived(contacts.slice(0, 2));
</script>

<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Users class="h-4 w-4 text-brand" aria-hidden="true" />
			<h2 class="text-lg font-semibold tracking-tight text-text">{m.key_contacts()}</h2>
		</div>
		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				onclick={() => (showListModal = true)}
				class="px-2 text-xs text-brand"
			>
				{m.view_all()}
			</Button>
			<Button onclick={() => (showCreateModal = true)} class="px-3 text-xs">
				{m.add()}
			</Button>
		</div>
	</div>
	{#if contacts.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-bg px-6 py-10 text-center"
		>
			<div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
				<Users class="h-5 w-5 text-brand" aria-hidden="true" />
			</div>
			<p class="text-sm font-medium text-text">{m.no_key_contacts_title()}</p>
			<p class="mt-0.5 text-xs text-text-muted">{m.no_key_contacts_description()}</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each visibleContacts as contact (contact.id)}
				<div
					class="overflow-hidden rounded-2xl border border-border {contact.primary
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
					<div class="space-y-1.5 border-t border-border bg-bg px-3 py-2.5">
						{#if contact.phone}
							<a
								href="tel:{contact.phone}"
								class="flex min-h-8 items-center gap-2 rounded-lg text-xs text-text transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
							>
								<Phone class="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
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
								class="flex min-h-8 items-center gap-2 rounded-lg text-xs text-text transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
							>
								<Mail class="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
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
</section>

<CreateEmergencyContactModal
	bind:open={showCreateModal}
	{clientId}
	onCreated={() => invalidate(`app:client:${clientId}:detail`)}
/>

<EmergencyContactsListModal bind:open={showListModal} {clientId} />
