<script lang="ts">
	import {
		User,
		Activity,
		FileText,
		ShieldAlert,
		CheckCircle2,
		Target,
		ListChecks,
		Plus,
		Clock,
		Phone,
		Mail,
		ChevronRight,
		ExternalLink,
		MessageSquare,
		Heart,
		Building2,
		CreditCard,
		FileCheck,
		Users
	} from 'lucide-svelte';
	import type { ClientOverviewData, ClientOverviewStatus } from '$lib/mock/client-overview';
	import WhatNextCard from './WhatNextCard.svelte';
	import AlertsCard from './AlertsCard.svelte';
	import ProfileCard from './ProfileCard.svelte';

	interface Props {
		client: ClientOverviewData;
		status: ClientOverviewStatus;
	}

	let { client, status }: Props = $props();

	// --- Helpers ---
	const formatDate = (dateString?: string) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const statusLabels: Record<ClientOverviewStatus, string> = {
		on_waiting_list: 'On Waiting List',
		scheduled_in_care: 'Scheduled In Care',
		in_care: 'In Care',
		scheduled_out_of_care: 'Scheduled Out of Care',
		out_of_care: 'Out of Care'
	};

	const statusColors: Record<ClientOverviewStatus, string> = {
		on_waiting_list: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
		scheduled_in_care: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
		in_care: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
		scheduled_out_of_care: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
		out_of_care: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/20'
	};

	const priorityColors = {
		high: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
		medium: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
		low: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
	};
</script>

