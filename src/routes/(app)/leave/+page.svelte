<script lang="ts">
	import {
		Calendar,
		CalendarPlus,
		Clock,
		CheckCircle,
		XCircle,
		AlertCircle,
		Users,
		List,
		Stethoscope,
		Baby,
		AlarmClock,
		FileText,
		FileDown,
		Mail,
		ChevronLeft,
		ChevronRight,
		Euro,
		Search,
		TrendingUp,
		Zap
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import FilterDropdown from '$lib/components/ui/FilterDropdown.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import EmployeeSearch from '$lib/components/forms/EmployeeSearch.svelte';
	import ScheduleCalendar from '$lib/components/forms/ScheduleCalendar.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { EmployeeListItem } from '$lib/api/employees';

	type LeaveType = 'vacation' | 'sick' | 'personal' | 'training' | 'pregnancy';
	type LeaveStatus = 'pending' | 'approved' | 'rejected';

	interface Employee {
		id: string;
		name: string;
		role: string;
		department: string;
	}

	interface LeaveRequest {
		id: string;
		employeeId: string;
		type: LeaveType;
		startDate: string;
		endDate: string;
		days: number;
		hours: number;
		reason?: string;
		status: LeaveStatus;
	}

	interface LateArrival {
		id: string;
		employeeId: string;
		date: string;
		time: string;
		reason?: string;
	}

	type RequestFilter = 'all' | LeaveStatus;

interface RequestFilterPill {
	id: RequestFilter;
	label: string;
	badge: number | null;
}

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
		}
	};

	const statusConfig: Record<
		LeaveStatus,
		{ label: () => string; icon: typeof AlertCircle; color: string }
	> = {
		pending: { label: () => m.leave_status_pending(), icon: AlertCircle, color: 'text-warning' },
		approved: { label: () => m.leave_status_approved(), icon: CheckCircle, color: 'text-success' },
		rejected: { label: () => m.leave_status_rejected(), icon: XCircle, color: 'text-error' }
	};

	const employees: Employee[] = [
		{
			id: 'emp-1',
			name: 'Sanne Jansen',
			role: 'Verzorgende',
			department: 'Afdeling Noord'
		},
		{
			id: 'emp-2',
			name: 'Milan de Vries',
			role: 'Zorgcoordinator',
			department: 'Afdeling West'
		},
		{
			id: 'emp-3',
			name: 'Nora Bakker',
			role: 'Planning',
			department: 'Afdeling Oost'
		},
		{
			id: 'emp-4',
			name: 'Ravi Singh',
			role: 'Verpleegkundige',
			department: 'Afdeling Zuid'
		}
	];

	let leaveRequests = $state<LeaveRequest[]>([
		{
			id: 'leave-1',
			employeeId: 'emp-1',
			type: 'vacation',
			startDate: '2026-03-18',
			endDate: '2026-03-20',
			days: 3,
			hours: 24,
			reason: 'Weekend weg met familie.',
			status: 'pending'
		},
		{
			id: 'leave-2',
			employeeId: 'emp-2',
			type: 'sick',
			startDate: '2026-03-11',
			endDate: '2026-03-12',
			days: 2,
			hours: 16,
			reason: 'Ziekmelding om 07:30 - hersteld om 14:00.',
			status: 'approved'
		},
		{
			id: 'leave-3',
			employeeId: 'emp-4',
			type: 'training',
			startDate: '2026-03-21',
			endDate: '2026-03-21',
			days: 1,
			hours: 8,
			reason: 'Training wondzorg.',
			status: 'rejected'
		}
	]);

	let lateArrivals = $state<LateArrival[]>([
		{
			id: 'late-1',
			employeeId: 'emp-3',
			date: '2026-03-10',
			time: '08:20',
			reason: 'Vertraging in het OV.'
		}
	]);

	const employeeOptions = employees.map((employee) => ({
		label: `${employee.name} • ${employee.department}`,
		value: employee.id
	}));

	const leaveTypeOptions = $derived([
		{ label: m.leave_type_vacation(), value: 'vacation' },
		{ label: m.leave_type_personal(), value: 'personal' },
		{ label: m.leave_type_training(), value: 'training' }
	]);

	const columns: DataTableColumn[] = [
		{ key: 'employee', label: 'Medewerker' },
		{ key: 'type', label: 'Type' },
		{ key: 'period', label: 'Periode' },
		{ key: 'status', label: 'Status', align: 'center' },
		{ key: 'actions', label: '', align: 'right' }
	];

	const validTabs = ['aanvragen', 'ziekmelding', 'zwangerschap', 'telaat', 'overzicht', 'saldo', 'uitbetalen', 'contractwijzigingen'] as const;
	type TabId = (typeof validTabs)[number];

	function getInitialTab(): TabId {
		if (typeof window !== 'undefined') {
			const hash = window.location.hash.replace('#', '');
			const params = new URLSearchParams(hash);
			const tab = params.get('tab');
			if (tab && (validTabs as readonly string[]).includes(tab)) return tab as TabId;
		}
		return 'aanvragen';
	}

	let activeTab = $state<TabId>(getInitialTab());

	$effect(() => {
		if (typeof window !== 'undefined') {
			window.location.hash = `tab=${activeTab}`;
		}
	});
	let requestFilter = $state<RequestFilter>('all');
	let searchQuery = $state('');
	let selectedDepartmentFilter = $state<string | null>(null);
	let selectedTypeFilter = $state<LeaveType | null>(null);
	let dateRangeStart = $state('');
	let dateRangeEnd = $state('');
	let deleteDialogOpen = $state(false);
	let selectedRequestId = $state<string | null>(null);
	let currentMonth = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
	let emailDialogOpen = $state(false);
	let emailAddress = $state('');
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	let newRequest = $state({
		employeeId: '',
		type: 'vacation' as LeaveType,
		startDate: '',
		endDate: '',
		reason: ''
	});
	let selectedEmployeeFromSearch = $state<EmployeeListItem | null>(null);
	let selectedSickEmployee = $state<EmployeeListItem | null>(null);
	let selectedPregnancyEmployee = $state<EmployeeListItem | null>(null);
	let selectedLateEmployee = $state<EmployeeListItem | null>(null);
	let sickCalendarStart = $state<string | null>(null);
	let sickCalendarEnd = $state<string | null>(null);
	let lateCalendarStart = $state<string | null>(null);
	let lateCalendarEnd = $state<string | null>(null);

	let sickRequest = $state({
		employeeId: '',
		date: '',
		startTime: '',
		endTime: '',
		reason: ''
	});

	let pregnancyRequest = $state({
		employeeId: '',
		startDate: '',
		endDate: '',
		reason: ''
	});

	let lateRequest = $state({
		employeeId: '',
		date: '',
		time: '',
		reason: ''
	});

	const pendingCount = $derived.by(
		() => leaveRequests.filter((r) => r.status === 'pending').length
	);
	const approvedCount = $derived.by(
		() => leaveRequests.filter((r) => r.status === 'approved').length
	);
	const sickCount = $derived.by(() => leaveRequests.filter((r) => r.type === 'sick').length);
	const rejectedCount = $derived.by(
		() => leaveRequests.filter((r) => r.status === 'rejected').length
	);
	const filteredPendingCount = $derived.by(
		() => filteredRequests.filter((r) => r.status === 'pending').length
	);
	const filteredApprovedCount = $derived.by(
		() => filteredRequests.filter((r) => r.status === 'approved').length
	);
	const filteredRejectedCount = $derived.by(
		() => filteredRequests.filter((r) => r.status === 'rejected').length
	);
	const filteredSickCount = $derived.by(
		() => filteredRequests.filter((r) => r.type === 'sick').length
	);

	const requestFilterPills = $derived.by<RequestFilterPill[]>(() => [
		{ id: 'all', label: m.all(), badge: null },
		{ id: 'pending', label: m.pending(), badge: pendingCount || null },
		{ id: 'approved', label: m.leave_stats_approved(), badge: approvedCount || null },
		{ id: 'rejected', label: m.leave_stats_rejected(), badge: rejectedCount || null }
	]);

	const filteredRequests = $derived.by(() => {
		let results =
			requestFilter === 'all'
				? leaveRequests
				: leaveRequests.filter((r) => r.status === requestFilter);

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			results = results.filter((r) => getEmployeeName(r.employeeId).toLowerCase().includes(query));
		}

		// Apply department filter
		if (selectedDepartmentFilter) {
			results = results.filter((r) => {
				const emp = employees.find((e) => e.id === r.employeeId);
				return emp?.department === selectedDepartmentFilter;
			});
		}

		// Apply type filter
		if (selectedTypeFilter) {
			results = results.filter((r) => r.type === selectedTypeFilter);
		}

		// Apply date range filter
		if (dateRangeStart && dateRangeEnd) {
			const start = new Date(dateRangeStart);
			const end = new Date(dateRangeEnd);
			results = results.filter((r) => {
				const reqStart = new Date(r.startDate);
				const reqEnd = new Date(r.endDate);
				return !(reqEnd < start || reqStart > end);
			});
		}

		return results;
	});

	const departments = $derived.by(() => Array.from(new Set(employees.map((e) => e.department))));

	const hasActiveFilters = $derived.by(
		() =>
			searchQuery.trim() !== '' ||
			selectedDepartmentFilter !== null ||
			selectedTypeFilter !== null ||
			dateRangeStart !== '' ||
			dateRangeEnd !== ''
	);

	type OverviewFilterState = Record<string, boolean | string | number | undefined>;
	type OverviewFilterItem = { key: string; label: string; type?: 'checkbox' | 'date' };
	type OverviewFilterGroup = { label: string; items: OverviewFilterItem[] };

	const overviewFilterGroups = $derived.by<OverviewFilterGroup[]>(() => [
		{
			label: m.department(),
			items: departments.map((department) => ({
				key: `department_${department}`,
				label: department
			}))
		},
		{
			label: m.leave_type_label(),
			items: leaveTypeOptions.map((type) => ({
				key: `type_${type.value}`,
				label: type.label
			}))
		},
		{
			label: m.leave_date_range_label(),
			items: [
				{ key: 'date_from', label: m.leave_date_from(), type: 'date' },
				{ key: 'date_to', label: m.leave_date_to(), type: 'date' }
			]
		}
	]);

	const overviewFilters = $derived.by<OverviewFilterState>(() => {
		const filters: OverviewFilterState = {
			date_from: dateRangeStart,
			date_to: dateRangeEnd
		};

		for (const department of departments) {
			filters[`department_${department}`] = selectedDepartmentFilter === department || undefined;
		}

		for (const type of leaveTypeOptions) {
			filters[`type_${type.value}`] = selectedTypeFilter === type.value || undefined;
		}

		return filters;
	});

	function handleOverviewFilterUpdate(nextFilters: OverviewFilterState) {
		const nextDepartment =
			departments.find((department) => Boolean(nextFilters[`department_${department}`])) ?? null;
		const nextType =
			(leaveTypeOptions.find((type) => Boolean(nextFilters[`type_${type.value}`]))?.value as LeaveType | undefined) ??
			null;

		selectedDepartmentFilter = nextDepartment;
		selectedTypeFilter = nextType;
		dateRangeStart = typeof nextFilters.date_from === 'string' ? nextFilters.date_from : '';
		dateRangeEnd = typeof nextFilters.date_to === 'string' ? nextFilters.date_to : '';
	}

	function getFilterPillClass(pillId: RequestFilter) {
		if (pillId === 'all') {
			return requestFilter === pillId
				? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'pending') {
			return requestFilter === pillId
				? 'border border-amber-600/40 bg-amber-500 text-white shadow-sm shadow-amber-600/25'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'approved') {
			return requestFilter === pillId
				? 'border border-emerald-700/40 bg-emerald-600 text-white shadow-sm shadow-emerald-700/25'
				: 'border border-border text-text-muted hover:text-text';
		}
		return requestFilter === pillId
			? 'border border-rose-700/40 bg-rose-600 text-white shadow-sm shadow-rose-700/25'
			: 'border border-border text-text-muted hover:text-text';
	}

	function clearAllFilters() {
		searchQuery = '';
		selectedDepartmentFilter = null;
		selectedTypeFilter = null;
		dateRangeStart = '';
		dateRangeEnd = '';
		requestFilter = 'all';
	}

	const leaveBalances = [
		{ name: 'Sanne Jansen', department: 'Afdeling Noord', budget: 144, used: 32 },
		{ name: 'Milan de Vries', department: 'Afdeling West', budget: 160, used: 56 },
		{ name: 'Nora Bakker', department: 'Afdeling Oost', budget: 120, used: 24 }
	];

	const payoutRequests = [
		{ id: 'pay-1', employee: 'Ravi Singh', hours: 24, status: 'In behandeling' },
		{ id: 'pay-2', employee: 'Nina Visser', hours: 12, status: 'Goedgekeurd' }
	];

	const contractChanges = [
		{ id: 'change-1', employee: 'Sanne Jansen', fromHours: 24, toHours: 32, date: '2026-02-15' },
		{ id: 'change-2', employee: 'Milan de Vries', fromHours: 36, toHours: 32, date: '2026-02-28' }
	];

	function setToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
		toast = { message, type };
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			toast = null;
		}, 3500);
	}

	function formatMonth(date: Date) {
		return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(date);
	}

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

	function addLeaveRequest(payload: Omit<LeaveRequest, 'id' | 'status'>) {
		const id = crypto.randomUUID();
		leaveRequests = [{ ...payload, id, status: 'pending' }, ...leaveRequests];
		setToast(m.leave_toast_added(), 'success');
	}

	function handleCreateLeave(event: Event) {
		event.preventDefault();
		const days = calculateDays(newRequest.startDate, newRequest.endDate);
		if (!newRequest.employeeId || days === 0) {
			setToast(m.leave_toast_missing_employee_dates(), 'warning');
			return;
		}
		addLeaveRequest({
			employeeId: newRequest.employeeId,
			type: newRequest.type,
			startDate: newRequest.startDate,
			endDate: newRequest.endDate,
			days,
			hours: days * 8,
			reason: newRequest.reason
		});
		newRequest = { employeeId: '', type: 'vacation', startDate: '', endDate: '', reason: '' };
	}

	function handleCreateSick(event: Event) {
		event.preventDefault();
		if (!sickRequest.employeeId || !sickRequest.date || !sickRequest.startTime) {
			setToast(m.leave_toast_missing_sick_fields(), 'warning');
			return;
		}
		const reasonDetail = sickRequest.reason
			? `Ziekmelding om ${sickRequest.startTime}${sickRequest.endTime ? ` - hersteld om ${sickRequest.endTime}` : ''}. ${sickRequest.reason}`
			: `Ziekmelding om ${sickRequest.startTime}${sickRequest.endTime ? ` - hersteld om ${sickRequest.endTime}` : ''}.`;
		addLeaveRequest({
			employeeId: sickRequest.employeeId,
			type: 'sick',
			startDate: sickRequest.date,
			endDate: sickRequest.date,
			days: 1,
			hours: 8,
			reason: reasonDetail
		});
		sickRequest = { employeeId: '', date: '', startTime: '', endTime: '', reason: '' };
	}

	function handleCreatePregnancy(event: Event) {
		event.preventDefault();
		const days = calculateDays(pregnancyRequest.startDate, pregnancyRequest.endDate);
		if (!pregnancyRequest.employeeId || days === 0) {
			setToast(m.leave_toast_missing_pregnancy_fields(), 'warning');
			return;
		}
		addLeaveRequest({
			employeeId: pregnancyRequest.employeeId,
			type: 'pregnancy',
			startDate: pregnancyRequest.startDate,
			endDate: pregnancyRequest.endDate,
			days,
			hours: days * 8,
			reason: pregnancyRequest.reason
		});
		pregnancyRequest = { employeeId: '', startDate: '', endDate: '', reason: '' };
	}

	function handleCreateLate(event: Event) {
		event.preventDefault();
		if (!lateRequest.employeeId || !lateRequest.date || !lateRequest.time) {
			setToast(m.leave_toast_missing_late_fields(), 'warning');
			return;
		}
		lateArrivals = [
			{
				id: crypto.randomUUID(),
				employeeId: lateRequest.employeeId,
				date: lateRequest.date,
				time: lateRequest.time,
				reason: lateRequest.reason
			},
			...lateArrivals
		];
		setToast(m.leave_toast_late_added(), 'success');
		lateRequest = { employeeId: '', date: '', time: '', reason: '' };
	}

	function handleApprove(id: string) {
		leaveRequests = leaveRequests.map((request) =>
			request.id === id ? { ...request, status: 'approved' } : request
		);
		setToast(m.leave_toast_approved(), 'success');
	}

	function handleReject(id: string) {
		leaveRequests = leaveRequests.map((request) =>
			request.id === id ? { ...request, status: 'rejected' } : request
		);
		setToast(m.leave_toast_rejected(), 'warning');
	}

	function handleDeleteClick(id: string) {
		selectedRequestId = id;
		deleteDialogOpen = true;
	}

	function handleDeleteConfirm() {
		if (!selectedRequestId) return;
		leaveRequests = leaveRequests.filter((request) => request.id !== selectedRequestId);
		deleteDialogOpen = false;
		selectedRequestId = null;
		setToast(m.leave_toast_deleted(), 'warning');
	}

	function handleDownloadPdf() {
		setToast(m.leave_toast_pdf_ready(), 'success');
	}

	function handleSendEmail() {
		if (!emailAddress) {
			setToast(m.leave_toast_email_missing(), 'warning');
			return;
		}
		setToast(m.leave_toast_pdf_sent({ email: emailAddress }), 'success');
		emailAddress = '';
		emailDialogOpen = false;
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	function prevMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}

	function getEmployeeName(employeeId: string) {
		return employees.find((employee) => employee.id === employeeId)?.name ?? 'Onbekend';
	}
