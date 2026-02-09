<script lang="ts">
	import { User, MapPin, Phone } from 'lucide-svelte';
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
				<Phone class="h-4 w-4" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">Contact</p>
				<p class="text-sm font-medium text-text">{client.phone || 'No phone'}</p>
				<p class="text-xs text-text-muted">{client.email || 'No email'}</p>
			</div>
		</div>
	</div>
</div>
