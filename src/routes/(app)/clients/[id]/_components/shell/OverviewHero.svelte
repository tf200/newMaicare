<script lang="ts">
	import { Building2, FileText, Heart, User } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewData, ClientOverviewStatus } from '$lib/mock/client-overview';

	interface Props {
		client: ClientOverviewData;
		status: ClientOverviewStatus;
	}

	let { client, status }: Props = $props();

	const statusLabels: Record<ClientOverviewStatus, string> = {
		on_waiting_list: m.status_on_waiting_list(),
		scheduled_in_care: m.status_scheduled_in_care(),
		in_care: m.status_in_care(),
		scheduled_out_of_care: m.status_scheduled_out_of_care(),
		out_of_care: m.status_out_of_care()
	};

	const statusColors: Record<ClientOverviewStatus, string> = {
		on_waiting_list: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
		scheduled_in_care: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
		in_care: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
		scheduled_out_of_care: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
		out_of_care: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20'
	};
</script>

<header class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
	<div class="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-brand/5 to-transparent"></div>
	<div class="relative flex flex-col gap-8 p-8 lg:flex-row lg:items-center lg:justify-between">
		<div class="flex items-center gap-6">
			<div
				class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-3xl font-bold text-brand shadow-inner ring-1 ring-brand/10"
			>
				{client.firstName[0]}{client.lastName[0]}
			</div>
			<div>
				<div class="flex flex-wrap items-center gap-3">
					<h1 class="text-3xl font-bold tracking-tight text-text">{client.firstName} {client.lastName}</h1>
					<span class={`rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase ${statusColors[status]}`}>
						{statusLabels[status]}
					</span>
				</div>
				<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-subtle">
					<span class="flex items-center gap-1.5">
						<FileText class="h-4 w-4" />
						{client.fileNumber}
					</span>
					<span class="flex items-center gap-1.5">
						<Building2 class="h-4 w-4" />
						{client.locationName || m.no_location()}
					</span>
					<span class="flex items-center gap-1.5">
						<Heart class="h-4 w-4" />
						{client.careType || m.general_care()}
					</span>
					<span class="flex items-center gap-1.5 font-medium text-text">
						<User class="h-4 w-4 text-text-subtle" />
						{client.coordinator || m.unassigned()}
					</span>
				</div>
			</div>
		</div>

		<div class="max-w-md rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-zinc-900/60">
			<p class="text-[11px] font-bold tracking-[0.18em] text-text-subtle uppercase">Lifecycle Overview</p>
			<p class="mt-2 text-sm leading-6 text-text-muted">
				This page now keeps one stable overview layout and moves status-specific context into a focused lifecycle panel below.
			</p>
		</div>
	</div>
</header>
