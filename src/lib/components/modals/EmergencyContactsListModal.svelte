<script lang="ts">
	import { Mail, Phone, Users, Shield, MapPin } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { listClientEmergencyContacts } from '$lib/api/clients';
	import type { CreateClientEmergencyContactResponse } from '$lib/types/api';
	import Modal from '$lib/components/ui/Modal.svelte';

	interface Props {
		open?: boolean;
		clientId: string;
	}

	let { open = $bindable(false), clientId }: Props = $props();

	let contacts = $state<CreateClientEmergencyContactResponse[]>([]);
	let loading = $state(false);
	let error = $state('');
	let search = $state('');
	let totalCount = $state(0);
	let page = $state(1);
	let hasMore = $state(false);
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	const pageSize = 10;

	async function fetchContacts() {
		loading = true;
		error = '';
		try {
			const response = await listClientEmergencyContacts(clientId, {
				page,
				page_size: pageSize,
				search: search.trim() || undefined
			});
			const data = response.data;
			contacts = data.results;
			totalCount = data.count;
			hasMore = data.next != null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load contacts';
		} finally {
			loading = false;
		}
	}

	function scheduleSearch() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			page = 1;
			void fetchContacts();
		}, 300);
	}

	function nextPage() {
		page++;
		void fetchContacts();
	}

	function prevPage() {
		page = Math.max(1, page - 1);
		void fetchContacts();
	}

	$effect(() => {
		if (open) {
			page = 1;
			search = '';
			void fetchContacts();
		}
	});

	const displayName = (contact: CreateClientEmergencyContactResponse) =>
		[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
</script>

<Modal
	bind:open
	title={m.key_contacts()}
	description={`${totalCount} ${m.contacts().toLowerCase()}`}
	class="max-w-2xl"
>
	<div class="space-y-4">
		<input
			type="text"
			bind:value={search}
			oninput={scheduleSearch}
			placeholder={m.search_placeholder_short()}
			class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-hidden transition placeholder:text-text-muted focus:ring-2 focus:ring-brand/20"
		/>

		{#if loading}
			<div class="space-y-3">
				{#each Array(3) as _, i (i)}
					<div class="animate-pulse rounded-2xl border border-border/50 bg-surface p-4">
						<div class="flex items-center gap-3">
							<div class="h-10 w-10 rounded-full bg-border/70"></div>
							<div class="space-y-2">
								<div class="h-4 w-32 rounded bg-border/70"></div>
								<div class="h-3 w-24 rounded bg-border/70"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if error}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{error}
			</div>
		{:else if contacts.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-bg px-6 py-10 text-center"
			>
				<div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
					<Users class="h-5 w-5 text-brand/60" />
				</div>
				<p class="text-sm font-medium text-text-subtle">{m.no_results()}</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each contacts as contact (contact.id)}
					<div class="overflow-hidden rounded-2xl border border-border/50">
						<div class="p-4">
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand"
									>
										{contact.first_name?.[0] ?? ''}{contact.last_name?.[0] ?? ''}
									</div>
									<div>
										<p class="text-sm font-bold text-text">{displayName(contact)}</p>
										{#if contact.relationship}
											<p class="text-xs text-text-muted">{contact.relationship}</p>
										{/if}
									</div>
								</div>
								{#if contact.is_verified}
									<span
										class="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase"
									>
										<Shield class="h-3 w-3" />
										{m.verified()}
									</span>
								{/if}
							</div>
						</div>
						<div
							class="space-y-1.5 border-t border-border/40 bg-brand/[0.02] px-4 py-3 dark:bg-brand/[0.03]"
						>
							{#if contact.phone_number}
								<a
									href="tel:{contact.phone_number}"
									class="flex items-center gap-2 text-xs text-text transition hover:text-brand"
								>
									<Phone class="h-3.5 w-3.5 text-text-muted" />
									<span class="font-medium">{contact.phone_number}</span>
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
							{#if contact.address}
								<div class="flex items-center gap-2 text-xs text-text">
									<MapPin class="h-3.5 w-3.5 text-text-muted" />
									<span class="font-medium">{contact.address}</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			{#if totalCount > pageSize}
				<div class="flex items-center justify-between pt-2">
					<p class="text-xs text-text-muted">
						{Math.min((page - 1) * pageSize + 1, totalCount)}–{Math.min(
							page * pageSize,
							totalCount
						)} of {totalCount}
					</p>
					<div class="flex gap-2">
						<button
							onclick={prevPage}
							disabled={page <= 1}
							class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-zinc-50 disabled:opacity-40 dark:hover:bg-zinc-800"
						>
							{m.previous()}
						</button>
						<button
							onclick={nextPage}
							disabled={!hasMore}
							class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-zinc-50 disabled:opacity-40 dark:hover:bg-zinc-800"
						>
							{m.next()}
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</Modal>
