<script lang="ts">
	import { User, MapPin, Phone, Building2, Mail, IdCard } from 'lucide-svelte';
	import type { ClientOverviewData } from '$lib/mock/client-overview';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		client: ClientOverviewData;
	}

	let { client }: Props = $props();

	const age = $derived(
		client.dateOfBirth
			? new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()
			: null
	);
</script>

<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center justify-between">
		<h3 class="text-[11px] font-bold tracking-[0.15em] text-text-subtle uppercase">
			{m.client_profile()}
		</h3>
		<button class="text-xs font-bold text-brand">{m.edit()}</button>
	</div>
	<div class="space-y-4">
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-strong"
			>
				<User class="h-4 w-4" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.gender_and_age()}
				</p>
				<p class="text-sm font-medium text-text">
					{client.gender}, {age}
					{m.years()}
				</p>
			</div>
		</div>
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-400"
			>
				<IdCard class="h-4 w-4" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.bsn()}
				</p>
				<p class="text-sm font-medium text-text">{client.maskedBsn}</p>
				{#if client.bsnVerifiedByName}
					<p class="mt-0.5 text-xs text-text-muted">
						{m.bsn_verified_by()} {client.bsnVerifiedByName}
					</p>
				{:else}
					<p class="mt-0.5 inline-flex items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-red-500 uppercase dark:bg-red-500/20 dark:text-red-400">
						{m.unverified()}
					</p>
				{/if}
			</div>
		</div>
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning"
			>
				<MapPin class="h-4 w-4" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.address()}
				</p>
				<p class="text-sm font-medium text-text">{client.address}</p>
				<p class="text-xs text-text-muted">{client.cityLine}</p>
			</div>
		</div>
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400"
			>
				<Building2 class="h-4 w-4" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.sender_referrer()}
				</p>
				<p class="text-sm font-bold text-text">
					{client.senderName || m.unknown_sender()}
				</p>
				<div class="mt-1 space-y-1">
					{#if client.phone}
						<p class="flex items-center gap-1.5 text-xs text-text-muted">
							<Phone class="h-3 w-3 opacity-70" />
							{client.phone}
						</p>
					{/if}
					{#if client.email}
						<p class="flex items-center gap-1.5 text-xs text-text-muted">
							<Mail class="h-3 w-3 opacity-70" />
							{client.email}
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
