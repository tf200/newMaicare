<script lang="ts">
	import { resolve } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import {
		CalendarClock,
		CheckCircle2,
		XCircle,
		Clock,
		Calendar,
		UserRound,
		FolderClock,
		ChevronLeft,
		ChevronRight,
		Check,
		X
	} from 'lucide-svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { listEmployees } from '$lib/api/employees';
	import { setEventWorkApproval } from '$lib/api/events';
	import type { WorkApprovalQueueItemResponse, WorkApprovalStatus } from '$lib/types/api';
	import type { PageData } from './$types';

	interface Employee {
		id: string;
		name: string;
	}

	let { data } = $props<{ data: PageData }>();

	const approvalQueueDataPromise = $derived(data.approvalQueueData);
	let currentStatusFilter = $state<WorkApprovalStatus | 'all'>('all');
	let groupBy = $state<'date' | 'employee'>('date');
	const currentPage = $derived(data.initial.page);
	const pageSize = $derived(data.initial.pageSize);
	// svelte-ignore state_referenced_locally
	let selectedStartAt = $state(data.initial.filters.startAt.slice(0, 10));
	// svelte-ignore state_referenced_locally
	let selectedEndAt = $state(data.initial.filters.endAt.slice(0, 10));
	// svelte-ignore state_referenced_locally
	let selectedEmployeeId = $state(data.initial.filters.employeeIds[0] ?? '');
	const isOnlyEnded = $derived(data.initial.filters.onlyEnded);

	let actionLoading = $state<Record<string, boolean>>({});
	let rejectModalOpen = $state(false);
	let selectedAppointmentToReject = $state<WorkApprovalQueueItemResponse | null>(null);
	let rejectionReason = $state('');

	async function loadEmployeeOptions(query: string) {
		const res = await listEmployees({ search: query, pageSize: 20 });
		return res.data.results.map((emp) => ({
			label: `${emp.first_name} ${emp.last_name}`,
			value: emp.id
		}));
	}

	async function handleApprove(appointment: WorkApprovalQueueItemResponse) {
		const key = `${appointment.event_id}-${appointment.recurrence_id || 'master'}`;
		actionLoading[key] = true;
		try {
			await setEventWorkApproval(appointment.event_id, {
				status: 'approved',
				recurrence_id: appointment.recurrence_id
			});
			await invalidateAll();
		} catch (error) {
			console.error('Failed to approve appointment:', error);
			alert('Failed to approve appointment. Please try again.');
		} finally {
			actionLoading[key] = false;
		}
	}

	function openRejectModal(appointment: WorkApprovalQueueItemResponse) {
		selectedAppointmentToReject = appointment;
		rejectionReason = '';
		rejectModalOpen = true;
	}

	async function submitReject() {
		if (!selectedAppointmentToReject || !rejectionReason.trim()) return;

		const appointment = selectedAppointmentToReject;
		const key = `${appointment.event_id}-${appointment.recurrence_id || 'master'}`;
		actionLoading[key] = true;
		rejectModalOpen = false;

		try {
			await setEventWorkApproval(appointment.event_id, {
				status: 'rejected',
				recurrence_id: appointment.recurrence_id,
				rejection_reason: rejectionReason
			});
			await invalidateAll();
		} catch (error) {
			console.error('Failed to reject appointment:', error);
			alert('Failed to reject appointment. Please try again.');
		} finally {
			actionLoading[key] = false;
			selectedAppointmentToReject = null;
			rejectionReason = '';
		}
	}

	function formatDateTime(iso: string) {
		const date = new Date(iso);
		return {
			date: date.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric'
			}),
			time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
		};
	}

	function getDuration(start: string, end: string) {
		const diff = new Date(end).getTime() - new Date(start).getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		if (hours > 0) return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
		return `${minutes}m`;
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase();
	}

	function getStatusColors(status: WorkApprovalStatus) {
		switch (status) {
			case 'approved':
				return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
			case 'rejected':
				return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
			default:
				return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
		}
	}

	function collectEmployees(items: WorkApprovalQueueItemResponse[]): Employee[] {
		const byId: Record<string, Employee> = {};

		for (const item of items) {
			byId[item.organizer_employee.id] = item.organizer_employee;
			for (const attendee of item.attendee_employees) {
				byId[attendee.id] = attendee;
			}
		}

		return Object.values(byId).sort((a, b) => a.name.localeCompare(b.name));
	}

	function groupAppointments(
		items: WorkApprovalQueueItemResponse[],
		statusFilter: WorkApprovalStatus | 'all',
		employeeFilter: string,
		currentGroupBy: 'date' | 'employee'
	) {
		const filtered = items.filter((item) => {
			const statusMatch = statusFilter === 'all' || item.work_approval_status === statusFilter;
			const employeeMatch =
				employeeFilter === '' ||
				item.organizer_employee.id === employeeFilter ||
				item.attendee_employees.some((employee) => employee.id === employeeFilter);
			return statusMatch && employeeMatch;
		});

		filtered.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

		const groups: Record<string, WorkApprovalQueueItemResponse[]> = {};

		for (const item of filtered) {
			let key = '';
			if (currentGroupBy === 'date') {
				key = item.start_at.slice(0, 10);
			} else {
				key = item.organizer_employee.id;
			}

			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
		}

		const sortedGroups = Object.entries(groups).map(([key, groupItems]) => {
			const displayLabel =
				currentGroupBy === 'date'
					? new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', {
							weekday: 'long',
							month: 'long',
							day: 'numeric'
						})
					: groupItems[0].organizer_employee.name;

			return { key, displayLabel, items: groupItems };
		});

		if (currentGroupBy === 'date') {
			sortedGroups.sort((a, b) => b.key.localeCompare(a.key));
		} else {
			sortedGroups.sort((a, b) => a.displayLabel.localeCompare(b.displayLabel));
		}

		return sortedGroups;
	}

	function buildQuery(pageValue: number) {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		params.set('start_at', new Date(selectedStartAt).toISOString());
		params.set('end_at', new Date(selectedEndAt).toISOString());
		params.set('only_ended', String(isOnlyEnded));
		if (selectedEmployeeId) {
			params.set('employee_ids', selectedEmployeeId);
		}
		return params.toString();
	}

	function updateQuery(pageValue: number) {
		const nextQuery = buildQuery(pageValue);
		window.location.assign(resolve('/(app)/appointments') + `?${nextQuery}`);
	}