<div class="space-y-6">
	<!-- Breadcrumbs & Actions -->
	<div class="flex items-center justify-between">
		<nav class="flex items-center gap-2 text-sm font-medium text-text-subtle">
			<a href="/in-care" class="transition-colors hover:text-text">Clients</a>
			<ChevronRight class="h-4 w-4" />
			<span class="text-text">{client.firstName} {client.lastName}</span>
		</nav>

		<div class="flex flex-wrap items-center justify-end gap-2">
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
			>
				<MessageSquare class="h-4 w-4" />
				New progress report
			</button>
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
			>
				<ShieldAlert class="h-4 w-4" />
				Log incident
			</button>
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
			>
				<Target class="h-4 w-4" />
				Add goal
			</button>
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
			>
				<FileCheck class="h-4 w-4" />
				Upload document
			</button>
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-strong dark:text-zinc-900"
			>
				<Plus class="h-4 w-4" />
				Edit client
			</button>
		</div>
	</div>

	<!-- Hero Header -->
	<header class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
		<div
			class="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-brand/5 to-transparent"
		></div>
		<div class="relative flex flex-col justify-between gap-8 p-8 lg:flex-row lg:items-center">
			<div class="flex items-center gap-6">
				<div
					class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-3xl font-bold text-brand shadow-inner ring-1 ring-brand/10"
				>
					{client.firstName[0]}{client.lastName[0]}
				</div>
				<div>
					<div class="flex flex-wrap items-center gap-3">
						<h1 class="text-3xl font-bold tracking-tight text-text">
							{client.firstName}
							{client.lastName}
						</h1>
						<span
							class={`rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase ${statusColors[status]}`}
						>
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
							{client.locationName || 'No location'}
						</span>
						<span class="flex items-center gap-1.5">
							<Heart class="h-4 w-4" />
							{client.careType || 'General Care'}
						</span>
						<span class="flex items-center gap-1.5 font-medium text-text">
							<User class="h-4 w-4 text-text-subtle" />
							{client.coordinator || 'Unassigned'}
						</span>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap gap-4 border-t border-border/40 pt-6 lg:border-t-0 lg:pt-0">
				<div class="flex flex-col">
					<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
						>Last Eval</span
					>
					<span class="text-sm font-bold text-text">{formatDate(client.lastEvaluationDate)}</span>
				</div>
				<div class="h-8 w-px bg-border lg:block"></div>
				<div class="flex flex-col">
					<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
						>Next Eval</span
					>
					<span class="text-sm font-bold text-text">{formatDate(client.nextEvaluationDate)}</span>
				</div>
				<div class="h-8 w-px bg-border lg:block"></div>
				<div class="flex flex-col">
					<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
						>Start Date</span
					>
					<span class="text-sm font-bold text-text">{formatDate(client.plannedInCareDate)}</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Quick Links -->
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
		{#each client.quickLinks as link}
			<a
				href={link.href}
				class="group flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-4 text-center transition hover:border-brand/30 hover:shadow-md"
			>
				<span class="text-2xl font-bold text-text group-hover:text-brand">{link.count}</span>
				<span class="mt-1 text-xs font-medium text-text-subtle group-hover:text-text"
					>{link.label}</span
				>
			</a>
		{/each}
	</div>

	<!-- Main Grid -->
	<div class="grid gap-6 xl:grid-cols-[1fr_380px]">
		<!-- Left Column -->
		<div class="space-y-6">
			<!-- What's Next & Alerts -->
			<div class="grid gap-6 md:grid-cols-2">
				<WhatNextCard {client} {status} />
				<AlertsCard alerts={client.alerts} />
			</div>

			<!-- Goals Snapshot -->
			<section class="rounded-3xl border border-border bg-surface shadow-sm">
				<div class="flex items-center justify-between border-b border-border/50 p-6">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600"
						>
							<Target class="h-5 w-5" />
						</div>
						<h3 class="text-lg font-bold text-text">Top Care Goals</h3>
					</div>
					<button class="text-sm font-bold text-brand transition hover:underline">View All</button>
				</div>
				<div class="divide-y divide-border/40">
					{#each client.goals as goal}
						<div class="p-6 transition hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<p class="text-sm font-bold text-text">{goal.title}</p>
										<span
											class={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${priorityColors[goal.priority]}`}
										>
											{goal.priority}
										</span>
									</div>
									{#if goal.progressNote}
										<p class="mt-1 text-xs text-text-muted italic">"{goal.progressNote}"</p>
									{/if}
								</div>
								<div class="flex shrink-0 items-center gap-1.5">
									<div class="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
										<div class="h-full w-2/3 bg-orange-500"></div>
									</div>
									<span class="text-[10px] font-bold text-text">66%</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Activity Timeline -->
			<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-6 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"
						>
							<Clock class="h-5 w-5" />
						</div>
						<h3 class="text-lg font-bold text-text">Recent Activity</h3>
					</div>
				</div>

				<div
					class="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-0.5 before:bg-border/60"
				>
					{#each client.timeline as item}
						<div class="relative pl-12">
							<div
								class="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-sm ring-4 ring-surface dark:bg-zinc-900"
							>
								{#if item.type === 'report'}
									<FileText class="h-4 w-4 text-brand" />
								{:else if item.type === 'incident'}
									<ShieldAlert class="h-4 w-4 text-rose-500" />
								{:else if item.type === 'evaluation'}
									<CheckCircle2 class="h-4 w-4 text-emerald-500" />
								{:else}
									<Activity class="h-4 w-4 text-blue-500" />
								{/if}
							</div>
							<div class="flex flex-col gap-1">
								<div class="flex items-center justify-between gap-2">
									<p class="text-sm font-bold text-text">{item.title}</p>
									<span class="text-[10px] font-medium text-text-subtle uppercase"
										>{formatDate(item.date)}</span
									>
								</div>
								<p class="text-xs text-text-muted">{item.meta}</p>
								<a
									href={item.link}
									class="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
								>
									View Details <ExternalLink class="h-3 w-3" />
								</a>
							</div>
						</div>
					{/each}
				</div>
				<button
					class="mt-8 w-full rounded-xl border border-border bg-zinc-50 py-2.5 text-xs font-bold text-text-muted transition hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
				>
					Load full history
				</button>
			</section>
		</div>

		<!-- Right Column -->
		<div class="space-y-6">
			<ProfileCard {client} />

			<!-- Key Contacts -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Users class="h-4 w-4 text-text-subtle" />
						<h3 class="font-bold text-text">Key Contacts</h3>
					</div>
					<button class="text-xs font-bold text-brand">Add</button>
				</div>
				<div class="space-y-3">
					{#each client.contacts as contact}
						<div class="rounded-2xl border border-border/50 bg-zinc-50/50 p-3 dark:bg-zinc-900/50">
							<div class="flex items-center justify-between">
								<p class="text-sm font-bold text-text">{contact.name}</p>
								{#if contact.primary}
									<span
										class="rounded bg-brand/10 px-1.5 py-0.5 text-[9px] font-black text-brand uppercase"
										>Primary</span
									>
								{/if}
							</div>
							<p class="text-xs text-text-muted">{contact.relation}</p>
							<div class="mt-2 flex items-center gap-3">
								<button
									class="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-border hover:bg-zinc-50 dark:bg-zinc-800"
								>
									<Phone class="h-3 w-3 text-text-subtle" />
								</button>
								<button
									class="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-border hover:bg-zinc-50 dark:bg-zinc-800"
								>
									<Mail class="h-3 w-3 text-text-subtle" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Documents Checklist -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2">
					<FileCheck class="h-4 w-4 text-text-subtle" />
					<h3 class="font-bold text-text">Required Documents</h3>
				</div>
				<div class="space-y-2">
					{#each client.documentsChecklist as doc}
						<div
							class="flex items-center justify-between rounded-xl border border-border/40 bg-white p-2.5 dark:bg-zinc-900/30"
						>
							<span class="text-xs font-medium text-text-muted">{doc.label}</span>
							{#if doc.present}
								<CheckCircle2 class="h-4 w-4 text-emerald-500" />
							{:else}
								<div class="h-4 w-4 rounded-full border border-dashed border-border"></div>
							{/if}
						</div>
					{/each}
				</div>
				<button
					class="mt-4 w-full rounded-xl bg-zinc-100 py-2 text-xs font-bold text-text transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
				>
					Upload Document
				</button>
			</div>

			<!-- Contract & Finance -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2">
					<CreditCard class="h-4 w-4 text-text-subtle" />
					<h3 class="font-bold text-text">Financing & Contract</h3>
				</div>
				{#if client.contractSummary}
					<div class="space-y-4">
						<div class="flex items-center justify-between border-b border-border/40 pb-2">
							<span class="text-xs text-text-muted">Status</span>
							<span class="text-xs font-bold text-emerald-600">{client.contractSummary.status}</span
							>
						</div>
						<div class="flex items-center justify-between border-b border-border/40 pb-2">
							<span class="text-xs text-text-muted">Financing</span>
							<span class="text-xs font-bold text-text">{client.contractSummary.financing}</span>
						</div>
						{#if client.contractSummary.outstandingInvoices}
							<div class="rounded-2xl bg-rose-50 p-3 dark:bg-rose-950/20">
								<div class="flex items-center justify-between">
									<span class="text-[10px] font-black text-rose-700 uppercase">Outstanding</span>
									<span class="text-xs font-bold text-rose-800"
										>{client.contractSummary.outstandingInvoices.amount}</span
									>
								</div>
								<p class="mt-0.5 text-[10px] text-rose-600">
									{client.contractSummary.outstandingInvoices.count} unpaid invoices
								</p>
							</div>
						{/if}
					</div>
				{:else}
					<p class="text-sm text-text-subtle italic">No contract data available</p>
				{/if}
			</div>

			<!-- Intake Snapshot -->
			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2">
					<ListChecks class="h-4 w-4 text-text-subtle" />
					<h3 class="font-bold text-text">Intake Summary</h3>
				</div>
				{#if client.intakeSummary}
					<div class="space-y-3">
						<div class="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
							<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
								Conclusion
							</p>
							<p class="mt-1 text-xs font-medium text-text">{client.intakeSummary.conclusion}</p>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-xs text-text-muted">Self-reliance</span>
							<span class="text-xs font-bold text-text"
								>{client.intakeSummary.selfReliance}/100</span
							>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
							<div
								class="h-full bg-brand"
								style="width: {client.intakeSummary.selfReliance}%"
							></div>
						</div>
						<div class="mt-4">
							<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
								Growth Areas
							</p>
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each client.intakeSummary.lowestTopics as topic}
									<span
										class="rounded-lg border border-border bg-white px-2 py-1 text-[10px] font-medium text-text-muted dark:bg-zinc-900"
									>
										{topic}
									</span>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
