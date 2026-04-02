<script lang="ts">
	import {
		CalendarPlus,
		Clock,
		CheckCircle,
		XCircle,
		AlertCircle,
		Stethoscope,
		Baby,
		AlarmClock,
		Zap
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import ScheduleCalendar from '$lib/components/forms/ScheduleCalendar.svelte';
	import LeavePageHeader from './_components/LeavePageHeader.svelte';
	import LeaveStatsCards from './_components/LeaveStatsCards.svelte';
	import LeaveTabsNav from './_components/LeaveTabsNav.svelte';
	import LeaveBalancesTab from './_components/LeaveBalancesTab.svelte';
	import {
		listMyLeaveRequests,
		createLeaveRequest,
		createLateArrival,
		listMyLeaveRequestStats,
		listMyLeaveBalances
	} from '$lib/api/leave';
	import { ApiClientError } from '$lib/api/client';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { getAuthState } from '$lib/state/auth.svelte';
	import type { EmployeeListItem } from '$lib/api/employees';
	import type {
		LeaveRequestListItemResponse,
		LeaveRequestStatus,
		CreateLeaveRequestPayload,
		MyLeaveRequestStatsResponse,
		LeaveBalanceListItemResponse
	} from '$lib/types/api';

	type LeaveType =
		| 'vacation'
		| 'personal'
		| 'sick'
		| 'pregnancy'
		| 'late'
		| 'unpaid'
		| 'other'
		| 'training';
	type CreatableLeaveType = CreateLeaveRequestPayload['leave_type'];
	type LeaveStatus = LeaveRequestStatus;

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

	interface OverviewLeaveRequestRow {
		id: string;
		employeeId: string;
		employeeName: string;
		leaveType: string;
		startDate: string;
		endDate: string;
		requestedAt: string;
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
		unpaid: {
			label: () => m.leave_type_unpaid(),
			className: 'bg-brand/10 text-brand border-brand/20'
		},
		other: {
			label: () => m.leave_type_other(),
			className: 'bg-brand/10 text-brand border-brand/20'
		},
		training: {
			label: () => m.leave_type_training(),
			className: 'bg-indigo-500/10 text-indigo-600 border-indigo-400/40'
		},
		pregnancy: {
			label: () => m.leave_type_pregnancy(),
			className: 'bg-pink-500/10 text-pink-600 border-pink-400/40'
		},
		late: {
			label: () => m.leave_tab_late(),
			className: 'bg-warning/10 text-warning border-warning/20'
		}
	};

	const statusConfig: Record<
		LeaveStatus,
		{ label: () => string; icon: typeof AlertCircle; color: string }
	> = {
		pending: { label: () => m.leave_status_pending(), icon: AlertCircle, color: 'text-warning' },
		approved: { label: () => m.leave_status_approved(), icon: CheckCircle, color: 'text-success' },
		rejected: { label: () => m.leave_status_rejected(), icon: XCircle, color: 'text-error' },
		cancelled: { label: () => m.leave_status_cancelled(), icon: XCircle, color: 'text-text-muted' },
		expired: { label: () => m.leave_status_expired(), icon: Clock, color: 'text-text-muted' }
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

	const leaveTypeOptions = $derived([
		{ label: m.leave_type_vacation(), value: 'vacation' },
		{ label: m.leave_type_personal(), value: 'personal' },
		{ label: m.leave_type_unpaid(), value: 'unpaid' },
		{ label: m.leave_type_other(), value: 'other' }
	]);

	const auth = getAuthState();

	const columns: DataTableColumn[] = [
		{ key: 'type', label: m.type() },
		{ key: 'period', label: m.period() },
		{ key: 'requestedAt', label: m.submitted() },
		{ key: 'status', label: m.status(), align: 'center' },
		{ key: 'actions', label: '', align: 'right' }
	];

	const validTabs = [
		'aanvragen',
		'ziekmelding',
		'zwangerschap',
		'telaat',
		'overzicht',
		'saldo'
	] as const;
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
	let overviewCurrentPage = $state(1);
	let overviewPageSize = $state(20);
	let overviewRows = $state<LeaveRequestListItemResponse[]>([]);
	let overviewTotalCount = $state(0);
	let overviewLoading = $state(false);
	let overviewError = $state<string | null>(null);
	let overviewRequestSequence = 0;
	let stats = $state<MyLeaveRequestStatsResponse | null>(null);
	let statsRequestSequence = 0;
	let deleteDialogOpen = $state(false);
	let selectedRequestId = $state<string | null>(null);
	let currentMonth = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
	let emailDialogOpen = $state(false);
	let emailAddress = $state('');
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;
	let isSubmittingLateArrival = $state(false);

	let newRequest = $state({
		type: 'vacation' as CreatableLeaveType,
		startDate: '',
		endDate: '',
		reason: ''
	});
	const loggedInEmployee = $derived.by<EmployeeListItem>(() => {
		const user = auth.user;
		return {
			id: user?.employee_id ?? '',
			first_name: user?.first_name ?? '',
			last_name: user?.last_name ?? '',
			bsn: '',
			contract_type: 'none',
			department: null,
			location_address: null,
			contract_end_date: null
		};
	});
	const loggedInEmployeeFullName = $derived.by(() => {
		const fullName = [loggedInEmployee.first_name, loggedInEmployee.last_name]
			.filter(Boolean)
			.join(' ')
			.trim();
		return fullName || m.employee();
	});
	const calendarEmployee = $derived.by<EmployeeListItem | null>(() =>
		loggedInEmployee.id ? loggedInEmployee : null
	);
	const hasLoggedInEmployee = $derived.by(() => Boolean(loggedInEmployee.id));
	const selectedLateEmployee = $derived.by<EmployeeListItem | null>(() =>
		loggedInEmployee.id ? loggedInEmployee : null
	);
	let lateCalendarStart = $state<string | null>(null);
	let lateCalendarEnd = $state<string | null>(null);

	let sickRequest = $state({
		startDate: '',
		endDate: '',
		reason: ''
	});

	let pregnancyRequest = $state({
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

	$effect(() => {
		if (!loggedInEmployee.id) return;
		lateRequest.employeeId = loggedInEmployee.id;
	});

	const pendingCount = $derived.by(() => stats?.open_requests ?? 0);
	const approvedCount = $derived.by(() => stats?.approved_requests ?? 0);
	const sickCount = $derived.by(() => stats?.sickness_absence ?? 0);
	const rejectedCount = $derived.by(() => stats?.rejected_requests ?? 0);
	const requestFilterPills = $derived.by<RequestFilterPill[]>(() => [
		{ id: 'all', label: m.all() },
		{ id: 'pending', label: m.pending() },
		{ id: 'approved', label: m.leave_stats_approved() },
		{ id: 'rejected', label: m.leave_stats_rejected() }
	]);

	const overviewTableRows = $derived.by<OverviewLeaveRequestRow[]>(() =>
		overviewRows.map((row) => {
			const days = calculateDays(row.start_date, row.end_date);
			return {
				id: row.id,
				employeeId: row.employee_id,
				employeeName: row.employee_name,
				leaveType: row.leave_type,
				startDate: row.start_date,
				endDate: row.end_date,
				requestedAt: row.requested_at,
				days,
				hours: days * 8,
				reason: row.reason ?? undefined,
				status: row.status
			};
		})
	);

	async function loadOverviewRequests(page: number, status: RequestFilter) {
		const requestId = ++overviewRequestSequence;
		overviewLoading = true;
		overviewError = null;

		try {
			const response = await listMyLeaveRequests({
				page,
				pageSize: overviewPageSize,
				status: status === 'all' ? undefined : status
			});

			if (requestId !== overviewRequestSequence) return;

			overviewRows = response.data.results;
			overviewTotalCount = response.data.count;
			overviewPageSize = response.data.page_size || overviewPageSize;
		} catch (error) {
			if (requestId !== overviewRequestSequence) return;
			overviewRows = [];
			overviewTotalCount = 0;
			overviewError = error instanceof Error ? error.message : m.leave_load_error();
		} finally {
			if (requestId === overviewRequestSequence) {
				overviewLoading = false;
			}
		}
	}

	async function loadStats() {
		const requestId = ++statsRequestSequence;

		try {
			const response = await listMyLeaveRequestStats();
			if (requestId !== statsRequestSequence) return;
			stats = response.data;
		} catch (error) {
			if (requestId !== statsRequestSequence) return;
			stats = {
				open_requests: 0,
				approved_requests: 0,
				rejected_requests: 0,
				sickness_absence: 0
			};
		}
	}

	$effect(() => {
		void loadStats();
	});

	$effect(() => {
		void loadMyLeaveBalance();
	});

	$effect(() => {
		if (activeTab !== 'overzicht') return;

		const timer = setTimeout(() => {
			void loadOverviewRequests(overviewCurrentPage, requestFilter);
		}, 250);

		return () => {
			clearTimeout(timer);
		};
	});

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

	let myLeaveBalances = $state<LeaveBalanceListItemResponse[]>([]);

	async function loadMyLeaveBalance() {
		try {
			const response = await listMyLeaveBalances({ page: 1, pageSize: 5 });
			myLeaveBalances = response.data.results;
		} catch {
			myLeaveBalances = [];
		}
	}

	function setToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
		toast = { message, type };
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			toast = null;
		}, 3500);
	}

	function getLateArrivalErrorMessage(error: unknown) {
		if (error instanceof ApiClientError) {
			if (error.status === 400 || error.status === 409) {
				return error.message;
			}
		}

		return error instanceof Error ? error.message : 'Failed to save late arrival.';
	}

	function formatMonth(date: Date) {
		return new Intl.DateTimeFormat(getLocale() === 'nl' ? 'nl-NL' : 'en-GB', {
			month: 'long',
			year: 'numeric'
		}).format(date);
	}

	function formatDate(dateText: string) {
		const parsedDate = parseDateInput(dateText);
		if (!parsedDate) return dateText;
		return new Intl.DateTimeFormat(getLocale() === 'nl' ? 'nl-NL' : 'en-GB', {
			day: 'numeric',
			month: 'short'
		}).format(parsedDate);
	}

	function parseDateInput(value: string): Date | null {
		if (!value) return null;
		const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (ymdMatch) {
			const year = Number(ymdMatch[1]);
			const month = Number(ymdMatch[2]);
			const day = Number(ymdMatch[3]);
			const date = new Date(year, month - 1, day);
			if (
				!Number.isNaN(date.getTime()) &&
				date.getFullYear() === year &&
				date.getMonth() === month - 1 &&
				date.getDate() === day
			) {
				return date;
			}
			return null;
		}
		const isoDate = new Date(value);
		return Number.isNaN(isoDate.getTime()) ? null : isoDate;
	}

	function calculateDays(startDate: string, endDate: string) {
		if (!startDate || !endDate) return 0;
		const start = parseDateInput(startDate);
		const end = parseDateInput(endDate);
		if (!start || !end) return 0;
		const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
		return diff > 0 ? diff : 0;
	}

	function isValidDateYmd(value: string) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
		const [year, month, day] = value.split('-').map(Number);
		if (!year || !month || !day) return false;
		const date = new Date(year, month - 1, day);
		return (
			!Number.isNaN(date.getTime()) &&
			date.getFullYear() === year &&
			date.getMonth() === month - 1 &&
			date.getDate() === day
		);
	}

	function normalizeReason(value: string) {
		const trimmed = value.trim();
		return trimmed ? trimmed : undefined;
	}

	function addLocalLeaveRequest(
		type: LeaveType,
		startDate: string,
		endDate: string,
		reason?: string
	) {
		const days = calculateDays(startDate, endDate);
		if (days === 0) return;

		leaveRequests = [
			{
				id: crypto.randomUUID(),
				employeeId: loggedInEmployee.id || 'self',
				type,
				startDate,
				endDate,
				days,
				hours: days * 8,
				reason,
				status: 'pending'
			},
			...leaveRequests
		];
	}

	function refreshOverview() {
		void loadOverviewRequests(overviewCurrentPage, requestFilter);
		void loadStats();
	}

	async function handleCreateLeave(event: Event) {
		event.preventDefault();
		const days = calculateDays(newRequest.startDate, newRequest.endDate);
		if (
			days === 0 ||
			!isValidDateYmd(newRequest.startDate) ||
			!isValidDateYmd(newRequest.endDate)
		) {
			setToast(m.leave_toast_missing_dates(), 'warning');
			return;
		}

		const normalizedReason = normalizeReason(newRequest.reason);

		try {
			await createLeaveRequest({
				leave_type: newRequest.type,
				start_date: newRequest.startDate,
				end_date: newRequest.endDate,
				reason: normalizedReason
			});

			addLocalLeaveRequest(
				newRequest.type,
				newRequest.startDate,
				newRequest.endDate,
				normalizedReason
			);
			setToast(m.leave_toast_added(), 'success');
			newRequest = {
				type: 'vacation',
				startDate: '',
				endDate: '',
				reason: ''
			};
			refreshOverview();
		} catch (error) {
			setToast(m.leave_toast_request_error(), 'error');
		}
	}

	async function handleCreateSick(event: Event) {
		event.preventDefault();
		const days = calculateDays(sickRequest.startDate, sickRequest.endDate);
		if (
			days === 0 ||
			!isValidDateYmd(sickRequest.startDate) ||
			!isValidDateYmd(sickRequest.endDate)
		) {
			setToast(m.leave_toast_missing_sick_dates(), 'warning');
			return;
		}

		const normalizedReason = normalizeReason(sickRequest.reason);

		try {
			await createLeaveRequest({
				leave_type: 'sick',
				start_date: sickRequest.startDate,
				end_date: sickRequest.endDate,
				reason: normalizedReason
			});

			addLocalLeaveRequest('sick', sickRequest.startDate, sickRequest.endDate, normalizedReason);
			setToast(m.leave_toast_added(), 'success');
			sickRequest = {
				startDate: '',
				endDate: '',
				reason: ''
			};
			refreshOverview();
		} catch (error) {
			setToast(m.leave_toast_sick_error(), 'error');
		}
	}

	async function handleCreatePregnancy(event: Event) {
		event.preventDefault();
		const days = calculateDays(pregnancyRequest.startDate, pregnancyRequest.endDate);
		if (
			days === 0 ||
			!isValidDateYmd(pregnancyRequest.startDate) ||
			!isValidDateYmd(pregnancyRequest.endDate)
		) {
			setToast(m.leave_toast_missing_pregnancy_dates(), 'warning');
			return;
		}

		const normalizedReason = normalizeReason(pregnancyRequest.reason);

		try {
			await createLeaveRequest({
				leave_type: 'pregnancy',
				start_date: pregnancyRequest.startDate,
				end_date: pregnancyRequest.endDate,
				reason: normalizedReason
			});

			addLocalLeaveRequest(
				'pregnancy',
				pregnancyRequest.startDate,
				pregnancyRequest.endDate,
				normalizedReason
			);
			setToast(m.leave_toast_added(), 'success');
			pregnancyRequest = {
				startDate: '',
				endDate: '',
				reason: ''
			};
			refreshOverview();
		} catch (error) {
			setToast(m.leave_toast_pregnancy_error(), 'error');
		}
	}

	async function handleCreateLate(event: Event) {
		event.preventDefault();
		if (!lateRequest.employeeId || !lateRequest.date || !lateRequest.time) {
			setToast(m.leave_toast_missing_late_fields(), 'warning');
			return;
		}

		if (isSubmittingLateArrival) return;

		const normalizedReason = normalizeReason(lateRequest.reason);
		isSubmittingLateArrival = true;

		try {
			await createLateArrival({
				arrival_date: lateRequest.date,
				arrival_time: lateRequest.time,
				reason: normalizedReason
			});

			lateArrivals = [
				{
					id: crypto.randomUUID(),
					employeeId: lateRequest.employeeId,
					date: lateRequest.date,
					time: lateRequest.time,
					reason: normalizedReason
				},
				...lateArrivals
			];
			setToast(m.leave_toast_late_added(), 'success');
			lateRequest = { employeeId: loggedInEmployee.id, date: '', time: '', reason: '' };
		} catch (error) {
			const type = error instanceof ApiClientError && error.status === 400 ? 'warning' : 'error';
			setToast(getLateArrivalErrorMessage(error), type);
		} finally {
			isSubmittingLateArrival = false;
		}
	}

	function handleApproveOverview(id: string) {
		overviewRows = overviewRows.map((request) =>
			request.id === id ? { ...request, status: 'approved' } : request
		);
		setToast(m.leave_toast_approved(), 'success');
	}

	function handleRejectOverview(id: string) {
		overviewRows = overviewRows.map((request) =>
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
		if (activeTab === 'overzicht') {
			overviewRows = overviewRows.filter((request) => request.id !== selectedRequestId);
			overviewTotalCount = Math.max(0, overviewTotalCount - 1);
		} else {
			leaveRequests = leaveRequests.filter((request) => request.id !== selectedRequestId);
		}
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
		if (employeeId === loggedInEmployee.id) {
			return loggedInEmployeeFullName;
		}
		return employees.find((employee) => employee.id === employeeId)?.name ?? m.unknown();
	}
</script>

<svelte:head>
	<title>{m.leave_page_title()} | MaiCare</title>
</svelte:head>

{#snippet requestFilters()}
	<div class="flex w-full flex-wrap items-center justify-end gap-3">
		<div class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
			{#each requestFilterPills as pill (pill.id)}
				<button
					onclick={() => {
						requestFilter = pill.id;
						overviewCurrentPage = 1;
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
			{row.days === 1 ? m.leave_day_singular() : m.leave_day_plural()} ({row.hours}
			{m.leave_hours_short()})
		</p>
	</div>
{/snippet}

{#snippet requestedAtCell(row: OverviewLeaveRequestRow)}
	<span class="text-sm text-text-muted">{formatDate(row.requestedAt)}</span>
{/snippet}

{#snippet statusCell(row: OverviewLeaveRequestRow)}
	{@const statusMeta = statusConfig[row.status]}
	<span class="inline-flex items-center gap-2 text-xs font-semibold {statusMeta.color}">
		<statusMeta.icon class="h-4 w-4" />
		{statusMeta.label()}
	</span>
{/snippet}

{#snippet actionsCell(row: OverviewLeaveRequestRow)}
	<div class="flex items-center justify-end gap-1">
		<button
			class="flex h-6 items-center gap-0.5 rounded-md px-1.5 text-xs font-semibold text-text-muted transition-all hover:bg-border/30 hover:text-text"
			onclick={() => handleDeleteClick(row.id)}
		>
			{m.leave_action_delete()}
		</button>
	</div>
{/snippet}

<section class="space-y-6">
	<LeavePageHeader
		currentMonthLabel={formatMonth(currentMonth)}
		onPrevMonth={prevMonth}
		onNextMonth={nextMonth}
		onDownloadPdf={handleDownloadPdf}
		onOpenEmail={() => (emailDialogOpen = true)}
	/>
	<LeaveStatsCards {pendingCount} {approvedCount} {rejectedCount} {sickCount} />
	<div
		class="animate-in fade-in overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm"
	>
		<div class="lg:flex">
			<LeaveTabsNav
				{activeTab}
				onTabChange={(tab) => {
					activeTab = tab;
				}}
			/>

			<!-- ── Content pane ────────────────────────────────────────── -->
			<div class="min-w-0 flex-1 p-6">
				{#if activeTab === 'aanvragen'}
					<form class="grid gap-6 lg:grid-cols-[1.5fr_1fr]" onsubmit={handleCreateLeave}>
						<!-- Left: Form -->
						<div class="space-y-5 border-b border-brand/10 pb-5">
							<p class="text-xs font-semibold text-text-muted">{m.employee()}</p>
							<p class="text-sm font-medium text-text">
								{loggedInEmployeeFullName}
							</p>

							<!-- Type Select -->
							<Select
								label={m.leave_type_label()}
								options={leaveTypeOptions}
								bind:value={newRequest.type}
							/>

							<!-- Date Range -->
							<div class="space-y-2">
								<div class="ml-1 text-xs font-semibold text-text-muted">
									{m.leave_date_range_label()}
								</div>
								<div class="grid gap-3 sm:grid-cols-2">
									<DatePicker
										label={m.leave_date_from()}
										bind:value={newRequest.startDate}
										compact
									/>
									<DatePicker label={m.leave_date_to()} bind:value={newRequest.endDate} compact />
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
						</div>

						<!-- Right: Calendar or Guidelines -->
						{#if calendarEmployee}
							<ScheduleCalendar
								selectedEmployee={calendarEmployee}
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
								<h3 class="text-sm font-semibold text-text">{m.leave_guidelines_title()}</h3>
								<ul class="space-y-3 text-sm text-text-muted">
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
						{/if}
					</form>
				{:else if activeTab === 'ziekmelding'}
					<form
						class="animate-in fade-in slide-in-from-bottom-2 grid gap-6 lg:grid-cols-[1.5fr_1fr]"
						onsubmit={handleCreateSick}
					>
						<div class="space-y-5 border-b border-error/10 pb-5">
							<p class="text-xs font-semibold text-text-muted">{m.employee()}</p>
							<p class="text-sm font-medium text-text">
								{loggedInEmployeeFullName}
							</p>
							<p class="text-xs font-semibold text-text-muted">
								{m.leave_date_range_label()}
							</p>
							<div class="grid gap-3 sm:grid-cols-2">
								<DatePicker
									label={m.leave_date_from()}
									bind:value={sickRequest.startDate}
									compact
								/>
								<DatePicker label={m.leave_date_to()} bind:value={sickRequest.endDate} compact />
							</div>
							{#if sickRequest.startDate && sickRequest.endDate}
								<div
									class="flex items-center justify-between rounded-xl border border-error/20 bg-error/5 px-3 py-2 text-xs font-semibold text-error"
								>
									<span class="flex items-center gap-1.5">
										<Stethoscope class="h-3.5 w-3.5" />
										{m.leave_date_range_label()}
									</span>
									<span>
										{calculateDays(sickRequest.startDate, sickRequest.endDate)}
										{calculateDays(sickRequest.startDate, sickRequest.endDate) === 1
											? m.leave_day_singular()
											: m.leave_day_plural()}
									</span>
								</div>
							{/if}
							<Textarea
								label={m.sick_notes_label()}
								bind:value={sickRequest.reason}
								placeholder={m.sick_notes_placeholder()}
							/>
							<Button type="submit" class="w-full gap-2 bg-error py-3 text-white hover:bg-error/90">
								<CheckCircle class="h-4 w-4" />
								{m.sick_save()}
							</Button>
						</div>
						{#if calendarEmployee}
							<div class="animate-in fade-in slide-in-from-top-2">
								<ScheduleCalendar
									selectedEmployee={calendarEmployee}
									bind:selectedStartDate={sickRequest.startDate}
									bind:selectedEndDate={sickRequest.endDate}
									onDateRangeSelect={(startDate, endDate) => {
										sickRequest.startDate = startDate;
										sickRequest.endDate = endDate;
									}}
								/>
							</div>
						{:else}
							<div class="animate-in fade-in slide-in-from-top-2 space-y-4">
								<p class="text-sm font-semibold text-text">{m.sick_warning_title()}</p>
								<p class="text-sm text-text-muted">{m.sick_warning_body()}</p>
								<div class="rounded-xl border border-error/15 bg-error/5 p-4">
									<p class="text-xs font-semibold text-error">{m.sick_warning_long_label()}</p>
									<p class="mt-1 text-xs text-text-muted">{m.sick_warning_long_body()}</p>
								</div>
							</div>
						{/if}
					</form>
				{:else if activeTab === 'zwangerschap'}
					<form
						class="animate-in fade-in slide-in-from-bottom-2 grid gap-6 lg:grid-cols-[1.5fr_1fr]"
						onsubmit={handleCreatePregnancy}
					>
						<div class="space-y-5 border-b border-pink-200/40 pb-5">
							<p class="text-xs font-semibold text-text-muted">{m.employee()}</p>
							<p class="text-sm font-medium text-text">
								{loggedInEmployeeFullName}
							</p>
							<!-- Date range -->
							<p class="text-xs font-semibold text-text-muted">
								{m.leave_date_range_label()}
							</p>
							<div class="grid gap-3 sm:grid-cols-2">
								<DatePicker
									label={m.pregnancy_start_label()}
									bind:value={pregnancyRequest.startDate}
									compact
								/>
								<DatePicker
									label={m.pregnancy_end_label()}
									bind:value={pregnancyRequest.endDate}
									compact
								/>
							</div>
							{#if pregnancyRequest.startDate && pregnancyRequest.endDate}
								<div
									class="flex items-center justify-between rounded-xl border border-pink-200/60 bg-pink-50/60 px-3 py-2 text-xs font-semibold text-pink-700 dark:border-pink-900/20 dark:bg-pink-900/10 dark:text-pink-400"
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
							<Textarea
								label={m.pregnancy_notes_label()}
								bind:value={pregnancyRequest.reason}
								placeholder={m.pregnancy_notes_placeholder()}
							/>
							<Button
								type="submit"
								class="w-full gap-2 bg-pink-600 py-3 text-white hover:bg-pink-600/90"
							>
								<CheckCircle class="h-4 w-4" />
								{m.pregnancy_save()}
							</Button>
						</div>
						{#if calendarEmployee}
							<div class="animate-in fade-in slide-in-from-top-2">
								<ScheduleCalendar
									selectedEmployee={calendarEmployee}
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
								<p class="text-sm font-semibold text-text">{m.pregnancy_tip_title()}</p>
								<p class="text-sm text-text-muted">{m.pregnancy_tip_body()}</p>
								<div
									class="rounded-xl border border-pink-200/60 bg-pink-50/60 p-4 dark:border-pink-900/20 dark:bg-pink-900/10"
								>
									<p class="text-xs font-semibold text-pink-700 dark:text-pink-300">
										{m.pregnancy_law_title()}
									</p>
									<p class="mt-1 text-xs text-text-muted">{m.pregnancy_law_body()}</p>
								</div>
							</div>
						{/if}
					</form>
				{:else if activeTab === 'telaat'}
					<div
						class="animate-in fade-in slide-in-from-bottom-2 grid gap-6 lg:grid-cols-[1.5fr_1fr]"
					>
						<form class="space-y-5 border-b border-warning/10 pb-5" onsubmit={handleCreateLate}>
							<!-- Employee + Date -->
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<p class="text-xs font-semibold text-text-muted">{m.employee()}</p>
									<p class="mt-1 text-sm font-medium text-text">
										{loggedInEmployeeFullName}
									</p>
								</div>
								<DatePicker label={m.sick_date_label()} bind:value={lateRequest.date} />
							</div>
							<!-- Arrival time -->
							<p class="text-xs font-semibold text-text-muted">
								{m.late_arrival_time_label()}
							</p>
							<Input
								label={m.late_arrival_time_label()}
								type="time"
								bind:value={lateRequest.time}
							/>
							{#if lateRequest.time}
								<div
									class="flex items-center gap-2 rounded-xl border border-warning/15 bg-warning/5 px-3 py-2 text-xs font-semibold text-warning"
								>
									<AlarmClock class="h-3.5 w-3.5" />
									<span>{m.late_arrival_summary({ time: lateRequest.time })}</span>
								</div>
							{/if}
							<Textarea
								label={m.late_reason_label()}
								bind:value={lateRequest.reason}
								placeholder={m.late_reason_placeholder()}
							/>
							<Button
								type="submit"
								isLoading={isSubmittingLateArrival}
								class="w-full gap-2 bg-warning py-3 text-white hover:bg-warning/90"
							>
								<CheckCircle class="h-4 w-4" />
								{m.late_add()}
							</Button>
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
								<p class="text-sm font-semibold text-text">{m.late_recent_title()}</p>
								<div class="space-y-2">
									{#each lateArrivals as item (item.id)}
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
						{/if}
					</div>
				{:else if activeTab === 'overzicht'}
					<div class="animate-in fade-in slide-in-from-bottom-2">
						{#if overviewError}
							<div
								class="mb-4 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error"
							>
								{overviewError}
							</div>
						{/if}
						<DataTable
							{columns}
							rows={overviewTableRows}
							loading={overviewLoading}
							rowKey="id"
							emptyTitle={m.leave_table_empty_title()}
							emptyDescription={m.leave_table_empty_description()}
							emptyActionLabel={m.leave_table_empty_action()}
							emptyAction={() => (activeTab = 'aanvragen')}
							filters={requestFilters}
							surface="plain"
							headerInline
							currentPage={overviewCurrentPage}
							pageSize={overviewPageSize}
							totalCount={overviewTotalCount}
							onPageChange={(page) => {
								overviewCurrentPage = page;
							}}
							cells={{
								type: typeCell,
								period: periodCell,
								requestedAt: requestedAtCell,
								status: statusCell,
								actions: actionsCell
							}}
						/>
					</div>
				{:else if activeTab === 'saldo'}
					<LeaveBalancesTab balances={myLeaveBalances} />
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
	<p class="text-sm text-text-muted">
		{m.leave_modal_delete_body()}
	</p>
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
