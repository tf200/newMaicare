<script lang="ts">
	import {
		User,
		FileText,
		ShieldAlert,
		Target,
		Plus,
		ArrowLeft,
		ChevronRight,
		MessageSquare,
		Heart,
		Building2,
	} from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import CreateIncidentForm from '$lib/components/forms/CreateIncidentForm.svelte';
	import CreateProgressReportModal from '$lib/components/forms/CreateProgressReportModal.svelte';
	import EditClientForm from '$lib/components/forms/EditClientForm.svelte';
	import PutClientOutOfCareForm from '$lib/components/forms/PutClientOutOfCareForm.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { ClientOverviewViewModel } from '../../overview.shared';
	import { formatOverviewDate } from '../overview-date';
	import OverviewMainColumn from '../sections/OverviewMainColumn.svelte';
	import OverviewSidebar from '../sections/OverviewSidebar.svelte';

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
	let showCreateProgressReportModal = $state(false);
	let showEditClientForm = $state(false);
	const openPutOutOfCareForm = () => {
		showPutOutOfCareForm = true;
	};

	const openCreateIncidentForm = () => {
		showCreateIncidentForm = true;
	};

	const openCreateProgressReportModal = () => {
		showCreateProgressReportModal = true;
	};

	const openEditClientForm = () => {
		showEditClientForm = true;
	};

	const formatDate = (dateString?: string) =>
		formatOverviewDate(dateString, getLocale(), m.not_available_short());

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
				<button
					type="button"
					onclick={openCreateProgressReportModal}
					class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
				>
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
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
			>
				<Target class="h-4 w-4" />
				{m.add_goal()}
			</button>
			<button
				onclick={openEditClientForm}
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-strong dark:text-zinc-900"
			>
				<Plus class="h-4 w-4" />
				{m.edit_client()}
			</button>
		</div>
	</div>

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
						<span class="flex items-center gap-1.5"
							><FileText class="h-4 w-4" />{client.fileNumber}</span
						>
						<span class="flex items-center gap-1.5"
							><Building2 class="h-4 w-4" />{client.locationName || m.no_location()}</span
						>
						<span class="flex items-center gap-1.5"
							><Heart class="h-4 w-4" />{client.careType || m.general_care()}</span
						>
						<span class="flex items-center gap-1.5 font-medium text-text"
							><User class="h-4 w-4 text-text-subtle" />{client.coordinator || m.unassigned()}</span
						>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap gap-4 border-t border-border/40 pt-6 lg:border-t-0 lg:pt-0">
				{#if isWaitlistClient}
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
							>{m.waitlist_since()}</span
						>
						<span class="text-sm font-bold text-text">{formatDate(client.plannedInCareDate)}</span>
					</div>
					<div class="h-8 w-px bg-border lg:block"></div>
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
							>{m.days_on_waitlist()}</span
						>
						<span class="text-sm font-bold text-text"
							>{getDaysOnWaitlist(client.plannedInCareDate)}</span
						>
					</div>
				{:else}
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
							>{m.last_evaluation_short()}</span
						>
						<span class="text-sm font-bold text-text">{formatDate(client.lastEvaluationDate)}</span>
					</div>
					<div class="h-8 w-px bg-border lg:block"></div>
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
							>{m.next_evaluation_short()}</span
						>
						<span class="text-sm font-bold text-text">{formatDate(client.nextEvaluationDate)}</span>
					</div>
					<div class="h-8 w-px bg-border lg:block"></div>
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
							>{m.start_date()}</span
						>
						<span class="text-sm font-bold text-text">{formatDate(client.plannedInCareDate)}</span>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
		{#each client.quickLinks as link, index (`${link.href}-${index}`)}
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

	<div class="grid gap-6 xl:grid-cols-[1fr_380px]">
		<OverviewMainColumn {client} {status} />
		<OverviewSidebar {client} />
	</div>
</div>

{#if isInCareClient}
	<PutClientOutOfCareForm
		bind:open={showPutOutOfCareForm}
		clientId={client.id}
		onSuccess={() => invalidateAll()}
	/>
{/if}

<CreateIncidentForm
	bind:open={showCreateIncidentForm}
	preselectedClientId={client.id}
	preselectedClientDisplay={`${client.firstName} ${client.lastName}`.trim()}
	onCreated={() => invalidateAll()}
/>

<CreateProgressReportModal
	bind:open={showCreateProgressReportModal}
	preselectedClientId={client.id}
	onCreated={() => invalidateAll()}
/>

<EditClientForm
	bind:open={showEditClientForm}
	clientId={client.id}
	onUpdated={() => invalidateAll()}
/>

