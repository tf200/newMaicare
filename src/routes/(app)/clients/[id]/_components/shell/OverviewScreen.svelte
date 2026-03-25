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
		ArrowLeft,
		ChevronRight,
		ExternalLink,
		MessageSquare,
		Heart,
		Building2,
		CreditCard,
		FileCheck,
		Users
	} from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import CreateIncidentForm from '$lib/components/forms/CreateIncidentForm.svelte';
	import PutClientOutOfCareForm from '$lib/components/forms/PutClientOutOfCareForm.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { ClientOverviewViewModel } from '../../overview.shared';
	import OverviewNextSection from '../sections/OverviewNextSection.svelte';
	import OverviewAlertsSection from '../sections/OverviewAlertsSection.svelte';
	import OverviewProfileSection from '../sections/OverviewProfileSection.svelte';

	interface Props {
		overview: ClientOverviewViewModel;
	}

	let { overview }: Props = $props();
	const client = $derived(overview.client);
	const status = $derived(overview.status);
	const breadcrumbSectionLabel = $derived(overview.breadcrumbSectionLabel);
	const isWaitlistClient = $derived(status === 'on_waiting_list');
	const isInCareClient = $derived(status === 'in_care');
	const clientDisplayName = $derived(
		`${client.firstName} ${client.lastName}`.trim() || 'Client Detail'
	);
	let showPutOutOfCareForm = $state(false);
	let showCreateIncidentForm = $state(false);

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const openPutOutOfCareForm = () => {
		showPutOutOfCareForm = true;
	};

	const openCreateIncidentForm = () => {
		showCreateIncidentForm = true;
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return m.not_available_short();
		return new Date(dateString).toLocaleDateString(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const formatDayCount = (count: number) =>
		m.days_on_waitlist_value({
			count,
			unit: count === 1 ? m.day_lower() : m.days_lower()
		});

	const getDaysOnWaitlist = (dateString?: string) => {
		if (!dateString) return m.not_available_short();
		const waitlistDate = new Date(dateString);
		if (Number.isNaN(waitlistDate.getTime())) return m.not_available_short();

		const days = Math.max(0, Math.floor((Date.now() - waitlistDate.getTime()) / 86400000));
		return formatDayCount(days);
	};

	const statusLabels = {
		on_waiting_list: m.status_on_waiting_list(),
		scheduled_in_care: m.status_scheduled_in_care(),
		in_care: m.status_in_care(),
		scheduled_out_of_care: m.status_scheduled_out_of_care(),
		out_of_care: m.status_out_of_care()
	};

	const statusColors = {
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

	const prioritySolidColors = {
		high: 'bg-rose-500',
		medium: 'bg-orange-500',
		low: 'bg-blue-500'
	};
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<nav class="flex items-center gap-2 text-sm font-medium text-text-subtle">
			<a href="/clients" class="flex items-center gap-1 transition-colors hover:text-text">
				<ArrowLeft class="h-4 w-4" />
				{m.clients()}
			</a>
			<ChevronRight class="h-4 w-4" />
			<span class="text-text">{clientDisplayName}</span>
			{#if breadcrumbSectionLabel}
				<ChevronRight class="h-4 w-4" />
				<span class="text-text">{breadcrumbSectionLabel}</span>
			{/if}
		</nav>

		<div class="flex flex-wrap items-center justify-end gap-2">
			{#if !isWaitlistClient}
				{#if isInCareClient}
					<PermissionGuard permission="CLIENT.STATUS.UPDATE">
						<button
							type="button"
							onclick={openPutOutOfCareForm}
							class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-100"
						>
							<ShieldAlert class="h-4 w-4" />
							{m.put_out_of_care()}
						</button>
					</PermissionGuard>
				{/if}
				<button class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700">
					<MessageSquare class="h-4 w-4" />
					{m.new_progress_report()}
				</button>
				<button
					type="button"
					onclick={openCreateIncidentForm}
					class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
				>
					<ShieldAlert class="h-4 w-4" />
					{m.log_incident()}
				</button>
			{/if}
			<button class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700">
				<Target class="h-4 w-4" />
				{m.add_goal()}
			</button>
			<button class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700">
				<FileCheck class="h-4 w-4" />
				{m.upload_document()}
			</button>
			<button class="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-strong dark:text-zinc-900">
				<Plus class="h-4 w-4" />
				{m.edit_client()}
			</button>
		</div>
	</div>

	<header class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
		<div class="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-brand/5 to-transparent"></div>
		<div class="relative flex flex-col justify-between gap-8 p-8 lg:flex-row lg:items-center">
			<div class="flex items-center gap-6">
				<div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-3xl font-bold text-brand shadow-inner ring-1 ring-brand/10">
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
						<span class="flex items-center gap-1.5"><FileText class="h-4 w-4" />{client.fileNumber}</span>
						<span class="flex items-center gap-1.5"><Building2 class="h-4 w-4" />{client.locationName || m.no_location()}</span>
						<span class="flex items-center gap-1.5"><Heart class="h-4 w-4" />{client.careType || m.general_care()}</span>
						<span class="flex items-center gap-1.5 font-medium text-text"><User class="h-4 w-4 text-text-subtle" />{client.coordinator || m.unassigned()}</span>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap gap-4 border-t border-border/40 pt-6 lg:border-t-0 lg:pt-0">
				{#if isWaitlistClient}
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.waitlist_since()}</span>
						<span class="text-sm font-bold text-text">{formatDate(client.plannedInCareDate)}</span>
					</div>
					<div class="h-8 w-px bg-border lg:block"></div>
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.days_on_waitlist()}</span>
						<span class="text-sm font-bold text-text">{getDaysOnWaitlist(client.plannedInCareDate)}</span>
					</div>
				{:else}
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.last_evaluation_short()}</span>
						<span class="text-sm font-bold text-text">{formatDate(client.lastEvaluationDate)}</span>
					</div>
					<div class="h-8 w-px bg-border lg:block"></div>
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.next_evaluation_short()}</span>
						<span class="text-sm font-bold text-text">{formatDate(client.nextEvaluationDate)}</span>
					</div>
					<div class="h-8 w-px bg-border lg:block"></div>
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.start_date()}</span>
						<span class="text-sm font-bold text-text">{formatDate(client.plannedInCareDate)}</span>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
		{#each client.quickLinks as link, index (`${link.href}-${index}`)}
			<a href={link.href} class="group flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-4 text-center transition hover:border-brand/30 hover:shadow-md">
				<span class="text-2xl font-bold text-text group-hover:text-brand">{link.count}</span>
				<span class="mt-1 text-xs font-medium text-text-subtle group-hover:text-text">{link.label}</span>
			</a>
		{/each}
	</div>

	<div class="grid gap-6 xl:grid-cols-[1fr_380px]">
		<div class="space-y-6">
			<div class="grid gap-6 md:grid-cols-2">
				<OverviewNextSection {client} {status} />
				<OverviewAlertsSection alerts={client.alerts} />
			</div>

			<section class="rounded-3xl border border-border bg-surface shadow-sm">
				<div class="flex items-center justify-between border-b border-border/50 p-6">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
							<Target class="h-5 w-5" />
						</div>
						<h3 class="text-lg font-bold text-text">{m.top_care_goals()}</h3>
					</div>
					<button class="text-sm font-bold text-brand transition hover:underline">{m.view_all()}</button>
				</div>
				<div class="space-y-4 p-4 sm:p-6">
					{#if client.goals.length === 0}
						<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-zinc-50/50 px-6 py-12 text-center dark:bg-zinc-900/20">
							<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
								<Target class="h-6 w-6 text-zinc-400" />
							</div>
							<p class="text-sm font-medium text-text-subtle">{m.no_care_goals_yet()}</p>
							<p class="mt-1 text-xs text-text-muted">{m.care_goals_will_appear()}</p>
						</div>
					{:else}
						<div class="grid gap-3">
							{#each client.goals as goal, index (`${goal.title}-${index}`)}
								<article class="group relative overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm transition-all hover:border-brand/30 hover:shadow-md dark:bg-zinc-900/40">
									<div class={`absolute inset-y-0 left-0 w-1.5 ${prioritySolidColors[goal.priority]}`}></div>
									<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-8">
										<div class="min-w-0 flex-1">
											<p class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">{m.title()}</p>
											<p class="mt-1 truncate text-[15px] leading-tight font-bold text-text transition-colors group-hover:text-brand">{goal.title}</p>
										</div>
										<div class="sm:w-36 sm:border-l sm:border-border/40 sm:pl-6">
											<p class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">{m.priority()}</p>
											<span class={`mt-1 inline-flex rounded-full border px-2 py-1 text-[10px] font-black tracking-wide uppercase ${priorityColors[goal.priority]}`}>{goal.priority}</span>
										</div>
										<div class="sm:w-64 sm:border-l sm:border-border/40 sm:pl-6">
											<p class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">{m.topic()}</p>
											<p class="mt-1 text-xs leading-relaxed font-medium text-text-muted">{goal.progressNote || m.not_specified()}</p>
										</div>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-6 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
							<Clock class="h-5 w-5" />
						</div>
						<h3 class="text-lg font-bold text-text">{m.recent_activity()}</h3>
					</div>
				</div>

				<div class="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-0.5 before:bg-border/60">
					{#each client.timeline as item, index (`${item.link}-${index}`)}
						<div class="relative pl-12">
							<div class="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-sm ring-4 ring-surface dark:bg-zinc-900">
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
									<span class="text-[10px] font-medium text-text-subtle uppercase">{formatDate(item.date)}</span>
								</div>
								<p class="text-xs text-text-muted">{item.meta}</p>
								<a href={item.link} class="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline">
									{m.view_details()}
									<ExternalLink class="h-3 w-3" />
								</a>
							</div>
						</div>
					{/each}
				</div>
				<button class="mt-8 w-full rounded-xl border border-border bg-zinc-50 py-2.5 text-xs font-bold text-text-muted transition hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800">
					{m.load_full_history()}
				</button>
			</section>
		</div>

		<div class="space-y-6">
			<OverviewProfileSection {client} />

			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Users class="h-4 w-4 text-text-subtle" />
						<h3 class="font-bold text-text">{m.key_contacts()}</h3>
					</div>
					<button class="text-xs font-bold text-brand">{m.add()}</button>
				</div>
				<div class="space-y-3">
					{#each client.contacts as contact, index (`${contact.name}-${index}`)}
						<div class="rounded-2xl border border-border/50 bg-zinc-50/50 p-3 dark:bg-zinc-900/50">
							<div class="flex items-center justify-between">
								<p class="text-sm font-bold text-text">{contact.name}</p>
								{#if contact.primary}
									<span class="rounded bg-brand/10 px-1.5 py-0.5 text-[9px] font-black text-brand uppercase">{m.primary()}</span>
								{/if}
							</div>
							<p class="text-xs text-text-muted">{contact.relation}</p>
							<div class="mt-3 space-y-1.5 border-t border-border/40 pt-3">
								<div class="flex items-center gap-2 text-[11px]"><Phone class="h-3 w-3 text-text-subtle" /><span class="font-medium text-text-muted">{contact.phone || m.no_phone()}</span></div>
								<div class="flex items-center gap-2 text-[11px]"><Mail class="h-3 w-3 text-text-subtle" /><span class="truncate font-medium text-text-muted">{contact.email || m.no_email()}</span></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2"><FileCheck class="h-4 w-4 text-text-subtle" /><h3 class="font-bold text-text">{m.required_documents()}</h3></div>
				<div class="space-y-2">
					{#each client.documentsChecklist as doc, index (`${doc.label}-${index}`)}
						<div class="flex items-center justify-between rounded-xl border border-border/40 bg-white p-2.5 dark:bg-zinc-900/30">
							<span class="text-xs font-medium text-text-muted">{doc.label}</span>
							{#if doc.present}
								<CheckCircle2 class="h-4 w-4 text-emerald-500" />
							{:else}
								<div class="h-4 w-4 rounded-full border border-dashed border-border"></div>
							{/if}
						</div>
					{/each}
				</div>
				<button class="mt-4 w-full rounded-xl bg-zinc-100 py-2 text-xs font-bold text-text transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">{m.upload_document()}</button>
			</div>

			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2"><CreditCard class="h-4 w-4 text-text-subtle" /><h3 class="font-bold text-text">{m.financing_and_contract()}</h3></div>
				{#if client.contractSummary}
					<div class="space-y-4">
						<div class="flex items-center justify-between border-b border-border/40 pb-2"><span class="text-xs text-text-muted">{m.status()}</span><span class="text-xs font-bold text-emerald-600">{client.contractSummary.status}</span></div>
						<div class="flex items-center justify-between border-b border-border/40 pb-2"><span class="text-xs text-text-muted">{m.financing()}</span><span class="text-xs font-bold text-text">{client.contractSummary.financing}</span></div>
						{#if client.contractSummary.daysUntilContractEnd !== undefined}
							<div class="flex items-center justify-between border-b border-border/40 pb-2">
								<span class="text-xs text-text-muted">{m.contract_ends_in()}</span>
								<span class="text-xs font-bold text-text">
									{#if client.contractSummary.daysUntilContractEnd >= 0}
										{m.contract_days_remaining({ count: client.contractSummary.daysUntilContractEnd, unit: client.contractSummary.daysUntilContractEnd === 1 ? m.day_lower() : m.days_lower() })}
									{:else}
										{m.contract_expired_days_ago({ count: Math.abs(client.contractSummary.daysUntilContractEnd), unit: Math.abs(client.contractSummary.daysUntilContractEnd) === 1 ? m.day_lower() : m.days_lower() })}
									{/if}
								</span>
							</div>
						{/if}
						{#if client.contractSummary.outstandingInvoices}
							<div class="rounded-2xl bg-rose-50 p-3 dark:bg-rose-950/20">
								<div class="flex items-center justify-between"><span class="text-[10px] font-black text-rose-700 uppercase">{m.outstanding()}</span><span class="text-xs font-bold text-rose-800">{client.contractSummary.outstandingInvoices.amount}</span></div>
								<p class="mt-0.5 text-[10px] text-rose-600">{m.unpaid_invoices_count({ count: client.contractSummary.outstandingInvoices.count })}</p>
							</div>
						{/if}
					</div>
				{:else}
					<p class="text-sm text-text-subtle italic">{m.no_contract_data_available()}</p>
				{/if}
			</div>

			<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
				<div class="mb-5 flex items-center gap-2"><ListChecks class="h-4 w-4 text-text-subtle" /><h3 class="font-bold text-text">{m.intake_summary()}</h3></div>
				{#if client.intakeSummary}
					<div class="space-y-3">
						<div class="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/50"><p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.conclusion()}</p><p class="mt-1 text-xs font-medium text-text">{client.intakeSummary.conclusion}</p></div>
						<div class="flex items-center justify-between"><span class="text-xs text-text-muted">{m.self_reliance()}</span><span class="text-xs font-bold text-text">{client.intakeSummary.selfReliance}/100</span></div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div class="h-full bg-brand" style={`width: ${client.intakeSummary.selfReliance}%`}></div></div>
						<div class="mt-4">
							<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">{m.growth_areas()}</p>
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each client.intakeSummary.lowestTopics as topic, index (`${topic}-${index}`)}
									<span class="rounded-lg border border-border bg-white px-2 py-1 text-[10px] font-medium text-text-muted dark:bg-zinc-900">{topic}</span>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

{#if isInCareClient}
	<PutClientOutOfCareForm bind:open={showPutOutOfCareForm} clientId={client.id} onSuccess={() => invalidateAll()} />
{/if}

<CreateIncidentForm bind:open={showCreateIncidentForm} preselectedClientId={client.id} preselectedClientDisplay={`${client.firstName} ${client.lastName}`.trim()} onCreated={() => invalidateAll()} />
