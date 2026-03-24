<script lang="ts">
	import { Clock, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { LeaveRequestListItemResponse, LeaveRequestStatus } from '$lib/types/api';

	type RequestFilter = 'all' | LeaveRequestStatus;
	type LeaveType = 'vacation' | 'sick' | 'personal' | 'training' | 'pregnancy' | 'unpaid' | 'other' | 'late';

	interface Props {
		rows: LeaveRequestListItemResponse[];
		loading: boolean;
		error: string | null;
		requestFilter?: RequestFilter;
		searchQuery?: string;
		currentPage?: number;
		pageSize: number;
		totalCount: number;
		onApprove: (id: string) => void;
		onReject: (id: string) => void;
		onDelete: (id: string) => void;
		onCreateRequest: () => void;
	}

	interface OverviewLeaveRequestRow {
		id: string;
		employeeId: string;
		employeeName: string;
		leaveType: string;
		startDate: string;
		endDate: string;
		days: number;
		hours: number;
		reason?: string;
		status: LeaveRequestStatus;
	}

	interface RequestFilterPill {
		id: RequestFilter;
		label: string;
	}

	const columns: DataTableColumn[] = [
		{ key: 'employee', label: 'Medewerker' },
		{ key: 'type', label: 'Type' },
		{ key: 'period', label: 'Periode' },
		{ key: 'status', label: 'Status', align: 'center' },
		{ key: 'actions', label: '', align: 'right' }
	];

	const leaveTypeConfig: Record<LeaveType, { label: () => string; className: string }> = {
		vacation: {
			label: () => m.leave_type_vacation(),
			className: 'bg-info/10 text-info border-info/20'
		},
		sick: { label: () => m.leave_type_sick(), className: 'bg-error/10 text-error border-error/20' },
		personal: {
			label: () => m.leave_type_personal(),
			className: 'bg-warning/10 text-warning border-warning/20'
		},
		training: {
			label: () => m.leave_type_training(),
			className: 'bg-brand/10 text-brand border-brand/20'
		},
		pregnancy: {
			label: () => m.leave_type_pregnancy(),
			className: 'bg-pink-500/10 text-pink-600 border-pink-400/40'
		},
		unpaid: {
			label: () => m.leave_type_unpaid(),
			className: 'bg-brand/10 text-brand border-brand/20'
		},
		other: {
			label: () => m.leave_type_other(),
			className: 'bg-brand/10 text-brand border-brand/20'
		},
		late: {
			label: () => m.leave_tab_late(),
			className: 'bg-warning/10 text-warning border-warning/20'
		}
	};

	const statusConfig: Record<
		LeaveRequestStatus,
		{ label: () => string; icon: typeof AlertCircle; color: string }
	> = {
		pending: { label: () => m.leave_status_pending(), icon: AlertCircle, color: 'text-warning' },
		approved: { label: () => m.leave_status_approved(), icon: CheckCircle, color: 'text-success' },
		rejected: { label: () => m.leave_status_rejected(), icon: XCircle, color: 'text-error' },
		cancelled: { label: () => m.leave_status_cancelled(), icon: XCircle, color: 'text-text-muted' },
		expired: { label: () => m.leave_status_expired(), icon: Clock, color: 'text-text-muted' }
	};

	let {
		rows,
		loading,
		error,
		requestFilter = $bindable('all' as RequestFilter),
		searchQuery = $bindable(''),
		currentPage = $bindable(1),
		pageSize,
		totalCount,
		onApprove,
		onReject,
		onDelete,
		onCreateRequest
	}: Props = $props();

	const requestFilterPills = $derived.by<RequestFilterPill[]>(() => [
		{ id: 'all', label: m.all() },
		{ id: 'pending', label: m.pending() },
		{ id: 'approved', label: m.leave_stats_approved() },
		{ id: 'rejected', label: m.leave_stats_rejected() }
	]);

	const tableRows = $derived.by<OverviewLeaveRequestRow[]>(() =>
		rows.map((row) => {
			const days = calculateDays(row.start_date, row.end_date);
			return {
				id: row.id,
				employeeId: row.employee_id,
				employeeName: row.employee_name,
				leaveType: row.leave_type,
				startDate: row.start_date,
				endDate: row.end_date,
				days,
				hours: days * 8,
				reason: row.reason ?? undefined,
				status: row.status
			};
		})
	);

	function formatDate(dateText: string) {
		return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(
			new Date(dateText)
		);
	}

	function calculateDays(startDate: string, endDate: string) {
		if (!startDate || !endDate) return 0;
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
		return diff > 0 ? diff : 0;
	}

	function getFilterPillClass(pillId: RequestFilter) {
		if (pillId === 'all') {
			return requestFilter === pillId
				? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'pending') {
			return requestFilter === pillId
				? 'bg-amber-500 text-white'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'approved') {
			return requestFilter === pillId
				? 'bg-emerald-600 text-white'
				: 'border border-border text-text-muted hover:text-text';
		}
		return requestFilter === pillId
			? 'bg-rose-600 text-white'
			: 'border border-border text-text-muted hover:text-text';
	}
</script>

{#snippet requestFilters()}
	<div class="flex w-full flex-wrap items-center gap-3">
		<div class="relative w-full sm:w-64">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				placeholder={m.search_employees()}
				value={searchQuery}
				oninput={(event) => {
					searchQuery = (event.target as HTMLInputElement).value;
					currentPage = 1;
				}}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
			/>
		</div>
		<div class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
			{#each requestFilterPills as pill (pill.id)}
				<button
					onclick={() => {
						requestFilter = pill.id;
						currentPage = 1;
					}}
					class="h-9 rounded-full px-4 text-xs font-semibold transition-all {getFilterPillClass(
						pill.id
					)}"
				>
					{pill.label}
				</button>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet employeeCell(row: OverviewLeaveRequestRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-xs font-semibold text-brand"
		>
			{row.employeeName
				.split(' ')
				.map((part) => part[0])
				.join('')
				.slice(0, 2)
				.toUpperCase()}
		</div>
		<p class="text-sm font-semibold text-text">{row.employeeName}</p>
	</div>
{/snippet}

{#snippet typeCell(row: OverviewLeaveRequestRow)}
	{@const normalizedType = row.leaveType as LeaveType}
	{@const typeMeta = leaveTypeConfig[normalizedType]}
	<span
		class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold {typeMeta
			? typeMeta.className
			: 'bg-surface-subtle border-border text-text-muted'}"
	>
		{typeMeta ? typeMeta.label() : row.leaveType}
	</span>
{/snippet}

{#snippet periodCell(row: OverviewLeaveRequestRow)}
	<div class="text-sm">
		<p class="font-semibold text-text">
			{formatDate(row.startDate)} - {formatDate(row.endDate)}
		</p>
		<p class="text-text-muted">
			{row.days}
			{row.days === 1 ? 'dag' : 'dagen'}
		</p>
	</div>
{/snippet}

{#snippet statusCell(row: OverviewLeaveRequestRow)}
	{@const statusMeta = statusConfig[row.status]}
	<span class="inline-flex items-center gap-2 text-xs font-semibold {statusMeta.color}">
		<statusMeta.icon class="h-4 w-4" />
		{statusMeta.label()}
	</span>
{/snippet}

{#snippet actionsCell(row: OverviewLeaveRequestRow)}
	<div class="relative flex items-center justify-end gap-1.5">
		{#if row.status === 'pending'}
			<button
				class="flex h-8 items-center gap-1.5 rounded-lg border border-error/30 bg-surface px-2.5 text-xs font-semibold text-error transition-all hover:bg-error/5 active:scale-95"
				onclick={() => onReject(row.id)}
			>
				<XCircle class="h-3.5 w-3.5" />
				{m.leave_action_reject()}
			</button>
			<button
				class="flex h-8 items-center gap-1.5 rounded-lg bg-success px-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-success/90 active:scale-95"
				onclick={() => onApprove(row.id)}
			>
				<CheckCircle class="h-3.5 w-3.5" />
				{m.leave_action_approve()}
			</button>
			<div class="ml-1 h-5 w-px bg-border/40"></div>
		{/if}
		<button
			class="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-text-muted transition-all hover:bg-border/30 hover:text-text"
			onclick={() => onDelete(row.id)}
		>
			{m.leave_action_delete()}
		</button>
	</div>
{/snippet}

<div class="animate-in fade-in slide-in-from-bottom-2">
	{#if error}
		<div class="mb-4 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
			{error}
		</div>
	{/if}
	<DataTable
		{columns}
		rows={tableRows}
		loading={loading}
		rowKey="id"
		title={m.leave_table_title()}
		description={m.leave_table_description()}
		emptyTitle={m.leave_table_empty_title()}
		emptyDescription={m.leave_table_empty_description()}
		emptyActionLabel={m.leave_table_empty_action()}
		emptyAction={onCreateRequest}
		filters={requestFilters}
		surface="plain"
		headerInline
		currentPage={currentPage}
		{pageSize}
		totalCount={totalCount}
		onPageChange={(page) => {
			currentPage = page;
		}}
		cells={{
			employee: employeeCell,
			type: typeCell,
			period: periodCell,
			status: statusCell,
			actions: actionsCell
		}}
	/>
</div>
