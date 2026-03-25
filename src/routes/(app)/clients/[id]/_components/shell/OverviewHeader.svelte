<script lang="ts">
	import { ArrowLeft, ChevronRight, FileCheck, MessageSquare, Plus, ShieldAlert, Target } from 'lucide-svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewData, ClientOverviewStatus } from '$lib/mock/client-overview';
	import type { OverviewActionState } from '../../overview.shared';

	interface Props {
		client: ClientOverviewData;
		status: ClientOverviewStatus;
		breadcrumbSectionLabel?: string;
		actions: OverviewActionState;
		onPutOutOfCare: () => void;
		onCreateIncident: () => void;
	}

	let { client, breadcrumbSectionLabel, actions, onPutOutOfCare, onCreateIncident }: Props = $props();
	const clientDisplayName = $derived(`${client.firstName} ${client.lastName}`.trim() || 'Client Detail');
</script>

<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
	<nav class="flex flex-wrap items-center gap-2 text-sm font-medium text-text-subtle">
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
		{#if actions.canPutOutOfCare}
			<PermissionGuard permission="CLIENT.STATUS.UPDATE">
				<button
					type="button"
					onclick={onPutOutOfCare}
					class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-100"
				>
					<ShieldAlert class="h-4 w-4" />
					{m.put_out_of_care()}
				</button>
			</PermissionGuard>
		{/if}

		{#if actions.canCreateProgressReport}
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
			>
				<MessageSquare class="h-4 w-4" />
				{m.new_progress_report()}
			</button>
		{/if}

		{#if actions.canCreateIncident}
			<button
				type="button"
				onclick={onCreateIncident}
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
			>
				<ShieldAlert class="h-4 w-4" />
				{m.log_incident()}
			</button>
		{/if}

		{#if actions.canAddGoal}
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
			>
				<Target class="h-4 w-4" />
				{m.add_goal()}
			</button>
		{/if}

		{#if actions.canUploadDocument}
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-text shadow-sm transition hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
			>
				<FileCheck class="h-4 w-4" />
				{m.upload_document()}
			</button>
		{/if}

		{#if actions.canEditClient}
			<button
				class="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-strong dark:text-zinc-900"
			>
				<Plus class="h-4 w-4" />
				{m.edit_client()}
			</button>
		{/if}
	</div>
</div>