</script>

<svelte:head>
	<title>Appointments | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<header
		class="flex flex-col gap-6 rounded-3xl border border-border bg-surface/90 p-6 shadow-sm md:flex-row md:items-end md:justify-between"
	>
		<div class="space-y-2">
			<div class="flex items-center gap-3 text-sm font-semibold text-brand">
				<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
					<FolderClock class="h-5 w-5" />
				</span>
				<span>Workforce</span>
			</div>
			<h1 class="text-3xl font-bold tracking-tight text-text">Work Approvals</h1>
			<p class="max-w-2xl text-sm font-medium text-text-muted">
				Review completed appointments and their current work approval status.
			</p>
		</div>
	</header>

	{#await approvalQueueDataPromise}
		<div class="space-y-4">
			<div class="grid gap-3 sm:grid-cols-3">
				{#each [1, 2, 3] as item (item)}
					<div class="h-9 animate-pulse rounded-xl border border-border bg-surface/70"></div>
				{/each}
			</div>
			<div class="space-y-3">
				{#each [1, 2, 3, 4] as item (item)}
					<div class="h-28 animate-pulse rounded-2xl border border-border bg-surface/70"></div>
				{/each}
			</div>
		</div>
	{:then approvalsData}
		{#if approvalsData.loadError}
			<InlineErrorBanner title="Unable to load work approvals" message={approvalsData.loadError} />
		{/if}

		{@const appointments = approvalsData.items}
		{@const employees = collectEmployees(appointments)}
		{@const pendingCount = appointments.filter(
			(item: WorkApprovalQueueItemResponse) => item.work_approval_status === 'pending'
		).length}
		{@const groupedAppointments = groupAppointments(
			appointments,
			currentStatusFilter,
			selectedEmployeeId,
			groupBy
		)}
		{@const totalPages = Math.max(1, Math.ceil(approvalsData.total / pageSize))}
		{@const hasPreviousPage = currentPage > 1}
		{@const hasNextPage = currentPage < totalPages}

		<div class="flex flex-wrap items-center gap-3">
			{#if pendingCount > 0}
				<span
					class="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-400"
				>
					{pendingCount} Pending
				</span>
			{/if}
			<span
				class="inline-flex items-center justify-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-bold text-text-muted"
			>
				{approvalsData.total} Total
			</span>
		</div>

		<div class="flex flex-col items-center gap-3 py-2 sm:flex-row sm:justify-between">
			<div
				class="flex w-full shrink-0 rounded-xl border border-border bg-surface p-1 shadow-sm sm:w-auto"
			>
				<button
					onclick={() => (groupBy = 'date')}
					class="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all sm:flex-none
				{groupBy === 'date'
						? 'border border-border/50 bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
						: 'text-text-muted hover:text-text'}"
				>
					<Calendar class="h-4 w-4" />
					Date
				</button>
				<button
					onclick={() => (groupBy = 'employee')}
					class="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all sm:flex-none
				{groupBy === 'employee'
						? 'border border-border/50 bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
						: 'text-text-muted hover:text-text'}"
				>
					<UserRound class="h-4 w-4" />
					Employee
				</button>
			</div>

			<div class="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
				<div class="flex items-center gap-2">
					<DatePicker
						bind:value={selectedStartAt}
						onchange={() => updateQuery(1)}
						id="start-date"
						compact
					/>
					<span class="text-xs font-medium text-text-muted">to</span>
					<DatePicker
						bind:value={selectedEndAt}
						onchange={() => updateQuery(1)}
						id="end-date"
						compact
					/>
				</div>

				<div class="w-full sm:w-64">
					<SearchSelect
						bind:value={selectedEmployeeId}
						displayValue={employees.find((e) => e.id === selectedEmployeeId)?.name ?? ''}
						loadOptions={loadEmployeeOptions}
						placeholder="All Employees"
						onchange={() => updateQuery(1)}
						compact
					/>
				</div>

				<div
					class="flex w-full shrink-0 rounded-xl border border-border bg-surface p-1 shadow-sm sm:w-auto"
				>
					{#each ['all', 'pending', 'approved', 'rejected'] as status (status)}
						<button
							onclick={() => (currentStatusFilter = status as WorkApprovalStatus | 'all')}
							class="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition-all sm:flex-none
						{currentStatusFilter === status
								? 'bg-brand/10 text-brand'
								: 'text-text-muted hover:bg-border/50 hover:text-text'}"
						>
							{status}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div class="space-y-10">
			{#each groupedAppointments as group (group.key)}
				<div class="space-y-4">
					<div class="flex items-center gap-3 border-b border-border/60 pb-2">
						<h2 class="flex items-center gap-2 text-lg font-bold text-text">
							{#if groupBy === 'date'}
								<CalendarClock class="h-5 w-5 text-brand" />
							{:else}
								<div
									class="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand ring-1 ring-brand/20"
								>
									{getInitials(group.displayLabel)}
								</div>
							{/if}
							{group.displayLabel}
						</h2>
						<span
							class="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-semibold text-text-muted"
						>
							{group.items.length}
							{group.items.length === 1 ? 'entry' : 'entries'}
						</span>
					</div>

					<div class="space-y-3 pl-2 sm:pl-4">
						{#each group.items as appointment (appointment.event_id + (appointment.recurrence_id ?? ''))}
							{@const start = formatDateTime(appointment.start_at)}
							{@const end = formatDateTime(appointment.end_at)}
							<div
								class="relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm md:flex-row md:items-center"
							>
								<div class="flex min-w-55 items-center gap-4">
									{#if groupBy === 'date'}
										<div
											class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-zinc-100 text-sm font-bold tracking-wider text-zinc-600 shadow-inner dark:bg-zinc-800 dark:text-zinc-300"
										>
											{getInitials(appointment.organizer_employee.name)}
										</div>
										<div>
											<div class="text-sm leading-tight font-bold text-text">
												{appointment.organizer_employee.name}
											</div>
											<div class="mt-0.5 line-clamp-1 text-xs font-medium text-text-muted">
												{appointment.title}
											</div>
										</div>
									{:else}
										<div
											class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-brand/10 bg-brand/5 text-brand"
										>
											<span class="text-xs leading-none font-bold uppercase"
												>{start.date.split(' ')[0]}</span
											>
											<span class="mt-0.5 text-lg leading-none font-black"
												>{start.date.split(' ')[2]}</span
											>
										</div>
										<div>
											<div class="text-sm leading-tight font-bold text-text">
												{appointment.title}
											</div>
											<div
												class="mt-0.5 flex items-center gap-1 text-xs font-medium text-text-muted"
											>
												<Calendar class="h-3 w-3" />
												{start.date}
											</div>
										</div>
									{/if}
								</div>

								<div class="flex shrink-0 flex-col gap-1">
									<div class="flex items-center gap-2 text-sm font-medium text-text">
										<Clock class="h-4 w-4 text-brand/60" />
										{start.time} - {end.time}
									</div>
									<div class="pl-6 text-xs font-semibold text-text-muted">
										<span
											class="inline-flex items-center justify-center rounded-md border border-border/50 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-text-muted dark:bg-zinc-800"
										>
											{getDuration(appointment.start_at, appointment.end_at)}
										</span>
									</div>
								</div>

								<div class="flex min-w-40 flex-1 flex-col gap-1.5 md:px-6">
									<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
										Clients
									</span>
									<div class="flex flex-wrap gap-1.5">
										{#each appointment.attendee_clients as client (client.id)}
											<span
												class="inline-flex items-center rounded-md border border-zinc-200 bg-surface px-2 py-0.5 text-xs font-medium text-text dark:border-zinc-700/50"
											>
												{client.name}
											</span>
										{:else}
											<span class="text-xs text-text-muted italic">None</span>
										{/each}
									</div>
								</div>

								<div class="flex shrink-0 items-center justify-end gap-2 md:min-w-45">
									<div
										class="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 {getStatusColors(
											appointment.work_approval_status
										)}"
									>
										{#if appointment.work_approval_status === 'approved'}
											<CheckCircle2 class="h-4 w-4" />
										{:else if appointment.work_approval_status === 'rejected'}
											<XCircle class="h-4 w-4" />
										{:else}
											<Clock class="h-4 w-4" />
										{/if}
										<span class="text-xs font-bold tracking-wider uppercase"
											>{appointment.work_approval_status}</span
										>
									</div>

									{#if appointment.work_approval_status === 'pending'}
										<PermissionGuard permission="APPOINTMENT.WORK_APPROVAL.UPDATE">
											<div class="flex items-center gap-1 ml-1">
												<button
													type="button"
													onclick={() => handleApprove(appointment)}
													disabled={actionLoading[`${appointment.event_id}-${appointment.recurrence_id || 'master'}`]}
													class="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
													aria-label="Approve"
													title="Approve Appointment"
												>
													<Check class="h-4 w-4" />
												</button>
												<button
													type="button"
													onclick={() => openRejectModal(appointment)}
													disabled={actionLoading[`${appointment.event_id}-${appointment.recurrence_id || 'master'}`]}
													class="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
													aria-label="Reject"
													title="Reject Appointment"
												>
													<X class="h-4 w-4" />
												</button>
											</div>
										</PermissionGuard>
									{/if}

									{#if appointment.recurrence_id}
										<span
											class="inline-flex items-center rounded-full border border-border bg-surface px-2 py-1 text-[10px] font-semibold text-text-muted uppercase"
										>
											Recurring
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div
					class="flex flex-col items-center justify-center rounded-3xl border border-border border-dashed bg-surface py-24 text-center"
				>
					<div
						class="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-100 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-800/50"
					>
						<FolderClock class="h-10 w-10 text-text-muted" />
					</div>
					<h3 class="text-xl font-bold text-text">No appointments to review</h3>
					<p class="mt-2 max-w-sm text-sm text-text-muted">
						There are no work approval items matching your current filters.
					</p>
				</div>
			{/each}
		</div>

		<div
			class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-3"
		>
			<div class="text-xs font-medium text-text-muted">
				Page {currentPage} of {totalPages}
			</div>
			<div class="flex items-center gap-2">
				<button
					class="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-semibold text-text disabled:opacity-50"
					disabled={!hasPreviousPage}
					onclick={() => {
						if (!hasPreviousPage) return;
						const nextPage = currentPage - 1;
						updateQuery(nextPage);
					}}
				>
					<ChevronLeft class="h-4 w-4" />
					Previous
				</button>
				<button
					class="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-semibold text-text disabled:opacity-50"
					disabled={!hasNextPage}
					onclick={() => {
						if (!hasNextPage) return;
						const nextPage = currentPage + 1;
						updateQuery(nextPage);
					}}
				>
					Next
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/await}
</section>

<Modal bind:open={rejectModalOpen} title="Reject Appointment" description="Please provide a reason for rejecting this work approval." size="md">
	<div class="space-y-4">
		<p class="text-sm text-text-muted">
			This will be recorded and visible to the organizer.
		</p>
		<Textarea
			bind:value={rejectionReason}
			placeholder="Enter rejection reason..."
			required
			rows={4}
		/>
	</div>
	{#snippet footer()}
		<div class="flex items-center justify-end gap-3 w-full">
			<Button variant="ghost" onclick={() => (rejectModalOpen = false)}>Cancel</Button>
			<Button
				variant="destructive"
				onclick={submitReject}
				disabled={!rejectionReason.trim() || actionLoading[`${selectedAppointmentToReject?.event_id}-${selectedAppointmentToReject?.recurrence_id || 'master'}`]}
			>
				Confirm Rejection
			</Button>
		</div>
	{/snippet}
</Modal>
