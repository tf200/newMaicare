<script lang="ts">
	import { User, MapPin, Phone, Building2, Mail, IdCard } from 'lucide-svelte';
	import type { ClientOverviewData } from '../../overview.shared';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		client: ClientOverviewData;
	}

	let { client }: Props = $props();
</script>

<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5">
		<h2 class="text-lg font-semibold tracking-tight text-text">
			{m.client_profile()}
		</h2>
	</div>
	<div class="space-y-4">
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"
			>
				<User class="h-4 w-4" aria-hidden="true" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.gender_and_age()}
				</p>
				<p class="text-sm font-medium text-text">
					{client.gender ?? m.unknown()}, {client.age === null
						? m.not_available_short()
						: client.age === 1
							? m.age_year()
							: m.age_years({ age: client.age })}
				</p>
			</div>
		</div>
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info-strong"
			>
				<IdCard class="h-4 w-4" aria-hidden="true" />
			</div>
			<div>
				<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.bsn()}
				</p>
				<p class="text-sm font-medium text-text">{client.maskedBsn}</p>
				{#if client.bsnVerifiedByName}
					<p class="mt-0.5 text-xs text-text-muted">
						{m.bsn_verified_by()}
						{client.bsnVerifiedByName}
					</p>
				{:else}
					<p
						class="mt-0.5 inline-flex items-center gap-1 rounded-lg bg-error/10 px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-error-strong uppercase"
					>
						{m.unverified()}
					</p>
				{/if}
			</div>
		</div>
		<div class="flex items-start gap-3">
			<div
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning-strong"
			>
				<MapPin class="h-4 w-4" aria-hidden="true" />
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
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary-strong"
			>
				<Building2 class="h-4 w-4" aria-hidden="true" />
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
						<a
							href="tel:{client.phone}"
							class="flex min-h-8 items-center gap-1.5 rounded-lg text-xs text-text-muted hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
						>
							<Phone class="h-3 w-3 opacity-70" aria-hidden="true" />
							{client.phone}
						</a>
					{/if}
					{#if client.email}
						<a
							href="mailto:{client.email}"
							class="flex min-h-8 items-center gap-1.5 rounded-lg text-xs text-text-muted hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
						>
							<Mail class="h-3 w-3 opacity-70" aria-hidden="true" />
							{client.email}
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>
