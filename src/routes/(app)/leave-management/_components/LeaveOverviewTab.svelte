<script lang="ts">
	import {
		Clock,
		CheckCircle,
		XCircle,
		AlertCircle,
		Search,
		MapPin,
		User,
		Calendar
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import { m } from '$lib/paraglide/messages';
	import type {
		LeaveRequestListItemResponse,
		LeaveRequestStatus,
		LateArrivalListItemResponse
	} from '$lib/types/api';

	type RequestFilter = 'all' | LeaveRequestStatus;
	type LeaveDecision = 'approve' | 'reject';
	type LeaveType =
		| 'vacation'
		| 'sick'
		| 'personal'
		| 'training'
		| 'pregnancy'
		| 'unpaid'
		| 'other'
		| 'late';

	type OverviewSubTab = 'requests' | 'lateArrivals';

	interface Props {
		activeSubTab?: OverviewSubTab;
		rows: LeaveRequestListItemResponse[];
		loading: boolean;
		error: string | null;
		requestFilter?: RequestFilter;
		searchQuery?: string;
		currentPage?: number;
		pageSize: number;
		totalCount: number;
		onApprove: (id: string, decisionNote?: string) => Promise<void> | void;
		onReject: (id: string, decisionNote?: string) => Promise<void> | void;
		onDelete: (id: string) => void;
		onCreateRequest: () => void;
		lateArrivalRows?: LateArrivalListItemResponse[];
		lateArrivalLoading?: boolean;
		lateArrivalError?: string | null;
		lateArrivalCurrentPage?: number;
		lateArrivalPageSize?: number;
		lateArrivalTotalCount?: number;
		lateArrivalSearchQuery?: string;
		lateArrivalDateFrom?: string;
		lateArrivalDateTo?: string;
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
		{ key: 'employee', label: m.employee() },
		{ key: 'type', label: m.leave_type_label() },
		{ key: 'period', label: m.period() },
		{ key: 'status', label: m.status(), align: 'center' },
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

	const lateArrivalColumns: DataTableColumn[] = [
		{ key: 'employee', label: m.employee() },
		{ key: 'arrival', label: m.late_arrival_time_label() },
		{ key: 'late', label: m.late_column_late(), align: 'center' },
		{ key: 'shift', label: 'Dienst' },
		{ key: 'reason', label: m.late_reason_label() }
	];

	let {
		activeSubTab = $bindable('requests' as OverviewSubTab),
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
		onCreateRequest,
		lateArrivalRows = [],
		lateArrivalLoading = false,
		lateArrivalError = null,
		lateArrivalCurrentPage = $bindable(1),
		lateArrivalPageSize = 20,
		lateArrivalTotalCount = 0,
		lateArrivalSearchQuery = $bindable(''),
		lateArrivalDateFrom = $bindable(''),
		lateArrivalDateTo = $bindable('')
	}: Props = $props();

	function getShiftStartTime(dateTimeText: string) {
		const date = new Date(dateTimeText);
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${hours}:${minutes}`;
	}

	function getMinutesLate(arrivalTime: string, shiftStartDateTime: string) {
		const shiftStart = getShiftStartTime(shiftStartDateTime);
		const [arrH, arrM] = arrivalTime.split(':').map(Number);
		const [shiftH, shiftM] = shiftStart.split(':').map(Number);
		const arrivalMinutes = arrH * 60 + arrM;
		const shiftMinutes = shiftH * 60 + shiftM;
		return arrivalMinutes - shiftMinutes;
	}

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

	let decisionModalOpen = $state(false);
	let decisionLoading = $state(false);
	let decisionError = $state<string | null>(null);
	let selectedDecisionRequestId = $state<string | null>(null);
	let selectedDecision = $state<LeaveDecision>('approve');
	let decisionNote = $state('');

	const decisionModalTitle = $derived.by(() =>
		selectedDecision === 'approve' ? m.leave_action_approve() : m.leave_action_reject()
	);

	function openDecisionModal(id: string, decision: LeaveDecision) {
		selectedDecisionRequestId = id;
		selectedDecision = decision;
		decisionNote = '';
		decisionError = null;
		decisionModalOpen = true;
	}

	function closeDecisionModal() {
		if (decisionLoading) return;
		decisionModalOpen = false;
		selectedDecisionRequestId = null;
		decisionError = null;
		decisionNote = '';
	}

	async function submitDecision() {
		if (!selectedDecisionRequestId) return;

		decisionLoading = true;
		decisionError = null;

		try {
			if (selectedDecision === 'approve') {
				await onApprove(selectedDecisionRequestId, decisionNote);
			} else {
				await onReject(selectedDecisionRequestId, decisionNote);
			}
			closeDecisionModal();
		} catch (error) {
			decisionError = error instanceof Error ? error.message : 'Failed to apply this decision.';
		} finally {
			decisionLoading = false;
		}
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
			{row.days === 1 ? m.leave_day_singular() : m.leave_day_plural()}
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
				onclick={() => openDecisionModal(row.id, 'reject')}
			>
				<XCircle class="h-3.5 w-3.5" />
				{m.leave_action_reject()}
			</button>
			<button
				class="flex h-8 items-center gap-1.5 rounded-lg bg-success px-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-success/90 active:scale-95"
				onclick={() => openDecisionModal(row.id, 'approve')}
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

{#snippet lateArrivalEmployeeCell(row: LateArrivalListItemResponse)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/10 text-xs font-semibold text-warning"
		>
			{row.employee_name
				.split(' ')
				.map((part) => part[0])
				.join('')
				.slice(0, 2)
				.toUpperCase()}
		</div>
		<p class="text-sm font-semibold text-text">{row.employee_name}</p>
	</div>
{/snippet}

{#snippet lateArrivalArrivalCell(row: LateArrivalListItemResponse)}
	<div class="text-sm">
		<p class="font-semibold text-text">
			{new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(
				new Date(row.arrival_date)
			)}
		</p>
		<p class="text-text-muted">{row.arrival_time}</p>
	</div>
{/snippet}

{#snippet lateArrivalLateCell(row: LateArrivalListItemResponse)}
	{@const minutesLate = getMinutesLate(row.arrival_time, row.shift_start_datetime)}
	{@const severity = minutesLate > 30 ? 'severe' : minutesLate > 15 ? 'moderate' : 'mild'}
	{@const severityColor =
		severity === 'severe'
			? 'border-red-500/30 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'
			: severity === 'moderate'
				? 'border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
				: 'border-warning/20 bg-warning/5 text-warning'}
	<span
		class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold {severityColor}"
	>
		{minutesLate} min
	</span>
{/snippet}

{#snippet lateArrivalShiftCell(row: LateArrivalListItemResponse)}
	<div class="text-sm">
		<p class="font-medium text-text">{row.shift_name}</p>
		{#if row.location_name}
			<p class="text-xs text-text-muted">{row.location_name}</p>
		{/if}
	</div>
{/snippet}

{#snippet lateArrivalReasonCell(row: LateArrivalListItemResponse)}
	{#if row.reason}
		<p class="line-clamp-1 cursor-help text-sm text-text-muted hover:text-text" title={row.reason}>
			{row.reason}
		</p>
	{:else}
		<p class="text-sm text-text-subtle">-</p>
	{/if}
{/snippet}

{#snippet lateArrivalFilters()}
	<div class="flex w-full flex-wrap items-center gap-3">
		<div class="relative w-full sm:w-64">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				placeholder={m.search_employees()}
				value={lateArrivalSearchQuery}
				oninput={(event) => {
					lateArrivalSearchQuery = (event.target as HTMLInputElement).value;
					lateArrivalCurrentPage = 1;
				}}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
			/>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<DatePicker label="Van" bind:value={lateArrivalDateFrom} compact />
			<DatePicker label="Tot" bind:value={lateArrivalDateTo} compact />
			{#if lateArrivalDateFrom || lateArrivalDateTo}
				<button
					class="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-text-muted transition-all hover:bg-border/30 hover:text-text"
					onclick={() => {
						lateArrivalDateFrom = '';
						lateArrivalDateTo = '';
						lateArrivalCurrentPage = 1;
					}}
				>
					{m.leave_action_delete()}
				</button>
			{/if}
		</div>
	</div>
{/snippet}

<div class="animate-in fade-in slide-in-from-bottom-2">
	<div
		class="bg-surface-subtle/30 mb-4 flex items-center gap-1 rounded-2xl border border-border/50 p-1"
	>
		<button
			onclick={() => (activeSubTab = 'requests')}
			class="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeSubTab ===
			'requests'
				? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
				: 'text-text-muted hover:bg-surface hover:text-text'}"
		>
			{m.leave_table_title()}
		</button>
		<button
			onclick={() => (activeSubTab = 'lateArrivals')}
			class="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeSubTab ===
			'lateArrivals'
				? 'bg-warning text-white shadow-sm'
				: 'text-text-muted hover:bg-surface hover:text-text'}"
		>
			<Clock class="h-4 w-4" />
			{m.late_tab_late()}
			{#if lateArrivalTotalCount > 0}
				<span
					class="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs"
					>{lateArrivalTotalCount}</span
				>
			{/if}
		</button>
	</div>

	{#if error}
		<div class="mb-4 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
			{error}
		</div>
	{/if}

	{#if activeSubTab === 'requests'}
		<DataTable
			{columns}
			rows={tableRows}
			{loading}
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
			{currentPage}
			{pageSize}
			{totalCount}
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
	{:else if activeSubTab === 'lateArrivals'}
		{#if lateArrivalError}
			<div class="mb-4 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
				{lateArrivalError}
			</div>
		{/if}
		<DataTable
			columns={lateArrivalColumns}
			rows={lateArrivalRows}
			loading={lateArrivalLoading}
			rowKey="id"
			title={m.late_tab_late()}
			description=""
			emptyTitle={m.late_empty()}
			emptyDescription=""
			surface="plain"
			headerInline
			currentPage={lateArrivalCurrentPage}
			pageSize={lateArrivalPageSize}
			totalCount={lateArrivalTotalCount}
			onPageChange={(page) => {
				lateArrivalCurrentPage = page;
			}}
			filters={lateArrivalFilters}
			cells={{
				employee: lateArrivalEmployeeCell,
				arrival: lateArrivalArrivalCell,
				late: lateArrivalLateCell,
				shift: lateArrivalShiftCell,
				reason: lateArrivalReasonCell
			}}
		/>
	{/if}
</div>

<Modal bind:open={decisionModalOpen} title={decisionModalTitle} description="" size="sm">
	<div class="space-y-4">
		<Textarea
			label={m.decision_notes_optional()}
			placeholder={m.decision_notes_placeholder()}
			bind:value={decisionNote}
			rows={4}
			disabled={decisionLoading}
		/>
		{#if decisionError}
			<p class="rounded-xl border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
				{decisionError}
			</p>
		{/if}
	</div>
	{#snippet footer()}
		<div class="flex items-center justify-end gap-2">
			<Button variant="ghost" onclick={closeDecisionModal} disabled={decisionLoading}>
				{m.leave_modal_cancel()}
			</Button>
			<Button onclick={submitDecision} isLoading={decisionLoading}>
				{selectedDecision === 'approve' ? m.leave_action_approve() : m.leave_action_reject()}
			</Button>
		</div>
	{/snippet}
</Modal>
