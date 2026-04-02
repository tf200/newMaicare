<script lang="ts">
	import { AlertCircle, ArrowLeftRight, CheckCircle2, Clock, Filter } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type { ShiftSwapFilter } from '$lib/api/shift-swaps';
	import type { ShiftSwapResponse, ShiftSwapStatus } from '$lib/types/api';
	import type { ShiftSwapCountsLoadResult, ShiftSwapLoadResult } from './+page';
	import { m } from '$lib/paraglide/messages';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: {
					filter: ShiftSwapFilter;
					status: ShiftSwapStatus | '';
					employeeId: string;
				};
			};
			swapsData: Promise<ShiftSwapLoadResult>;
			countsData: Promise<ShiftSwapCountsLoadResult>;
		};
	}>();

	type SwapRow = ShiftSwapResponse;

	const statusConfig: Record<ShiftSwapStatus, { label: () => string; className: string }> = {
		pending_recipient: {
			label: () => m.swap_stat_pending(),
			className: 'border-warning/20 bg-warning/10 text-warning'
		},
		recipient_rejected: {
			label: () => m.swap_toast_target_rejected(),
			className: 'border-error/20 bg-error/10 text-error'
		},
		pending_admin: {
			label: () => m.swap_waiting_approval(),
			className: 'border-brand/20 bg-brand/10 text-brand'
		},
		admin_rejected: {
			label: () => m.swap_toast_rejected(),
			className: 'border-error/20 bg-error/10 text-error'
		},
		confirmed: {
			label: () => m.confirmed(),
			className: 'border-success/20 bg-success/10 text-success'
		},
		cancelled: {
			label: () => m.leave_status_cancelled(),
			className: 'border-border bg-border/40 text-text-muted'
		},
		expired: {
			label: () => m.expired(),
			className: 'border-border bg-border/40 text-text-muted'
		}
	};

	const statusOptions: Array<{ value: ShiftSwapStatus; label: () => string }> = [
		{ value: 'pending_recipient', label: statusConfig.pending_recipient.label },
		{ value: 'recipient_rejected', label: statusConfig.recipient_rejected.label },
		{ value: 'pending_admin', label: statusConfig.pending_admin.label },
		{ value: 'admin_rejected', label: statusConfig.admin_rejected.label },
		{ value: 'confirmed', label: statusConfig.confirmed.label },
		{ value: 'cancelled', label: statusConfig.cancelled.label },
		{ value: 'expired', label: statusConfig.expired.label }
	];

	const swapsDataPromise = $derived.by(() => data.swapsData);
	const countsDataPromise = $derived.by(() => data.countsData);
	const currentPage = $derived.by(() => data.initial.page);
	const pageSize = $derived.by(() => data.initial.pageSize);
	const activeFilter = $derived.by(() => data.initial.filters.filter);
	const selectedStatus = $derived.by(() => data.initial.filters.status);

	const columns = $derived.by<DataTableColumn[]>(() => {
		if (activeFilter === 'to_approve') {
			return [
				{ key: 'requester', label: m.swap_col_requester() },
				{ key: 'icon', label: '', width: '40px', align: 'center' },
				{ key: 'target', label: m.swap_col_colleague() },
				{ key: 'date', label: m.swap_col_date() },
				{ key: 'response', label: m.swap_col_response() },
				{ key: 'status', label: m.swap_col_status() }
			];
		}

		if (activeFilter === 'history') {
			return [
				{ key: 'requester', label: m.swap_col_requester() },
				{ key: 'icon', label: '', width: '40px', align: 'center' },
				{ key: 'target', label: m.swap_col_colleague() },
				{ key: 'date', label: m.swap_col_date() },
				{ key: 'reaction', label: m.swap_col_reaction() },
				{ key: 'status', label: m.swap_col_status() }
			];
		}

		return [
			{ key: 'requester', label: m.swap_col_requester() },
			{ key: 'icon', label: '', width: '40px', align: 'center' },
			{ key: 'target', label: m.swap_col_colleague() },
			{ key: 'date', label: m.swap_col_date() },
			{ key: 'expires', label: m.expired() },
			{ key: 'status', label: m.swap_col_status() }
		];
	});

	const emptyStateTitle = $derived.by(() => {
		if (selectedStatus) return m.swap_empty_filtered();
		if (activeFilter === 'to_approve') return m.swap_empty_approval();
		if (activeFilter === 'history') return m.swap_empty_history();
		return m.swap_empty_pending();
	});

	const buildQuery = (
		pageValue: number,
		filterValue: ShiftSwapFilter,
		statusValue: ShiftSwapStatus | ''
	) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		params.set('filter', filterValue);
		if (statusValue) params.set('status', statusValue);
		if (data.initial.filters.employeeId) params.set('employee_id', data.initial.filters.employeeId);
		return params.toString();
	};

	const updateQuery = (
		pageValue: number,
		filterValue: ShiftSwapFilter,
		statusValue: ShiftSwapStatus | ''
	) => {
		const nextQuery = buildQuery(pageValue, filterValue, statusValue);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`${resolve(page.url.pathname as any)}?${nextQuery}` as string, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	function handleFilterChange(nextFilter: ShiftSwapFilter) {
		if (activeFilter === nextFilter) return;
		updateQuery(1, nextFilter, selectedStatus);
	}

	function handleStatusChange(nextStatus: ShiftSwapStatus | '') {
		if (selectedStatus === nextStatus) return;
		updateQuery(1, activeFilter, nextStatus);
	}

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(value));
	}

	function formatTime(value: string) {
		return new Intl.DateTimeFormat('nl-NL', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}

	function formatDateTime(value: string) {
		return new Intl.DateTimeFormat('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}

	function formatShiftMeta(start: string, end: string) {
		return `${formatDate(start)} | ${formatTime(start)} - ${formatTime(end)}`;
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function getResponseText(row: SwapRow) {
		const note = row.recipient_response_note?.trim();
		if (note) return note;
		if (row.recipient_responded_at)
			return `Responded ${formatDateTime(row.recipient_responded_at)}`;
		return '-';
	}

	function getReactionText(row: SwapRow) {
		const adminNote = row.admin_decision_note?.trim();
		if (adminNote) return adminNote;

		const recipientNote = row.recipient_response_note?.trim();
		if (recipientNote) return recipientNote;

		if (row.admin_employee_name && row.admin_decided_at) {
			return `${row.admin_employee_name} | ${formatDateTime(row.admin_decided_at)}`;
		}

		if (row.admin_decided_at) {
			return `Updated ${formatDateTime(row.admin_decided_at)}`;
		}

		if (row.recipient_responded_at) {
			return `Responded ${formatDateTime(row.recipient_responded_at)}`;
		}

		return '-';
	}
</script>

<svelte:head>
	<title>{m.swap_page_title()} | MaiCare</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
		<div class="flex flex-wrap gap-2">
			{#await countsDataPromise}
				{#each [{ id: 'open', label: m.swap_tab_pending( { count: 0 } ) }, { id: 'to_approve', label: m.swap_tab_approval( { count: 0 } ) }, { id: 'history', label: m.swap_tab_history( { count: 0 } ) }] as pill (pill.id)}
					<button
						type="button"
						onclick={() => handleFilterChange(pill.id as ShiftSwapFilter)}
						class="h-9 rounded-full px-4 text-xs font-semibold transition-all {activeFilter ===
						pill.id
							? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
							: 'border border-border text-text-muted hover:text-text'}"
					>
						{pill.label}
					</button>
				{/each}
			{:then countsData}
				{#each [{ id: 'open', label: m.swap_tab_pending( { count: countsData.counts.open } ) }, { id: 'to_approve', label: m.swap_tab_approval( { count: countsData.counts.to_approve } ) }, { id: 'history', label: m.swap_tab_history( { count: countsData.counts.history } ) }] as pill (pill.id)}
					<button
						type="button"
						onclick={() => handleFilterChange(pill.id as ShiftSwapFilter)}
						class="h-9 rounded-full px-4 text-xs font-semibold transition-all {activeFilter ===
						pill.id
							? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
							: 'border border-border text-text-muted hover:text-text'}"
					>
						{pill.label}
					</button>
				{/each}
			{/await}
		</div>

		<div class="flex items-center gap-2 self-start xl:self-auto">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted"
			>
				<Filter class="h-4 w-4" />
			</div>
			<label
				class="text-xs font-semibold tracking-wide text-text-subtle uppercase"
				for="swap-status"
			>
				{m.status()}
			</label>
			<select
				id="swap-status"
				value={selectedStatus}
				onchange={(event) =>
					handleStatusChange(
						(event.currentTarget as HTMLSelectElement).value as ShiftSwapStatus | ''
					)}
				class="h-9 min-w-[210px] rounded-xl border border-border bg-surface px-3 text-sm font-medium text-text outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20"
			>
				<option value="">All statuses</option>
				{#each statusOptions as option (option.value)}
					<option value={option.value}>{option.label()}</option>
				{/each}
			</select>
		</div>
	</div>
{/snippet}

{#snippet cellRequester(row: SwapRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-border/50 text-xs font-semibold text-text shadow-sm"
		>
			{getInitials(row.requester_employee_name)}
		</div>
		<div class="min-w-0">
			<p class="truncate text-sm font-semibold text-text">{row.requester_employee_name}</p>
			<div class="mt-0.5 flex flex-wrap items-center gap-1.5">
				<span
					class="inline-flex items-center rounded-md bg-border/50 px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
				>
					{row.requester_schedule.shift_name}
				</span>
				<span class="text-[10px] text-text-subtle">
					{formatShiftMeta(
						row.requester_schedule.start_datetime,
						row.requester_schedule.end_datetime
					)}
				</span>
			</div>
		</div>
	</div>
{/snippet}

{#snippet cellTarget(row: SwapRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-border/50 text-xs font-semibold text-text shadow-sm"
		>
			{getInitials(row.recipient_employee_name)}
		</div>
		<div class="min-w-0">
			<p class="truncate text-sm font-semibold text-text">{row.recipient_employee_name}</p>
			<div class="mt-0.5 flex flex-wrap items-center gap-1.5">
				<span
					class="inline-flex items-center rounded-md bg-border/50 px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
				>
					{row.recipient_schedule.shift_name}
				</span>
				<span class="text-[10px] text-text-subtle">
					{formatShiftMeta(
						row.recipient_schedule.start_datetime,
						row.recipient_schedule.end_datetime
					)}
				</span>
			</div>
		</div>
	</div>
{/snippet}

{#snippet cellIcon()}
	<div class="flex justify-center">
		<ArrowLeftRight class="h-4 w-4 text-text-subtle/50" />
	</div>
{/snippet}

{#snippet cellDate(row: SwapRow)}
	<span class="text-xs text-text-muted">{formatDateTime(row.requested_at)}</span>
{/snippet}

{#snippet cellExpires(row: SwapRow)}
	<span class={`text-xs ${row.expires_at ? 'text-text-muted' : 'text-text-subtle'}`}>
		{row.expires_at ? formatDateTime(row.expires_at) : '-'}
	</span>
{/snippet}

{#snippet cellStatus(row: SwapRow)}
	<span
		class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase {statusConfig[
			row.status
		].className}"
	>
		{statusConfig[row.status].label()}
	</span>
{/snippet}

{#snippet cellResponse(row: SwapRow)}
	<span
		class={`block max-w-[220px] truncate text-xs ${row.recipient_response_note ? 'text-success' : 'text-text-muted'}`}
	>
		{getResponseText(row)}
	</span>
{/snippet}

{#snippet cellReaction(row: SwapRow)}
	<span class="block max-w-[220px] truncate text-xs text-text-muted">
		{getReactionText(row)}
	</span>
{/snippet}

<section class="flex flex-col gap-6">
	<div class="flex flex-wrap items-start justify-between gap-6">
		<div class="space-y-1">
			<h1 class="text-2xl font-bold tracking-tight text-text">{m.swap_header_title()}</h1>
			<p class="text-sm font-medium text-text-muted">{m.swap_header_subtitle()}</p>
		</div>
	</div>

	{#await swapsDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each [1, 2, 3] as item (item)}
				<div class="rounded-2xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-28 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		</div>

		<DataTable
			{columns}
			rows={[]}
			loading
			{currentPage}
			{pageSize}
			totalCount={0}
			onPageChange={(nextPage) => updateQuery(nextPage, activeFilter, selectedStatus)}
			rowKey="id"
			title={m.swap_header_label()}
			description={m.swap_workflow_title()}
			filters={tableFilters}
			cells={{
				requester: cellRequester,
				target: cellTarget,
				icon: cellIcon,
				date: cellDate,
				expires: cellExpires,
				status: cellStatus,
				response: cellResponse,
				reaction: cellReaction
			}}
		/>
	{:then swapsData}
		{#if swapsData.loadError}
			<InlineErrorBanner message={swapsData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		{#await countsDataPromise}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each [1, 2, 3] as item (item)}
					<div class="rounded-2xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
						<div class="h-3 w-28 animate-pulse rounded bg-border/70"></div>
						<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
					</div>
				{/each}
			</div>
		{:then countsData}
			{#if countsData.loadError}
				<InlineErrorBanner message={countsData.loadError} onRetry={() => invalidateAll()} />
			{/if}

			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				<div
					class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-warning/30"
				>
					<div
						class="absolute -right-4 -bottom-4 text-warning opacity-[0.03] transition-opacity group-hover:opacity-10"
					>
						<Clock class="h-28 w-28" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
							{m.swap_stat_pending()}
						</div>
						<div class="mt-2 text-2xl font-bold tracking-tight text-warning sm:text-3xl">
							{countsData.counts.open}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">{m.swap_stat_pending_sub()}</p>
					</div>
				</div>

				<div
					class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-brand/30"
				>
					<div
						class="absolute -right-4 -bottom-4 text-brand opacity-[0.03] transition-opacity group-hover:opacity-10"
					>
						<AlertCircle class="h-28 w-28" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
							{m.swap_stat_approval()}
						</div>
						<div class="mt-2 text-2xl font-bold tracking-tight text-brand sm:text-3xl">
							{countsData.counts.to_approve}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">{m.swap_stat_approval_sub()}</p>
					</div>
				</div>

				<div
					class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-success/30"
				>
					<div
						class="absolute -right-4 -bottom-4 text-success opacity-[0.03] transition-opacity group-hover:opacity-10"
					>
						<CheckCircle2 class="h-28 w-28" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
							{m.swap_stat_processed()}
						</div>
						<div class="mt-2 text-2xl font-bold tracking-tight text-success sm:text-3xl">
							{countsData.counts.history}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">{m.swap_stat_processed_sub()}</p>
					</div>
				</div>
			</div>
		{/await}

		<DataTable
			{columns}
			rows={swapsData.swaps}
			currentPage={swapsData.pagination.page}
			pageSize={swapsData.pagination.pageSize}
			totalCount={swapsData.pagination.count}
			onPageChange={(nextPage) => updateQuery(nextPage, activeFilter, selectedStatus)}
			rowKey="id"
			title={m.swap_header_label()}
			description={m.swap_workflow_title()}
			filters={tableFilters}
			emptyTitle={emptyStateTitle}
			emptyDescription="Adjust the selected filter or status to find matching swap requests."
			cells={{
				requester: cellRequester,
				target: cellTarget,
				icon: cellIcon,
				date: cellDate,
				expires: cellExpires,
				status: cellStatus,
				response: cellResponse,
				reaction: cellReaction
			}}
		/>
	{/await}
</section>