</script>

<svelte:head>
	<title>{m.leave_page_title()} | MaiCare</title>
</svelte:head>

{#snippet requestFilters()}
	<div class="flex w-full flex-wrap items-center justify-start gap-4">
		<div class="relative w-full sm:w-64">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				placeholder={m.search_employees()}
				bind:value={searchQuery}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
			/>
		</div>

		<FilterDropdown
			filters={overviewFilters}
			groups={overviewFilterGroups}
			title="Filters"
			buttonLabel="Filters"
			clearLabel={m.swap_clear_filters()}
			onUpdate={handleOverviewFilterUpdate}
			onClear={clearAllFilters}
		/>

		<div class="hidden h-6 w-px bg-border sm:block"></div>

		<div class="flex flex-wrap items-center gap-2">
			{#each requestFilterPills as pill}
				<button
					onclick={() => (requestFilter = pill.id)}
					class="h-9 rounded-full px-4 text-xs font-semibold transition-all {getFilterPillClass(pill.id)}"
				>
					{pill.label}
					{#if pill.badge}
						<span
							class="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-black/10 px-1 text-[9px] font-bold text-current"
						>
							{pill.badge}
						</span>
					{/if}
				</button>
			{/each}

				{#if hasActiveFilters}
					<button
						class="h-9 shrink-0 rounded-full border border-error/20 bg-error/5 px-4 text-xs font-semibold text-error transition-all hover:bg-error/10"
						onclick={clearAllFilters}
					>
						{m.swap_clear_filters()}
					</button>
				{/if}
		</div>
	</div>
{/snippet}

{#snippet employeeCell(row: LeaveRequest)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-xs font-semibold text-brand"
		>
			{getEmployeeName(row.employeeId)
				.split(' ')
				.map((part) => part[0])
				.join('')
				.slice(0, 2)
				.toUpperCase()}
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{getEmployeeName(row.employeeId)}</p>
			<p class="text-xs text-text-muted">
				{employees.find((employee) => employee.id === row.employeeId)?.role ?? ''}
			</p>
		</div>
	</div>
{/snippet}

{#snippet typeCell(row: LeaveRequest)}
	<span
		class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold {leaveTypeConfig[
			row.type
		].className}"
	>
		{leaveTypeConfig[row.type].label()}
	</span>
{/snippet}

{#snippet periodCell(row: LeaveRequest)}
	<div class="text-sm">
		<p class="font-semibold text-text">
			{formatDate(row.startDate)} - {formatDate(row.endDate)}
		</p>
		<p class="text-text-muted">
			{row.days}
			{row.days === 1 ? 'dag' : 'dagen'} ({row.hours} uur)
		</p>
	</div>
{/snippet}

{#snippet statusCell(row: LeaveRequest)}
	{@const statusMeta = statusConfig[row.status]}
	<span class="inline-flex items-center gap-2 text-xs font-semibold {statusMeta.color}">
		<statusMeta.icon class="h-4 w-4" />
		{statusMeta.label()}
	</span>
{/snippet}

{#snippet actionsCell(row: LeaveRequest)}
	<div class="flex items-center justify-end gap-1">
		{#if row.status === 'pending'}
			<button
				class="flex h-6 items-center gap-0.5 rounded-md border border-error/20 bg-error/5 px-1.5 text-[10px] font-semibold text-error transition-all hover:bg-error/10"
				onclick={() => handleReject(row.id)}
			>
				<XCircle class="h-2.5 w-2.5" />
				{m.leave_action_reject()}
			</button>
			<button
				class="flex h-6 items-center gap-0.5 rounded-md border border-success/20 bg-success/5 px-1.5 text-[10px] font-semibold text-success transition-all hover:bg-success/10"
				onclick={() => handleApprove(row.id)}
			>
				<CheckCircle class="h-2.5 w-2.5" />
				{m.leave_action_approve()}
			</button>
		{/if}
		<button
			class="flex h-6 items-center gap-0.5 rounded-md px-1.5 text-[10px] font-semibold text-text-muted transition-all hover:bg-border/30 hover:text-text"
			onclick={() => handleDeleteClick(row.id)}
		>
			{m.leave_action_delete()}
		</button>
	</div>
{/snippet}

<section class="space-y-6">
	<header class="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm">
		<div class="flex flex-col gap-6">
			<!-- Header Top -->
			<div class="flex flex-wrap items-start justify-between gap-6">
				<div class="space-y-2">
					<div class="flex items-center gap-3 text-sm font-semibold text-brand">
						<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
							<Calendar class="h-5 w-5" />
						</span>
						<span>{m.leave_management_label()}</span>
					</div>
					<h1 class="text-3xl font-bold tracking-tighter text-text">{m.leave_page_heading()}</h1>
					<p class="max-w-2xl text-sm font-medium text-text-muted">
						{m.leave_page_subtitle()}
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<div class="flex items-center gap-1 rounded-2xl border border-border/60 bg-surface p-1">
						<button
							class="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-border/40 hover:text-text"
							onclick={prevMonth}
						>
							<ChevronLeft class="h-4 w-4" />
						</button>
						<span class="min-w-[140px] text-center text-sm font-semibold text-text capitalize">
							{formatMonth(currentMonth)}
						</span>
						<button
							class="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-border/40 hover:text-text"
							onclick={nextMonth}
						>
							<ChevronRight class="h-4 w-4" />
						</button>
					</div>
					<Button variant="ghost" class="rounded-xl" onclick={handleDownloadPdf}>
						<FileDown class="h-4 w-4" />
						{m.export_pdf()}
					</Button>
					<Button variant="ghost" class="rounded-xl" onclick={() => (emailDialogOpen = true)}>
						<Mail class="h-4 w-4" />
						{m.leave_email_action()}
					</Button>
				</div>
			</div>

		</div>
	</header>
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="absolute -right-4 -bottom-4 text-warning opacity-[0.04]">
				<Clock class="h-32 w-32" />
			</div>
			<div class="relative">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.leave_stats_open()}
				</div>
				<div class="mt-2 text-3xl font-bold tracking-tight text-text">{pendingCount}</div>
				<p class="mt-1 text-xs font-medium text-text-muted">{m.leave_stats_open_sub()}</p>
			</div>
		</div>
		<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="absolute -right-4 -bottom-4 text-success opacity-[0.04]">
				<CheckCircle class="h-32 w-32" />
			</div>
			<div class="relative">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.leave_stats_approved()}
				</div>
				<div class="mt-2 text-3xl font-bold tracking-tight text-text">{approvedCount}</div>
				<p class="mt-1 text-xs font-medium text-text-muted">{m.leave_stats_approved_sub()}</p>
			</div>
		</div>
		<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="absolute -right-4 -bottom-4 text-error opacity-[0.04]">
				<XCircle class="h-32 w-32" />
			</div>
			<div class="relative">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.leave_stats_rejected()}
				</div>
				<div class="mt-2 text-3xl font-bold tracking-tight text-text">{rejectedCount}</div>
				<p class="mt-1 text-xs font-medium text-text-muted">{m.leave_stats_rejected_sub()}</p>
			</div>
		</div>
		<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="absolute -right-4 -bottom-4 text-error opacity-[0.04]">
				<Stethoscope class="h-32 w-32" />
			</div>
			<div class="relative">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{m.leave_stats_sick()}
				</div>
				<div class="mt-2 text-3xl font-bold tracking-tight text-text">{sickCount}</div>
				<p class="mt-1 text-xs font-medium text-text-muted">{m.leave_stats_sick_sub()}</p>
			</div>
		</div>
	</div>
	<div class="animate-in fade-in overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
		<div class="lg:flex">
			<!-- ── Sidebar nav (desktop) / Horizontal scroll (mobile) ──── -->
			<nav class="shrink-0 border-b border-border/60 lg:w-60 lg:border-r lg:border-b-0">
				<!-- Mobile: horizontal scroll -->
				<div class="flex gap-1 overflow-x-auto p-2 lg:hidden">
					{#each [
						{ id: 'aanvragen', icon: CalendarPlus, label: m.leave_tab_request(), color: 'brand' },
						{ id: 'ziekmelding', icon: Stethoscope, label: m.leave_tab_sick(), color: 'error' },
						{ id: 'zwangerschap', icon: Baby, label: m.leave_tab_pregnancy(), color: 'pink-500' },
						{ id: 'telaat', icon: AlarmClock, label: m.leave_tab_late(), color: 'warning' },
						{ id: 'overzicht', icon: List, label: m.leave_tab_overview(), color: 'brand' },
						{ id: 'saldo', icon: Users, label: m.leave_tab_balance(), color: 'brand' },
						{ id: 'uitbetalen', icon: Euro, label: m.leave_tab_payout(), color: 'brand' },
						{ id: 'contractwijzigingen', icon: FileText, label: m.leave_tab_contract(), color: 'brand' }
					] as tab}
						<button
							onclick={() => (activeTab = tab.id as any)}
							class="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all
								{activeTab === tab.id ? 'bg-brand/10 text-brand shadow-sm' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}"
						>
							<tab.icon class="h-3.5 w-3.5" />
							{tab.label}
							{#if tab.id === 'overzicht' && pendingCount > 0}
								<span class="flex h-4 w-4 items-center justify-center rounded-full bg-warning/20 text-[9px] font-bold text-warning">{pendingCount}</span>
							{/if}
						</button>
					{/each}
				</div>

				<!-- Desktop: vertical sidebar -->
				<div class="hidden lg:block">
					<!-- Form actions section -->
					<div class="p-3">
						<p class="mb-2 px-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">Acties</p>
						<div class="space-y-0.5">
							<button
								onclick={() => (activeTab = 'aanvragen')}
								class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all
									{activeTab === 'aanvragen' ? 'bg-brand/8 text-brand shadow-sm' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}"
							>
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {activeTab === 'aanvragen' ? 'bg-brand/15 text-brand' : 'bg-surface-subtle text-text-muted group-hover:text-brand'} transition-colors">
									<CalendarPlus class="h-4 w-4" />
								</div>
								<div class="min-w-0">
									<p class="truncate text-sm font-semibold">{m.leave_tab_request()}</p>
									<p class="truncate text-[10px] text-text-subtle">{m.leave_new_request_subtitle()}</p>
								</div>
							</button>

							<button
								onclick={() => (activeTab = 'ziekmelding')}
								class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all
									{activeTab === 'ziekmelding' ? 'bg-error/8 text-error shadow-sm' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}"
							>
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {activeTab === 'ziekmelding' ? 'bg-error/15 text-error' : 'bg-surface-subtle text-text-muted group-hover:text-error'} transition-colors">
									<Stethoscope class="h-4 w-4" />
								</div>
								<div class="min-w-0">
									<p class="truncate text-sm font-semibold">{m.leave_tab_sick()}</p>
									<p class="truncate text-[10px] text-text-subtle">{m.sick_report_subtitle()}</p>
								</div>
							</button>

							<button
								onclick={() => (activeTab = 'zwangerschap')}
								class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all
									{activeTab === 'zwangerschap' ? 'bg-pink-500/8 text-pink-600 shadow-sm dark:text-pink-400' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}"
							>
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {activeTab === 'zwangerschap' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-surface-subtle text-text-muted group-hover:text-pink-500'} transition-colors">
									<Baby class="h-4 w-4" />
								</div>
								<div class="min-w-0">
									<p class="truncate text-sm font-semibold">{m.leave_tab_pregnancy()}</p>
									<p class="truncate text-[10px] text-text-subtle">{m.pregnancy_subtitle()}</p>
								</div>
							</button>

							<button
								onclick={() => (activeTab = 'telaat')}
								class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all
									{activeTab === 'telaat' ? 'bg-warning/8 text-warning shadow-sm' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}"
							>
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {activeTab === 'telaat' ? 'bg-warning/15 text-warning' : 'bg-surface-subtle text-text-muted group-hover:text-warning'} transition-colors">
									<AlarmClock class="h-4 w-4" />
								</div>
								<div class="min-w-0">
									<p class="truncate text-sm font-semibold">{m.leave_tab_late()}</p>
									<p class="truncate text-[10px] text-text-subtle">{m.late_subtitle()}</p>
								</div>
							</button>
						</div>
					</div>

					<div class="mx-3 border-t border-border/50"></div>

					<!-- Data views section -->
					<div class="p-3">
						<p class="mb-2 px-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">Overzichten</p>
						<div class="space-y-0.5">
							<button
								onclick={() => (activeTab = 'overzicht')}
								class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all
									{activeTab === 'overzicht' ? 'bg-brand/8 text-brand shadow-sm' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}"
							>
								<List class="h-4 w-4 shrink-0" />
								<span class="truncate text-sm font-medium">{m.leave_tab_overview()}</span>
								{#if pendingCount > 0}
									<span class="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/20 text-[10px] font-semibold text-warning">{pendingCount}</span>
								{/if}
							</button>

							<button
								onclick={() => (activeTab = 'saldo')}
								class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all
									{activeTab === 'saldo' ? 'bg-brand/8 text-brand shadow-sm' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}"
							>
								<Users class="h-4 w-4 shrink-0" />
								<span class="truncate text-sm font-medium">{m.leave_tab_balance()}</span>
							</button>

							<button
								onclick={() => (activeTab = 'uitbetalen')}
								class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all
									{activeTab === 'uitbetalen' ? 'bg-brand/8 text-brand shadow-sm' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}"
							>
								<Euro class="h-4 w-4 shrink-0" />
								<span class="truncate text-sm font-medium">{m.leave_tab_payout()}</span>
							</button>

							<button
								onclick={() => (activeTab = 'contractwijzigingen')}
								class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all
									{activeTab === 'contractwijzigingen' ? 'bg-brand/8 text-brand shadow-sm' : 'text-text-muted hover:bg-surface-subtle hover:text-text'}"
							>
								<FileText class="h-4 w-4 shrink-0" />
								<span class="truncate text-sm font-medium">{m.leave_tab_contract()}</span>
							</button>
						</div>
					</div>
				</div>
			</nav>

			<!-- ── Content pane ────────────────────────────────────────── -->
			<div class="min-w-0 flex-1 p-6">
			{#if activeTab === 'aanvragen'}
				<form
					class="grid gap-6 {selectedEmployeeFromSearch
						? 'lg:grid-cols-[1.5fr_1fr]'
						: 'lg:grid-cols-[2fr_1fr]'}"
					onsubmit={handleCreateLeave}
				>
					<!-- Left: Form -->
					<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
						<div class="mb-5 flex items-center gap-3">
							<div class="rounded-xl bg-brand/10 p-2 text-brand">
								<CalendarPlus class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-semibold text-text">{m.leave_new_request_title()}</h2>
								<p class="text-xs text-text-muted">{m.leave_new_request_subtitle()}</p>
							</div>
						</div>
						<div class="space-y-5">
							<!-- Employee Search Component -->
							<EmployeeSearch
								labelText={m.leave_employee_select_label()}
								placeholder={m.leave_employee_search_placeholder()}
								bind:selectedId={newRequest.employeeId}
								onSelect={(emp) => {
									selectedEmployeeFromSearch = emp;
								}}
							/>

							{#if selectedEmployeeFromSearch}
								<div class="bg-surface-subtle/40 space-y-4 rounded-2xl border border-border/60 p-4">
									<!-- Type Select -->
									<div>
										<label for="leave-type" class="ml-1 text-xs font-semibold text-text-muted"
											>{m.leave_type_label()}</label
										>
										<select
											id="leave-type"
											bind:value={newRequest.type}
											class="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text outline-hidden transition-all focus:ring-2 focus:ring-brand/20"
										>
											{#each leaveTypeOptions as type}
												<option value={type.value}>{type.label}</option>
											{/each}
										</select>
									</div>

									<!-- Date Range Display -->
									<div class="space-y-2">
										<div class="ml-1 text-xs font-semibold text-text-muted">
											{m.leave_date_range_label()}
										</div>
										<div class="grid gap-3 sm:grid-cols-2">
											<div class="rounded-xl border border-border/60 bg-surface px-3 py-3 text-sm">
												<p class="mb-1 text-xs text-text-muted">{m.leave_date_from()}</p>
												<p class="font-semibold text-text">
													{newRequest.startDate
														? new Date(newRequest.startDate).toLocaleDateString('nl-NL')
														: 'Selecteren'}
												</p>
											</div>
											<div class="rounded-xl border border-border/60 bg-surface px-3 py-3 text-sm">
												<p class="mb-1 text-xs text-text-muted">{m.leave_date_to()}</p>
												<p class="font-semibold text-text">
													{newRequest.endDate
														? new Date(newRequest.endDate).toLocaleDateString('nl-NL')
														: 'Selecteren'}
												</p>
											</div>
										</div>
									</div>
								</div>

								<!-- Reason Textarea -->
								<Textarea
									label={m.leave_reason_label()}
									bind:value={newRequest.reason}
									placeholder={m.leave_reason_placeholder()}
								/>

								<!-- Days Calculator -->
								<div
									class="flex items-center justify-between rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand"
								>
									<div class="flex items-center gap-2">
										<Zap class="h-4 w-4" />
										<span
											>{calculateDays(newRequest.startDate, newRequest.endDate)}
											{calculateDays(newRequest.startDate, newRequest.endDate) === 1
												? m.leave_day_singular()
												: m.leave_day_plural()}</span
										>
									</div>
									<span
										>{calculateDays(newRequest.startDate, newRequest.endDate) * 8}
										{m.leave_hours_short()}</span
									>
								</div>

								<!-- Submit Button -->
								<Button type="submit" class="w-full gap-2 py-3">
									<CheckCircle class="h-4 w-4" />
									{m.leave_submit_request()}
								</Button>
							{:else}
								<div
									class="bg-surface-subtle/30 rounded-2xl border border-dashed border-border/50 px-4 py-8 text-center text-sm text-text-muted"
								>
									{m.leave_select_employee_prompt()}
								</div>
							{/if}
						</div>
					</div>

					<!-- Right: Calendar or Guidelines -->
					{#if selectedEmployeeFromSearch}
						<!-- Calendar appears here when employee is selected -->
						<ScheduleCalendar
							selectedEmployee={selectedEmployeeFromSearch}
							bind:selectedStartDate={newRequest.startDate}
							bind:selectedEndDate={newRequest.endDate}
							onDateRangeSelect={(start, end) => {
								newRequest.startDate = start;
								newRequest.endDate = end;
							}}
						/>
					{:else}
						<!-- Guidelines shown before employee selection -->
						<div class="space-y-4">
							<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
								<div
									class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-text-subtle uppercase"
								>
									<AlertCircle class="h-4 w-4 text-brand" />
									{m.leave_guidelines_title()}
								</div>
								<h3 class="mt-2 text-sm font-semibold text-text">{m.leave_guidelines_title()}</h3>
								<ul class="mt-4 space-y-3 text-sm text-text-muted">
									<li class="flex gap-2">
										<span class="font-bold text-brand">•</span>
										<span>{m.leave_guideline_1()}</span>
									</li>
									<li class="flex gap-2">
										<span class="font-bold text-brand">•</span>
										<span>{m.leave_guideline_2()}</span>
									</li>
									<li class="flex gap-2">
										<span class="font-bold text-brand">•</span>
										<span>{m.leave_guideline_3()}</span>
									</li>
								</ul>
							</div>
							<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
								<p class="mb-4 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.leave_quick_status_title()}
								</p>
								<div class="space-y-3">
									<div
										class="bg-surface-subtle/40 flex items-center justify-between rounded-2xl border border-border/50 px-4 py-3"
									>
										<span class="text-sm text-text-muted">{m.leave_stats_open()}</span>
										<span class="text-lg font-bold text-warning">{pendingCount}</span>
									</div>
									<div
										class="bg-surface-subtle/40 flex items-center justify-between rounded-2xl border border-border/50 px-4 py-3"
									>
										<span class="text-sm text-text-muted">{m.leave_stats_approved()}</span>
										<span class="text-lg font-bold text-success">{approvedCount}</span>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</form>
			{:else if activeTab === 'ziekmelding'}
				<form
					class="animate-in fade-in slide-in-from-bottom-2 grid gap-6 lg:grid-cols-[1.5fr_1fr]"
					onsubmit={handleCreateSick}
				>
					<div class="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
						<!-- Accent banner -->
						<div class="flex items-center gap-3 border-b border-error/15 bg-error/5 px-6 py-4">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-error/10 text-error"
							>
								<Stethoscope class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-base font-semibold text-text">{m.sick_report_title()}</h2>
								<p class="text-xs text-text-muted">{m.sick_report_subtitle()}</p>
							</div>
						</div>
						<div class="space-y-5 p-6">
							<!-- Employee + Date row -->
							<div class="grid gap-4 sm:grid-cols-2">
								<EmployeeSearch
									labelText={m.employee()}
									placeholder={m.leave_employee_search_placeholder()}
									bind:selectedId={sickRequest.employeeId}
									onSelect={(employee) => {
										selectedSickEmployee = employee;
										sickRequest.employeeId = employee?.id ?? '';
									}}
								/>
								<Input label={m.sick_date_label()} type="date" bind:value={sickRequest.date} />
							</div>
							<!-- Time range -->
							<div class="bg-surface-subtle/40 rounded-2xl border border-border/50 p-4">
								<p class="mb-3 text-xs font-semibold text-text-muted">
									{m.sick_start_time_label()} — {m.sick_end_time_label()}
								</p>
								<div class="grid gap-3 sm:grid-cols-2">
									<Input
										label={m.sick_start_time_label()}
										type="time"
										bind:value={sickRequest.startTime}
									/>
									<Input
										label={m.sick_end_time_label()}
										type="time"
										bind:value={sickRequest.endTime}
									/>
								</div>
							</div>
							<Textarea
								label={m.sick_notes_label()}
								bind:value={sickRequest.reason}
								placeholder={m.sick_notes_placeholder()}
							/>
							<Button type="submit" class="w-full gap-2 py-3">
								<CheckCircle class="h-4 w-4" />
								{m.sick_save()}
							</Button>
						</div>
					</div>
					{#if selectedSickEmployee}
						<div class="animate-in fade-in slide-in-from-top-2">
							<ScheduleCalendar
								selectedEmployee={selectedSickEmployee}
								bind:selectedStartDate={sickCalendarStart}
								bind:selectedEndDate={sickCalendarEnd}
								onDateRangeSelect={(startDate) => {
									sickRequest.date = startDate;
									sickCalendarStart = startDate;
									sickCalendarEnd = startDate;
								}}
							/>
						</div>
					{:else}
						<div class="animate-in fade-in slide-in-from-top-2 space-y-4">
							<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
								<div
									class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-error/70 uppercase"
								>
									<AlertCircle class="h-4 w-4" />
									{m.sick_warning_title()}
								</div>
								<p class="mt-3 text-sm text-text-muted">{m.sick_warning_body()}</p>
								<div class="mt-4 rounded-xl border border-error/15 bg-error/5 p-4">
									<p class="text-xs font-semibold text-error">⚠️ {m.sick_warning_long_label()}</p>
									<p class="mt-1 text-xs text-text-muted">{m.sick_warning_long_body()}</p>
								</div>
							</div>
							<!-- Quick stats -->
							<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
								<p class="mb-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
									{m.leave_stats_sick()}
								</p>
								<div
									class="bg-surface-subtle/40 flex items-center justify-between rounded-2xl border border-border/50 px-4 py-3"
								>
									<span class="text-sm text-text-muted">{m.leave_stats_sick()}</span>
									<span class="text-2xl font-bold text-error">{sickCount}</span>
								</div>
							</div>
						</div>
					{/if}
				</form>
			{:else if activeTab === 'zwangerschap'}
				<form
					class="animate-in fade-in slide-in-from-bottom-2 grid gap-6 lg:grid-cols-[1.5fr_1fr]"
					onsubmit={handleCreatePregnancy}
				>
					<div
						class="overflow-hidden rounded-3xl border border-pink-200/60 bg-surface shadow-sm dark:border-pink-900/30"
					>
						<!-- Accent banner -->
						<div
							class="flex items-center gap-3 border-b border-pink-200/60 bg-pink-50/60 px-6 py-4 dark:border-pink-900/20 dark:bg-pink-900/10"
						>
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
							>
								<Baby class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-base font-semibold text-text">{m.pregnancy_title()}</h2>
								<p class="text-xs text-text-muted">{m.pregnancy_subtitle()}</p>
							</div>
						</div>
						<div class="space-y-5 p-6">
							<!-- Employee row -->
							<EmployeeSearch
								labelText={m.employee()}
								placeholder={m.leave_employee_search_placeholder()}
								bind:selectedId={pregnancyRequest.employeeId}
								onSelect={(employee) => {
									selectedPregnancyEmployee = employee;
									pregnancyRequest.employeeId = employee?.id ?? '';
								}}
							/>
							<!-- Date range inset -->
							<div class="bg-surface-subtle/40 rounded-2xl border border-border/50 p-4">
								<p class="mb-3 text-xs font-semibold text-text-muted">
									{m.leave_date_range_label()}
								</p>
								<div class="grid gap-3 sm:grid-cols-2">
									<Input
										label={m.pregnancy_start_label()}
										type="date"
										bind:value={pregnancyRequest.startDate}
									/>
									<Input
										label={m.pregnancy_end_label()}
										type="date"
										bind:value={pregnancyRequest.endDate}
									/>
								</div>
								{#if pregnancyRequest.startDate && pregnancyRequest.endDate}
									<div
										class="mt-3 flex items-center justify-between rounded-xl border border-pink-200/60 bg-pink-50/60 px-3 py-2 text-xs font-semibold text-pink-700 dark:border-pink-900/20 dark:bg-pink-900/10 dark:text-pink-400"
									>
										<span class="flex items-center gap-1.5"
											><Baby class="h-3.5 w-3.5" />{m.leave_date_range_label()}</span
										>
										<span
											>{calculateDays(pregnancyRequest.startDate, pregnancyRequest.endDate)}
											{calculateDays(pregnancyRequest.startDate, pregnancyRequest.endDate) === 1
												? m.leave_day_singular()
												: m.leave_day_plural()}</span
										>
									</div>
								{/if}
							</div>
							<Textarea
								label={m.pregnancy_notes_label()}
								bind:value={pregnancyRequest.reason}
								placeholder={m.pregnancy_notes_placeholder()}
							/>
							<Button type="submit" class="w-full gap-2 py-3">
								<CheckCircle class="h-4 w-4" />
								{m.pregnancy_save()}
							</Button>
						</div>
					</div>
					{#if selectedPregnancyEmployee}
						<div class="animate-in fade-in slide-in-from-top-2">
							<ScheduleCalendar
								selectedEmployee={selectedPregnancyEmployee}
								bind:selectedStartDate={pregnancyRequest.startDate}
								bind:selectedEndDate={pregnancyRequest.endDate}
								onDateRangeSelect={(startDate, endDate) => {
									pregnancyRequest.startDate = startDate;
									pregnancyRequest.endDate = endDate;
								}}
							/>
						</div>
					{:else}
						<div class="animate-in fade-in slide-in-from-top-2 space-y-4">
							<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
								<div
									class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-pink-500/70 uppercase"
								>
									<Baby class="h-4 w-4" />
									{m.pregnancy_tip_title()}
								</div>
								<p class="mt-3 text-sm text-text-muted">{m.pregnancy_tip_body()}</p>
								<div
									class="mt-4 rounded-xl border border-pink-200/60 bg-pink-50/60 p-4 dark:border-pink-900/20 dark:bg-pink-900/10"
								>
									<p class="text-xs font-semibold text-pink-700 dark:text-pink-300">
										{m.pregnancy_law_title()}
									</p>
									<p class="mt-1 text-xs text-text-muted">{m.pregnancy_law_body()}</p>
								</div>
							</div>
						</div>
					{/if}
				</form>
			{:else if activeTab === 'telaat'}
				<div class="animate-in fade-in slide-in-from-bottom-2 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
					<form
						class="overflow-hidden rounded-3xl border border-warning/20 bg-surface shadow-sm"
						onsubmit={handleCreateLate}
					>
						<!-- Accent banner -->
						<div class="flex items-center gap-3 border-b border-warning/15 bg-warning/5 px-6 py-4">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/10 text-warning"
							>
								<AlarmClock class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-base font-semibold text-text">{m.late_title()}</h2>
								<p class="text-xs text-text-muted">{m.late_subtitle()}</p>
							</div>
						</div>
						<div class="space-y-5 p-6">
							<!-- Employee + Date -->
							<div class="grid gap-4 sm:grid-cols-2">
								<EmployeeSearch
									labelText={m.employee()}
									placeholder={m.leave_employee_search_placeholder()}
									bind:selectedId={lateRequest.employeeId}
									onSelect={(employee) => {
										selectedLateEmployee = employee;
										lateRequest.employeeId = employee?.id ?? '';
									}}
								/>
								<Input label={m.sick_date_label()} type="date" bind:value={lateRequest.date} />
							</div>
							<!-- Arrival time inset -->
							<div class="bg-surface-subtle/40 rounded-2xl border border-border/50 p-4">
								<p class="mb-3 text-xs font-semibold text-text-muted">
									{m.late_arrival_time_label()}
								</p>
								<Input
									label={m.late_arrival_time_label()}
									type="time"
									bind:value={lateRequest.time}
								/>
								{#if lateRequest.time}
									<div
										class="mt-3 flex items-center gap-2 rounded-xl border border-warning/15 bg-warning/5 px-3 py-2 text-xs font-semibold text-warning"
									>
										<AlarmClock class="h-3.5 w-3.5" />
										<span>Aankomsttijd: {lateRequest.time}</span>
									</div>
								{/if}
							</div>
							<Textarea
								label={m.late_reason_label()}
								bind:value={lateRequest.reason}
								placeholder={m.late_reason_placeholder()}
							/>
							<Button type="submit" class="w-full gap-2 py-3">
								<CheckCircle class="h-4 w-4" />
								{m.late_add()}
							</Button>
						</div>
					</form>
					{#if selectedLateEmployee}
						<div class="animate-in fade-in slide-in-from-top-2">
							<ScheduleCalendar
								selectedEmployee={selectedLateEmployee}
								bind:selectedStartDate={lateCalendarStart}
								bind:selectedEndDate={lateCalendarEnd}
								onDateRangeSelect={(startDate) => {
									lateRequest.date = startDate;
									lateCalendarStart = startDate;
									lateCalendarEnd = startDate;
								}}
							/>
						</div>
					{:else}
						<div class="animate-in fade-in slide-in-from-top-2 space-y-4">
							<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
								<div
									class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-warning/70 uppercase"
								>
									<Clock class="h-4 w-4" />
									{m.late_recent_title()}
								</div>
								<p class="mt-1 text-sm font-semibold text-text">{m.late_recent_title()}</p>
								<div class="mt-4 space-y-2">
									{#each lateArrivals as item}
										<div
											class="bg-surface-subtle/40 flex items-start justify-between gap-3 rounded-2xl border border-border/50 px-4 py-3 text-sm"
										>
											<div>
												<p class="font-semibold text-text">{getEmployeeName(item.employeeId)}</p>
												{#if item.reason}<p class="mt-0.5 text-xs text-text-muted">
														{item.reason}
													</p>{/if}
											</div>
											<span
												class="shrink-0 rounded-lg border border-warning/20 bg-warning/5 px-2 py-0.5 text-[10px] font-semibold text-warning"
												>{formatDate(item.date)} {item.time}</span
											>
										</div>
									{/each}
									{#if lateArrivals.length === 0}
										<div
											class="bg-surface-subtle/30 rounded-2xl border border-dashed border-border/40 p-4 text-center text-xs text-text-muted"
										>
											{m.late_empty()}
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'overzicht'}
				<div class="animate-in fade-in slide-in-from-bottom-2">
					<DataTable
						{columns}
						rows={filteredRequests}
						rowKey="id"
						title={m.leave_table_title()}
						description={m.leave_table_description()}
						emptyTitle={m.leave_table_empty_title()}
						emptyDescription={m.leave_table_empty_description()}
						emptyActionLabel={m.leave_table_empty_action()}
						emptyAction={() => (activeTab = 'aanvragen')}
						filters={requestFilters}
						surface="plain"
						cells={{
							employee: employeeCell,
							type: typeCell,
							period: periodCell,
							status: statusCell,
							actions: actionsCell
						}}
					/>
				</div>
			{:else if activeTab === 'saldo'}
				<div class="animate-in fade-in slide-in-from-bottom-2 space-y-5">
					<!-- Section header -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
								<Users class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-base font-semibold text-text">{m.leave_balance_title()}</h2>
								<p class="text-xs text-text-muted">{m.leave_balance_subtitle()}</p>
							</div>
						</div>
					</div>

					<!-- Balance cards grid -->
					<div class="grid gap-4 md:grid-cols-2">
						{#each leaveBalances as balance, i}
							{@const available = balance.budget - balance.used}
							{@const usagePercent = (balance.used / balance.budget) * 100}
							{@const isHigh = usagePercent > 80}
							{@const isMedium = usagePercent > 50 && usagePercent <= 80}
							<div
								class="animate-in fade-in slide-in-from-bottom-2 group overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm transition-shadow hover:shadow-md"
								style="animation-delay: {i * 75}ms"
							>
								<!-- Card header -->
								<div class="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
									<div class="flex items-center gap-2.5">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
											<span class="text-xs font-bold">{balance.name.charAt(0)}</span>
										</div>
										<div>
											<p class="text-sm font-semibold text-text">{balance.name}</p>
											<p class="text-[10px] text-text-subtle">{balance.department}</p>
										</div>
									</div>
									<span class="rounded-lg px-2.5 py-1 text-xs font-bold {isHigh ? 'bg-error/10 text-error' : isMedium ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}">
										{available} {m.leave_hours_short()}
									</span>
								</div>

								<!-- Card body -->
								<div class="p-5">
									<!-- Progress bar -->
									<div class="mb-4">
										<div class="mb-1.5 flex items-center justify-between text-[11px]">
											<span class="font-medium text-text-muted">{m.leave_balance_usage_label()}</span>
											<span class="font-bold {isHigh ? 'text-error' : isMedium ? 'text-warning' : 'text-text'}">{usagePercent.toFixed(0)}%</span>
										</div>
										<div class="h-2 w-full overflow-hidden rounded-full bg-border/30">
											<div
												class="h-full rounded-full transition-all duration-500 ease-out {isHigh ? 'bg-gradient-to-r from-error to-error/70' : isMedium ? 'bg-gradient-to-r from-warning to-warning/70' : 'bg-gradient-to-r from-brand to-brand/60'}"
												style="width: {Math.min(usagePercent, 100)}%"
											></div>
										</div>
									</div>

									<!-- Stat row -->
									<div class="grid grid-cols-3 gap-2 rounded-xl bg-surface-subtle/50 p-2.5 text-center">
										<div>
											<p class="text-lg font-bold text-text">{balance.budget}</p>
											<p class="text-[10px] text-text-subtle">{m.leave_balance_total_budget()}</p>
										</div>
										<div class="border-x border-border/40">
											<p class="text-lg font-bold text-text">{balance.used}</p>
											<p class="text-[10px] text-text-subtle">{m.leave_balance_used()}</p>
										</div>
										<div>
											<p class="text-lg font-bold {isHigh ? 'text-error' : 'text-success'}">{available}</p>
											<p class="text-[10px] text-text-subtle">{m.leave_balance_available_label()}</p>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if activeTab === 'uitbetalen'}
				<div class="animate-in fade-in slide-in-from-bottom-2 space-y-5">
					<!-- Section header -->
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
							<Euro class="h-5 w-5" />
						</div>
						<div>
							<h2 class="text-base font-semibold text-text">{m.leave_payout_title()}</h2>
							<p class="text-xs text-text-muted">{m.leave_payout_subtitle()}</p>
						</div>
					</div>

					<!-- Payout table -->
					<div class="overflow-hidden rounded-2xl border border-border/60">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border/60 bg-surface-subtle/50">
									<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">{m.employee()}</th>
									<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">{m.leave_hours_short()}</th>
									<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">Status</th>
									<th class="px-4 py-3 text-right text-xs font-semibold tracking-wide text-text-muted uppercase"></th>
								</tr>
							</thead>
							<tbody>
								{#each payoutRequests as payout, i}
									{@const isApproved = payout.status === 'Goedgekeurd'}
									<tr class="border-b border-border/40 transition-colors last:border-0 hover:bg-surface-subtle/30 {i % 2 === 0 ? '' : 'bg-surface-subtle/20'}">
										<td class="px-4 py-3.5">
											<span class="font-semibold text-text">{payout.employee}</span>
										</td>
										<td class="px-4 py-3.5">
											<span class="rounded-lg bg-brand/8 px-2 py-0.5 text-xs font-bold text-brand">{payout.hours}u</span>
										</td>
										<td class="px-4 py-3.5">
											<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold {isApproved ? 'border-success/20 bg-success/10 text-success' : 'border-warning/20 bg-warning/10 text-warning'}">
												<span class="h-1.5 w-1.5 rounded-full {isApproved ? 'bg-success' : 'bg-warning'}"></span>
												{payout.status}
											</span>
										</td>
										<td class="px-4 py-3.5 text-right">
											<Button variant="ghost" class="h-8 rounded-lg px-3 text-xs">{m.leave_payout_view()}</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else if activeTab === 'contractwijzigingen'}
				<div class="animate-in fade-in slide-in-from-bottom-2 space-y-5">
					<!-- Section header -->
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
							<FileText class="h-5 w-5" />
						</div>
						<div>
							<h2 class="text-base font-semibold text-text">{m.leave_contract_changes_title()}</h2>
							<p class="text-xs text-text-muted">{m.leave_contract_changes_subtitle()}</p>
						</div>
					</div>

					<!-- Contract changes table -->
					<div class="overflow-hidden rounded-2xl border border-border/60">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border/60 bg-surface-subtle/50">
									<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">{m.employee()}</th>
									<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">Datum</th>
									<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">{m.leave_contract_hours_per_week()}</th>
									<th class="px-4 py-3 text-right text-xs font-semibold tracking-wide text-text-muted uppercase">Verschil</th>
								</tr>
							</thead>
							<tbody>
								{#each contractChanges as change, i}
									{@const isReduction = change.toHours < change.fromHours}
									{@const diff = Math.abs(change.toHours - change.fromHours)}
									<tr class="border-b border-border/40 transition-colors last:border-0 hover:bg-surface-subtle/30 {i % 2 === 0 ? '' : 'bg-surface-subtle/20'}">
										<td class="px-4 py-3.5">
											<span class="font-semibold text-text">{change.employee}</span>
										</td>
										<td class="px-4 py-3.5 text-text-muted">
											{formatDate(change.date)}
										</td>
										<td class="px-4 py-3.5">
											<div class="flex items-center gap-2 text-sm">
												<span class="text-text-muted line-through">{change.fromHours}u</span>
												<span class="text-text-subtle">→</span>
												<span class="font-semibold {isReduction ? 'text-error' : 'text-success'}">{change.toHours}u</span>
											</div>
										</td>
										<td class="px-4 py-3.5 text-right">
											<span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold {isReduction ? 'border-error/20 bg-error/10 text-error' : 'border-success/20 bg-success/10 text-success'}">
												{isReduction ? '−' : '+'}{diff}u
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
		</div>
	</div>
</section>

<Modal
	bind:open={deleteDialogOpen}
	title={m.leave_modal_delete_title()}
	description={m.leave_modal_delete_description()}
	size="sm"
>
	{#snippet children()}
		<p class="text-sm text-text-muted">
			{m.leave_modal_delete_body()}
		</p>
	{/snippet}
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={() => (deleteDialogOpen = false)}
				>{m.leave_modal_cancel()}</Button
			>
			<Button variant="destructive" onclick={handleDeleteConfirm}>{m.confirm_delete()}</Button>
		</div>
	{/snippet}
</Modal>

<Modal
	bind:open={emailDialogOpen}
	title={m.leave_modal_email_title()}
	description={m.leave_modal_email_description()}
	size="sm"
>
	{#snippet children()}
		<div class="space-y-4">
			<Input
				label={m.leave_modal_email_label()}
				type="email"
				placeholder={m.leave_modal_email_placeholder()}
				bind:value={emailAddress}
			/>
			<p class="text-sm text-text-muted">
				{m.leave_modal_email_note({ month: formatMonth(currentMonth) })}
			</p>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={() => (emailDialogOpen = false)}
				>{m.leave_modal_cancel()}</Button
			>
			<Button onclick={handleSendEmail}>{m.leave_modal_send()}</Button>
		</div>
	{/snippet}
</Modal>

<Toast
	message={toast?.message ?? null}
	type={toast?.type ?? 'success'}
	onClose={() => (toast = null)}
/>
