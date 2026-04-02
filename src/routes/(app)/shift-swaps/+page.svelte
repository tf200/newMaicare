<script lang="ts">
	import { AlertCircle, ArrowLeftRight, CheckCircle2, Clock, XCircle, Eye } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { listEmployees } from '$lib/api/employees';
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

	const statusOptions = [
		{ value: 'pending_recipient', label: () => m.swap_stat_pending() },
		{ value: 'recipient_rejected', label: () => m.swap_toast_target_rejected() },
		{ value: 'pending_admin', label: () => m.swap_waiting_approval() },
		{ value: 'admin_rejected', label: () => m.swap_toast_rejected() },
		{ value: 'confirmed', label: () => m.confirmed() },
		{ value: 'cancelled', label: () => m.leave_status_cancelled() },
		{ value: 'expired', label: () => m.expired() }
	];

	const statusSelectOptions = $derived([
		{ value: '', label: 'All statuses' },
		...statusOptions.map((opt) => ({ value: opt.value, label: opt.label() }))
	]);

	const swapsDataPromise = $derived(data.swapsData);
	const countsDataPromise = $derived(data.countsData);
	const currentPage = $derived(data.initial.page);
	const pageSize = $derived(data.initial.pageSize);
	const activeFilter = $derived(data.initial.filters.filter);
	const selectedStatus = $derived(data.initial.filters.status);
	const selectedEmployeeId = $derived(data.initial.filters.employeeId);

	const columns = $derived.by<DataTableColumn[]>(() => {
		const baseColumns: DataTableColumn[] = [
			{ key: 'requester', label: m.swap_col_requester() },
			{ key: 'icon', label: '', width: '40px', align: 'center' },
			{ key: 'target', label: m.swap_col_colleague() },
			{ key: 'date', label: m.swap_col_date() }
		];

		if (activeFilter === 'to_approve') {
			return [
				...baseColumns,
				{ key: 'response', label: m.swap_col_response() },
				{ key: 'status', label: m.swap_col_status() }
			];
		}

		if (activeFilter === 'history') {
			return [
				...baseColumns,
				{ key: 'reaction', label: m.swap_col_reaction() },
				{ key: 'status', label: m.swap_col_status() }
			];
		}

		return [
			...baseColumns,
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
		statusValue: ShiftSwapStatus | '',
		employeeIdValue: string
	) => {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		params.set('filter', filterValue);
		if (statusValue) params.set('status', statusValue);
		else params.delete('status');
		if (employeeIdValue) params.set('employee_id', employeeIdValue);
		else params.delete('employee_id');
		return params.toString();
	};

	const updateQuery = (
		pageValue: number,
		filterValue: ShiftSwapFilter,
		statusValue: ShiftSwapStatus | '',
		employeeIdValue: string = selectedEmployeeId
	) => {
		const nextQuery = buildQuery(pageValue, filterValue, statusValue, employeeIdValue);
		const currentQuery = page.url.searchParams.toString();
		if (currentQuery === nextQuery) return;

		goto(`?${nextQuery}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	function handleFilterChange(nextFilter: ShiftSwapFilter) {
		if (activeFilter === nextFilter) return;
		updateQuery(1, nextFilter, selectedStatus);
	}

	function handleStatusChange(nextStatus: string) {
		const status = (nextStatus as ShiftSwapStatus | '') || '';
		if (selectedStatus === status) return;
		updateQuery(1, activeFilter, status);
	}

	function handleEmployeeChange(employeeId: string | undefined) {
		const id = employeeId || '';
		if (selectedEmployeeId === id) return;
		updateQuery(1, activeFilter, selectedStatus, id);
	}

	function getFilterPillClass(pillId: ShiftSwapFilter) {
		if (pillId === 'open') {
			return activeFilter === pillId
				? 'bg-amber-500 text-white shadow-sm'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'to_approve') {
			return activeFilter === pillId
				? 'bg-brand text-white shadow-sm'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'history') {
			return activeFilter === pillId
				? 'bg-emerald-600 text-white shadow-sm'
				: 'border border-border text-text-muted hover:text-text';
		}
		return 'border border-border text-text-muted hover:text-text';
	}

	async function loadEmployeeOptions(query: string) {
		try {
			const response = await listEmployees({ search: query, page_size: 20 });
			return response.data.results.map((emp) => ({
				value: emp.id,
				label: `${emp.first_name} ${emp.last_name}`,
				department: emp.department
			}));
		} catch {
			return [];
		}
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

{#snippet tableFilters()}
	<div class="flex w-full flex-wrap items-center gap-3">
		<div class="flex w-full flex-wrap items-center gap-3 sm:w-auto">
			<div class="w-full sm:w-64">
				<SearchSelect
					placeholder={m.search_employees()}
					loadOptions={loadEmployeeOptions}
					value={selectedEmployeeId}
					onchange={handleEmployeeChange}
					size="sm"
				/>
			</div>
			<div class="w-full sm:w-48">
				<Select
					placeholder="All statuses"
					options={statusSelectOptions}
					value={selectedStatus}
					onchange={handleStatusChange}
					size="sm"
				/>
			</div>
		</div>

		<div class="flex flex-1 items-center justify-end gap-2">
			{#each [{ id: 'open', label: m.pending() }, { id: 'to_approve', label: m.swap_stat_approval() }, { id: 'history', label: m.history() }] as pill (pill.id)}
				<button
					onclick={() => handleFilterChange(pill.id as ShiftSwapFilter)}
					class="h-9 rounded-full px-4 text-xs font-semibold transition-all {getFilterPillClass(
						pill.id as ShiftSwapFilter
					)}"
				>
					{pill.label}
				</button>
			{/each}
		</div>
	</div>
{/snippet}

<section class="flex flex-col gap-6">
	<div class="flex flex-wrap items-start justify-between gap-6">
		<div class="space-y-1">
			<h1 class="text-2xl font-bold tracking-tight text-text">{m.swap_header_title()}</h1>
			<p class="text-sm font-medium text-text-muted">{m.swap_header_subtitle()}</p>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#await countsDataPromise}
			{#each [1, 2, 3] as item (item)}
				<div class="rounded-2xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-28 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		{:then countsData}
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
		{/await}
	</div>

	{#await swapsDataPromise}
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
