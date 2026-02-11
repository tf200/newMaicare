<script lang="ts">
	import { User, MapPin, Phone, Building2, Mail } from 'lucide-svelte';
	import type { ClientOverviewData } from '$lib/mock/client-overview';

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
		<h3 class="font-bold text-text">Client Profile</h3>
		<button class="text-xs font-bold text-brand">Edit</button>
	</div>
	<div class="space-y-4">
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-900"
			>
				<User class="h-4 w-4" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">Gender & Age</p>
				<p class="text-sm font-medium text-text">
					{client.gender}, {age} years
				</p>
			</div>
		</div>
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-900"
			>
				<MapPin class="h-4 w-4" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">Address</p>
				<p class="text-sm font-medium text-text">{client.address}</p>
				<p class="text-xs text-text-muted">{client.cityLine}</p>
			</div>
		</div>
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-900"
			>
				<Building2 class="h-4 w-4" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					Sender / Referrer
				</p>
				<p class="text-sm font-bold text-text">{client.senderName || 'Unknown Sender'}</p>
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
