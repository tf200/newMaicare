<script lang="ts">
	import {
		CheckCircle,
		XCircle,
		Stethoscope,
		Baby,
		AlarmClock,
		Zap
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import EmployeeSearch from '$lib/components/forms/EmployeeSearch.svelte';
	import ScheduleCalendar from '$lib/components/forms/ScheduleCalendar.svelte';
	import LeavePageHeader from './_components/LeavePageHeader.svelte';
	import LeaveStatsCards from './_components/LeaveStatsCards.svelte';
	import LeaveTabsNav from './_components/LeaveTabsNav.svelte';
	import LeaveBalancesTab from './_components/LeaveBalancesTab.svelte';
	import LeavePayoutTab from './_components/LeavePayoutTab.svelte';
	import LeaveContractChangesTab from './_components/LeaveContractChangesTab.svelte';
	import LeaveOverviewTab from './_components/LeaveOverviewTab.svelte';
	import {
		createLeaveRequestByAdmin,
		listLeaveBalances,
		listLeaveRequestStats,
		listLeaveRequests
	} from '$lib/api/leave';
	import { m } from '$lib/paraglide/messages';
	import type { EmployeeListItem } from '$lib/api/employees';
	import type {
		CreateLeaveRequestByAdminPayload,
		LeaveRequestListItemResponse,
		LeaveRequestStatus,
		MyLeaveRequestStatsResponse
	} from '$lib/types/api';
	import type { LeaveBalancesLoadResult, LeaveManagementPageData } from './+page';

	type LeaveType =
		| 'vacation'
		| 'sick'
		| 'personal'
		| 'pregnancy'
		| 'unpaid'
		| 'other'
		| 'training';
	type CreatableLeaveType = CreateLeaveRequestByAdminPayload['leave_type'];
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

	interface LateArrival {
		id: string;
		employeeId: string;
		date: string;
		time: string;
		reason?: string;
	}

	type RequestFilter = 'all' | LeaveStatus;

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

	const validTabs = [
		'aanvragen',
		'ziekmelding',
		'zwangerschap',
		'telaat',
		'overzicht',
		'saldo',
		'uitbetalen',
		'contractwijzigingen'
	] as const;
	type TabId = (typeof validTabs)[number];

	function getInitialTab(): TabId {
		if (typeof window !== 'undefined') {
			const hash = window.location.hash.replace('#', '');
			const params = new URLSearchParams(hash);
			const tab = params.get('tab');
			if (tab && (validTabs as readonly string[]).includes(tab)) return tab as TabId;
		}
		return 'overzicht';
	}

	let { data } = $props<{ data: LeaveManagementPageData }>();

	let activeTab = $state<TabId>(getInitialTab());

	const leaveBalancesInitial = $derived.by(() => data.initial);
	const appliedBalanceSearch = $derived.by(() => leaveBalancesInitial.filters.employeeSearch);
	const appliedBalanceYear = $derived.by(() => leaveBalancesInitial.filters.year);
	const balancePageSize = $derived.by(() => leaveBalancesInitial.pageSize);

	$effect(() => {
		if (typeof window !== 'undefined') {
			window.location.hash = `tab=${activeTab}`;
		}
	});
	let requestFilter = $state<RequestFilter>('all');
	let searchQuery = $state('');
	let overviewCurrentPage = $state(1);
	let overviewPageSize = $state(20);
	let overviewRows = $state<LeaveRequestListItemResponse[]>([]);
	let overviewTotalCount = $state(0);
	let overviewLoading = $state(false);
	let overviewError = $state<string | null>(null);
	let overviewRequestSequence = 0;
	let stats = $state<MyLeaveRequestStatsResponse | null>(null);
	let statsRequestSequence = 0;
	let leaveBalancesData = $state<LeaveBalancesLoadResult | null>(null);
	let leaveBalancesLoading = $state(false);
	let leaveBalancesRequestSequence = 0;
	let leaveBalancesLastKey = $state('');
	let deleteDialogOpen = $state(false);
	let selectedRequestId = $state<string | null>(null);
	let currentMonth = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
	let emailDialogOpen = $state(false);
	let emailAddress = $state('');
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	let newRequest = $state({
		employeeId: '',
		type: 'vacation' as CreatableLeaveType,
		startDate: '',
		endDate: '',
		reason: ''
	});
	let selectedEmployeeFromSearch = $state<EmployeeListItem | null>(null);
	let selectedSickEmployee = $state<EmployeeListItem | null>(null);
	let selectedPregnancyEmployee = $state<EmployeeListItem | null>(null);
	let selectedLateEmployee = $state<EmployeeListItem | null>(null);
	let lateCalendarStart = $state<string | null>(null);
	let lateCalendarEnd = $state<string | null>(null);

	let sickRequest = $state({
		employeeId: '',
		startDate: '',
		endDate: '',
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
		() => stats?.open_requests ?? leaveRequests.filter((r) => r.status === 'pending').length
	);
	const approvedCount = $derived.by(
		() => stats?.approved_requests ?? leaveRequests.filter((r) => r.status === 'approved').length
	);
	const sickCount = $derived.by(
		() => stats?.sickness_absence ?? leaveRequests.filter((r) => r.type === 'sick').length
	);
	const rejectedCount = $derived.by(
		() => stats?.rejected_requests ?? leaveRequests.filter((r) => r.status === 'rejected').length
	);
	const normalizedOverviewSearch = $derived.by(() => searchQuery.trim().slice(0, 120));

	async function loadStats() {
		const requestId = ++statsRequestSequence;
		try {
			const response = await listLeaveRequestStats();
			if (requestId !== statsRequestSequence) return;
			stats = response.data;
		} catch {
			if (requestId !== statsRequestSequence) return;
			stats = null;
		}
	}

	async function loadOverviewRequests(page: number, status: RequestFilter, employeeSearch: string) {
		const requestId = ++overviewRequestSequence;
		overviewLoading = true;
		overviewError = null;

		try {
			const response = await listLeaveRequests({
				page,
				pageSize: overviewPageSize,
				status: status === 'all' ? undefined : status,
				employeeSearch
			});

			if (requestId !== overviewRequestSequence) return;

			overviewRows = response.data.results;
			overviewTotalCount = response.data.count;
			overviewPageSize = response.data.page_size || overviewPageSize;
		} catch (error) {
			if (requestId !== overviewRequestSequence) return;
			overviewRows = [];
			overviewTotalCount = 0;
			overviewError = error instanceof Error ? error.message : 'Could not load leave requests.';
		} finally {
			if (requestId === overviewRequestSequence) {
				overviewLoading = false;
			}
		}
	}

	$effect(() => {
		void loadStats();
	});

	$effect(() => {
		if (activeTab !== 'overzicht') return;

		const timer = setTimeout(() => {
			void loadOverviewRequests(overviewCurrentPage, requestFilter, normalizedOverviewSearch);
		}, 250);

		return () => {
			clearTimeout(timer);
		};
	});

	const getBalanceLoadParams = () => ({
		page: leaveBalancesInitial.page,
		pageSize: leaveBalancesInitial.pageSize,
		employeeSearch: leaveBalancesInitial.filters.employeeSearch,
		year: leaveBalancesInitial.filters.year
	});

	const getBalanceLoadKey = () => {
		const params = getBalanceLoadParams();
		return JSON.stringify(params);
	};

	async function loadLeaveBalances() {
		const { page, pageSize, employeeSearch, year } = getBalanceLoadParams();
		const requestId = ++leaveBalancesRequestSequence;
		leaveBalancesLoading = true;

		try {
			const response = await listLeaveBalances({
				page,
				pageSize,
				employeeSearch: employeeSearch || undefined,
				year: year ?? undefined
			});

			if (requestId !== leaveBalancesRequestSequence) return;

			const { count, next, previous, page_size, results } = response.data;
			const effectivePageSize = page_size || pageSize;

			leaveBalancesData = {
				balances: results,
				pagination: {
					count,
					page,
					pageSize: effectivePageSize,
					next,
					previous,
					filters: {
						employeeSearch,
						year
					}
				},
				loadError: null
			};
		} catch (error) {
			if (requestId !== leaveBalancesRequestSequence) return;
			leaveBalancesData = {
				balances: [],
				pagination: {
					count: 0,
					page,
					pageSize,
					next: null,
					previous: null,
					filters: {
						employeeSearch,
						year
					}
				},
				loadError: error instanceof Error ? error.message : 'Failed to load leave balances.'
			};
		} finally {
			if (requestId === leaveBalancesRequestSequence) {
				leaveBalancesLoading = false;
			}
		}
	}

	$effect(() => {
		if (activeTab !== 'saldo') return;

		const key = getBalanceLoadKey();
		if (leaveBalancesLastKey === key && leaveBalancesData) return;

		leaveBalancesLastKey = key;
		void loadLeaveBalances();
	});

	const retryLeaveBalances = () => {
		leaveBalancesLastKey = '';
		void loadLeaveBalances();
	};

	const buildBalanceQuery = (
		pageValue: number,
		employeeSearchValue: string,
		yearValue: number | null
	) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(balancePageSize));
		if (employeeSearchValue) params.set('employee_search', employeeSearchValue);
		if (yearValue != null) params.set('year', String(yearValue));
		return params.toString();
	};

	const updateBalanceQuery = (
		pageValue: number,
		employeeSearchValue: string,
		yearValue: number | null
	) => {
		const nextQuery = buildBalanceQuery(pageValue, employeeSearchValue.trim(), yearValue);
		if (page.url.searchParams.toString() === nextQuery) return;
		const hash = page.url.hash || '';
		goto(`${page.url.pathname}?${nextQuery}${hash}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	const handleBalanceSearch = (employeeSearchValue: string) => {
		updateBalanceQuery(1, employeeSearchValue, appliedBalanceYear);
	};

	const handleBalanceYearChange = (yearValue: number | null) => {
		updateBalanceQuery(1, appliedBalanceSearch, yearValue);
	};

	const handleBalancePageChange = (nextPage: number) => {
		updateBalanceQuery(nextPage, appliedBalanceSearch, appliedBalanceYear);
	};

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

	function addLeaveRequest(payload: Omit<LeaveRequest, 'id' | 'status'>) {
		const id = crypto.randomUUID();
		leaveRequests = [{ ...payload, id, status: 'pending' }, ...leaveRequests];
		setToast(m.leave_toast_added(), 'success');
	}

	function refreshOverview() {
		void loadOverviewRequests(overviewCurrentPage, requestFilter, normalizedOverviewSearch);
	}

	async function handleCreateLeave(event: Event) {
		event.preventDefault();
		const days = calculateDays(newRequest.startDate, newRequest.endDate);
		if (
			!newRequest.employeeId ||
			days === 0 ||
			!isValidDateYmd(newRequest.startDate) ||
			!isValidDateYmd(newRequest.endDate)
		) {
			setToast(m.leave_toast_missing_employee_dates(), 'warning');
			return;
		}

		const normalizedReason = normalizeReason(newRequest.reason);

		try {
			await createLeaveRequestByAdmin({
				employee_id: newRequest.employeeId,
				leave_type: newRequest.type,
				start_date: newRequest.startDate,
				end_date: newRequest.endDate,
				reason: normalizedReason
			});

			addLeaveRequest({
				employeeId: newRequest.employeeId,
				type: newRequest.type,
				startDate: newRequest.startDate,
				endDate: newRequest.endDate,
				days,
				hours: days * 8,
				reason: normalizedReason
			});
			newRequest = { employeeId: '', type: 'vacation', startDate: '', endDate: '', reason: '' };
			selectedEmployeeFromSearch = null;
			refreshOverview();
			void loadStats();
		} catch (error) {
			setToast(m.leave_toast_request_error(), 'error');
		}
	}

	async function handleCreateSick(event: Event) {
		event.preventDefault();
		const days = calculateDays(sickRequest.startDate, sickRequest.endDate);
		if (
			!sickRequest.employeeId ||
			days === 0 ||
			!isValidDateYmd(sickRequest.startDate) ||
			!isValidDateYmd(sickRequest.endDate)
		) {
			setToast(m.leave_toast_missing_sick_fields(), 'warning');
			return;
		}

		const normalizedReason = normalizeReason(sickRequest.reason);

		try {
			await createLeaveRequestByAdmin({
				employee_id: sickRequest.employeeId,
				leave_type: 'sick',
				start_date: sickRequest.startDate,
				end_date: sickRequest.endDate,
				reason: normalizedReason
			});

			addLeaveRequest({
				employeeId: sickRequest.employeeId,
				type: 'sick',
				startDate: sickRequest.startDate,
				endDate: sickRequest.endDate,
				days,
				hours: days * 8,
				reason: normalizedReason
			});
			sickRequest = { employeeId: '', startDate: '', endDate: '', reason: '' };
			selectedSickEmployee = null;
			refreshOverview();
			void loadStats();
		} catch (error) {
			setToast(m.leave_toast_sick_error(), 'error');
		}
	}

	async function handleCreatePregnancy(event: Event) {
		event.preventDefault();
		const days = calculateDays(pregnancyRequest.startDate, pregnancyRequest.endDate);
		if (
			!pregnancyRequest.employeeId ||
			days === 0 ||
			!isValidDateYmd(pregnancyRequest.startDate) ||
			!isValidDateYmd(pregnancyRequest.endDate)
		) {
			setToast(m.leave_toast_missing_pregnancy_fields(), 'warning');
			return;
		}

		const normalizedReason = normalizeReason(pregnancyRequest.reason);

		try {
			await createLeaveRequestByAdmin({
				employee_id: pregnancyRequest.employeeId,
				leave_type: 'pregnancy',
				start_date: pregnancyRequest.startDate,
				end_date: pregnancyRequest.endDate,
				reason: normalizedReason
			});

			addLeaveRequest({
				employeeId: pregnancyRequest.employeeId,
				type: 'pregnancy',
				startDate: pregnancyRequest.startDate,
				endDate: pregnancyRequest.endDate,
				days,
				hours: days * 8,
				reason: normalizedReason
			});
			pregnancyRequest = { employeeId: '', startDate: '', endDate: '', reason: '' };
			selectedPregnancyEmployee = null;
			refreshOverview();
			void loadStats();
		} catch (error) {
			setToast(m.leave_toast_pregnancy_error(), 'error');
		}
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
		return employees.find((employee) => employee.id === employeeId)?.name ?? 'Onbekend';
	}
</script>

<svelte:head>
	<title>{m.leave_page_title()} | MaiCare</title>
</svelte:head>

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
				{pendingCount}
				onTabChange={(tab) => {
					activeTab = tab;
				}}
			/>

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
						<div class="space-y-5 border-b border-brand/10 pb-5">
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
							{:else}
								<div
									class="bg-surface-subtle/30 rounded-2xl border border-dashed border-border/50 px-4 py-8 text-center text-sm text-text-muted"
								>
									{m.leave_select_employee_prompt()}
								</div>
							{/if}
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
							<EmployeeSearch
								labelText={m.employee()}
								placeholder={m.leave_employee_search_placeholder()}
								bind:selectedId={sickRequest.employeeId}
								onSelect={(employee) => {
									selectedSickEmployee = employee;
									sickRequest.employeeId = employee?.id ?? '';
								}}
							/>
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
						{#if selectedSickEmployee}
							<div class="animate-in fade-in slide-in-from-top-2">
								<ScheduleCalendar
									selectedEmployee={selectedSickEmployee}
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
								<EmployeeSearch
									labelText={m.employee()}
									placeholder={m.leave_employee_search_placeholder()}
									bind:selectedId={lateRequest.employeeId}
									onSelect={(employee) => {
										selectedLateEmployee = employee;
										lateRequest.employeeId = employee?.id ?? '';
									}}
								/>
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
					<LeaveOverviewTab
						rows={overviewRows}
						loading={overviewLoading}
						error={overviewError}
						bind:requestFilter
						bind:searchQuery
						bind:currentPage={overviewCurrentPage}
						pageSize={overviewPageSize}
						totalCount={overviewTotalCount}
						onApprove={handleApproveOverview}
						onReject={handleRejectOverview}
						onDelete={handleDeleteClick}
						onCreateRequest={() => (activeTab = 'aanvragen')}
					/>
				{:else if activeTab === 'saldo'}
					{#if leaveBalancesLoading && !leaveBalancesData}
						<div
							class="animate-in fade-in slide-in-from-bottom-2 rounded-3xl border border-border bg-surface p-6 text-sm text-text-muted shadow-sm"
						>
							Loading leave balances...
						</div>
					{:else if leaveBalancesData}
						<LeaveBalancesTab
							data={leaveBalancesData}
							onSearch={handleBalanceSearch}
							onYearChange={handleBalanceYearChange}
							onPageChange={handleBalancePageChange}
							onRetry={retryLeaveBalances}
						/>
					{/if}
				{:else if activeTab === 'uitbetalen'}
					<LeavePayoutTab {payoutRequests} />
				{:else if activeTab === 'contractwijzigingen'}
					<LeaveContractChangesTab {contractChanges} {formatDate} />
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
