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
		Building2
	} from 'lucide-svelte';
	import { invalidate } from '$app/navigation';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateIncidentForm from '$lib/components/forms/CreateIncidentForm.svelte';
	import CreateProgressReportModal from '$lib/components/forms/CreateProgressReportModal.svelte';
	import EditClientForm from '$lib/components/forms/EditClientForm.svelte';
	import PutClientOutOfCareForm from '$lib/components/forms/PutClientOutOfCareForm.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import type { ClientOverviewTarget, ClientOverviewViewModel } from '../../overview.shared';
	import { formatOverviewDate } from '../overview-date';
	import OverviewMainColumn from '../sections/OverviewMainColumn.svelte';
	import OverviewSidebar from '../sections/OverviewSidebar.svelte';

	interface Props {
		overview: ClientOverviewViewModel;
	}

	let { overview }: Props = $props();
	const client = $derived(overview.client);
	const clientDetail = $derived(overview.clientDetail);
	const status = $derived(overview.status);
	const isWaitlistClient = $derived(status === 'on_waiting_list');
	const isInCareClient = $derived(status === 'in_care');
	const clientDisplayName = $derived(
		`${client.firstName} ${client.lastName}`.trim() || m.breadcrumb_client_detail()
	);
	const clientInitials = $derived(
		[client.firstName, client.lastName]
			.filter(Boolean)
			.map((name) => name.charAt(0))
			.join('')
			.toUpperCase() || 'CP'
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

	const getQuickLinkHref = (target: ClientOverviewTarget): string | null => {
		switch (target) {
			case 'contracts':
				return resolve(
					localizeHref(
						resolve('/(app)/clients/[id]/contracts', { id: client.id })
					) as `/clients/${string}/contracts/`
				);
			case 'reports':
				return resolve(
					localizeHref(
						resolve('/(app)/clients/[id]/reports', { id: client.id })
					) as `/clients/${string}/reports/`
				);
			case 'goals':
				return resolve(
					localizeHref(
						resolve('/(app)/clients/[id]/goals', { id: client.id })
					) as `/clients/${string}/goals/`
				);
			case 'documents':
				return resolve(
					localizeHref(
						resolve('/(app)/clients/[id]/documents', { id: client.id })
					) as `/clients/${string}/documents/`
				);
			default:
				return null;
		}
	};

	const quickLinkLabels: Record<ClientOverviewTarget, () => string> = {
		overview: m.overview,
		contracts: m.contracts,
		incidents: m.incidents,
		reports: m.reports,
		goals: m.evaluations,
		documents: m.documents,
		appointments: m.appointments
	};

	const statusLabels = {
		on_waiting_list: m.status_on_waiting_list(),
		scheduled_in_care: m.status_scheduled_in_care(),
		in_care: m.status_in_care(),
		scheduled_out_of_care: m.status_scheduled_out_of_care(),
		out_of_care: m.status_out_of_care()
	};

	const statusColors = {
		on_waiting_list: 'border-warning/30 bg-warning/10 text-warning-strong',
		scheduled_in_care: 'border-info/30 bg-info/10 text-info-strong',
		in_care: 'border-success/30 bg-success/10 text-success-strong',
		scheduled_out_of_care: 'border-brand/30 bg-brand/10 text-brand-strong',
		out_of_care: 'border-border bg-bg text-text-muted'
	};
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
		<nav
			aria-label={m.client_overview_navigation()}
			class="flex min-w-0 items-center gap-2 text-sm font-medium text-text-subtle"
		>
			<a
				href={resolve(localizeHref(resolve('/(app)/clients')) as '/clients/')}
				data-sveltekit-preload-data="hover"
				class="flex shrink-0 items-center gap-1 rounded-lg transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
			>
				<ArrowLeft class="h-4 w-4" aria-hidden="true" />
				{m.clients()}
			</a>
			<ChevronRight class="h-4 w-4 shrink-0" aria-hidden="true" />
			<span class="truncate text-text" aria-current="page">{clientDisplayName}</span>
		</nav>

		<div class="flex flex-wrap items-center gap-2 xl:justify-end">
			{#if !isWaitlistClient}
				{#if isInCareClient}
					<PermissionGuard permission="CLIENT.STATUS.UPDATE">
						<Button variant="destructive" onclick={openPutOutOfCareForm}>
							<ShieldAlert class="h-4 w-4" aria-hidden="true" />
							{m.put_out_of_care()}
						</Button>
					</PermissionGuard>
				{/if}
				<Button
					variant="ghost"
					onclick={openCreateProgressReportModal}
					class="border border-border bg-surface shadow-sm"
				>
					<MessageSquare class="h-4 w-4" aria-hidden="true" />
					{m.new_progress_report()}
				</Button>
				<Button
					variant="ghost"
					onclick={openCreateIncidentForm}
					class="border border-border bg-surface shadow-sm"
				>
					<ShieldAlert class="h-4 w-4" aria-hidden="true" />
					{m.log_incident()}
				</Button>
			{/if}
			<a
				href={resolve(
					localizeHref(
						resolve('/(app)/clients/[id]/goals', { id: client.id })
					) as `/clients/${string}/goals/`
				)}
				data-sveltekit-preload-data="hover"
				class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text shadow-sm transition-colors hover:bg-border/50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
			>
				<Target class="h-4 w-4" aria-hidden="true" />
				{m.add_goal()}
			</a>
			<Button onclick={openEditClientForm}>
				<Plus class="h-4 w-4" aria-hidden="true" />
				{m.edit_client()}
			</Button>
		</div>
	</div>

	<header class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
		<div class="flex flex-col justify-between gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:p-8">
			<div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
				<div
					class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-2xl font-bold text-brand ring-1 ring-brand/20 sm:h-20 sm:w-20 sm:text-3xl"
					aria-hidden="true"
				>
					{clientInitials}
				</div>
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-3">
						<h1 class="text-2xl font-bold tracking-tight break-words text-text">
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
							><FileText class="h-4 w-4" aria-hidden="true" />{client.fileNumber}</span
						>
						<span class="flex items-center gap-1.5"
							><Building2 class="h-4 w-4" aria-hidden="true" />{client.locationName ||
								m.no_location()}</span
						>
						<span class="flex items-center gap-1.5"
							><Heart class="h-4 w-4" aria-hidden="true" />{client.careType ||
								m.general_care()}</span
						>
						<span class="flex items-center gap-1.5 font-medium text-text"
							><User class="h-4 w-4 text-text-subtle" aria-hidden="true" />{client.coordinator ||
								m.unassigned()}</span
						>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap gap-4 border-t border-border pt-6 lg:border-t-0 lg:pt-0">
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

	<section
		aria-label={m.client_overview_quick_links()}
		class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
	>
		{#each client.quickLinks as link (link.target)}
			{@const href = getQuickLinkHref(link.target)}
			{@const label = quickLinkLabels[link.target]()}
			{#if href}
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					{href}
					data-sveltekit-preload-data="hover"
					class="group flex min-h-24 flex-col items-center justify-center rounded-3xl border border-border bg-surface p-4 text-center shadow-sm transition-[border-color,box-shadow] hover:border-brand/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					<span class="text-2xl font-bold text-text group-hover:text-brand">{link.count}</span>
					<span class="mt-1 text-xs font-medium text-text-muted group-hover:text-text">{label}</span
					>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{:else}
				<div
					class="flex min-h-24 flex-col items-center justify-center rounded-3xl border border-border bg-surface p-4 text-center shadow-sm"
				>
					<span class="text-2xl font-bold text-text">{link.count}</span>
					<span class="mt-1 text-xs font-medium text-text-muted">{label}</span>
				</div>
			{/if}
		{/each}
	</section>

	<div class="grid gap-6 xl:grid-cols-[1fr_380px]">
		<OverviewMainColumn {client} {status} />
		<OverviewSidebar {client} />
	</div>
</div>

{#if isInCareClient}
	<PutClientOutOfCareForm
		bind:open={showPutOutOfCareForm}
		clientId={client.id}
		onSuccess={() => invalidate(`app:client:${client.id}:detail`)}
	/>
{/if}

<CreateIncidentForm
	bind:open={showCreateIncidentForm}
	preselectedClientId={client.id}
	preselectedClientDisplay={`${client.firstName} ${client.lastName}`.trim()}
	onCreated={() => invalidate(`app:client:${client.id}:detail`)}
/>

<CreateProgressReportModal
	bind:open={showCreateProgressReportModal}
	preselectedClientId={client.id}
	onCreated={() =>
		Promise.all([
			invalidate(`app:client:${client.id}:detail`),
			invalidate(`app:client:${client.id}:reports`)
		])}
/>

<EditClientForm
	bind:open={showEditClientForm}
	clientId={client.id}
	clientData={clientDetail}
	onUpdated={() => invalidate(`app:client:${client.id}:detail`)}
/>
