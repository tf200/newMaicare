<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import LeavePageHeader from './_components/LeavePageHeader.svelte';
	import LeaveStatsCards from './_components/LeaveStatsCards.svelte';
	import LeaveTabsNav from './_components/LeaveTabsNav.svelte';
	import LeaveBalancesTab from './_components/LeaveBalancesTab.svelte';
	import LeavePayoutTab from './_components/LeavePayoutTab.svelte';
	import LeaveContractChangesTab from './_components/LeaveContractChangesTab.svelte';
	import LeaveRequestCreateTab from './_components/LeaveRequestCreateTab.svelte';
	import LeaveSickTab from './_components/LeaveSickTab.svelte';
	import LeavePregnancyTab from './_components/LeavePregnancyTab.svelte';
	import LeaveLateArrivalTab from './_components/LeaveLateArrivalTab.svelte';
	import LeaveOverviewTab from './_components/LeaveOverviewTab.svelte';
	import {
		createLeaveRequestByAdmin,
		createLateArrivalByAdmin,
		decideLeaveRequest,
		listLeaveBalances,
		listLeaveRequestStats,
		listLeaveRequests,
		listLateArrivals
	} from '$lib/api/leave';
	import { ApiClientError } from '$lib/api/client';
	import { m } from '$lib/paraglide/messages';
	import type { EmployeeListItem } from '$lib/api/employees';
	import type {
		CreateLeaveRequestByAdminPayload,
		LeaveRequestDecision,
		LeaveRequestListItemResponse,
		LeaveRequestStatus,
		LateArrivalListItemResponse,
		MyLeaveRequestStatsResponse
	} from '$lib/types/api';
	import type { LeaveBalancesLoadResult, LeaveManagementPageData } from './+page';
	import type {
		CreateLeaveFormState,
		DateRangeRequestFormState,
		LateArrivalFormState,
		LeaveTypeOption,
		LocalLateArrivalItem
	} from './_components/form-types';
	import {
		calculateDays,
		createEmptyCreateLeaveForm,
		createEmptyDateRangeRequestForm,
		createEmptyLateArrivalForm,
		formatDate,
		getValidatedDateRangeFormData
	} from './_components/leave-form-utils';

	type LeaveType = 'vacation' | 'sick' | 'personal' | 'pregnancy' | 'unpaid' | 'other' | 'training';
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

	type RequestFilter = 'all' | LeaveStatus;
	type OverviewSubTab = 'requests' | 'lateArrivals';

	const employees: Employee[] = [
		{
			id: 'emp-1',
			name: 'Sanne Jansen',
			role: 'Caregiver',
			department: 'North Wing'
		},
		{
			id: 'emp-2',
			name: 'Milan de Vries',
			role: 'Care Coordinator',
			department: 'West Wing'
		},
		{
			id: 'emp-3',
			name: 'Nora Bakker',
			role: 'Planning',
			department: 'East Wing'
		},
		{
			id: 'emp-4',
			name: 'Ravi Singh',
			role: 'Nurse',
			department: 'South Wing'
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
			reason: 'Weekend away with family.',
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
			reason: 'Reported sick at 07:30 and recovered at 14:00.',
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
			reason: 'Wound care training.',
			status: 'rejected'
		}
	]);

	let lateArrivals = $state<LocalLateArrivalItem[]>([]);

	let lateArrivalRows = $state<LateArrivalListItemResponse[]>([]);
	let lateArrivalCurrentPage = $state(1);
	let lateArrivalPageSize = $state(20);
	let lateArrivalTotalCount = $state(0);
	let lateArrivalLoading = $state(false);
	let lateArrivalError = $state<string | null>(null);
	let lateArrivalSearchQuery = $state('');
	let lateArrivalDateFrom = $state('');
	let lateArrivalDateTo = $state('');
	let lateArrivalRequestSequence = 0;
	let lateArrivalSubmitting = $state(false);

	const leaveTypeOptions = $derived<LeaveTypeOption[]>([
		{ label: m.leave_type_vacation(), value: 'vacation' },
		{ label: m.leave_type_personal(), value: 'personal' },
		{ label: m.leave_type_unpaid(), value: 'unpaid' },
		{ label: m.leave_type_other(), value: 'other' }
	]);

	const validTabs = [
		'requestLeave',
		'sickLeave',
		'maternityLeave',
		'lateArrival',
		'overview',
		'balances',
		'payouts',
		'contractChanges'
	] as const;
	type TabId = (typeof validTabs)[number];

	const legacyTabAliases: Record<string, TabId> = {
		aanvragen: 'requestLeave',
		ziekmelding: 'sickLeave',
		zwangerschap: 'maternityLeave',
		telaat: 'lateArrival',
		overzicht: 'overview',
		saldo: 'balances',
		uitbetalen: 'payouts',
		contractwijzigingen: 'contractChanges'
	};

	function getInitialTab(): TabId {
		if (typeof window !== 'undefined') {
			const hash = window.location.hash.replace('#', '');
			const params = new URLSearchParams(hash);
			const tab = params.get('tab');
			if (tab && (validTabs as readonly string[]).includes(tab)) return tab as TabId;
			if (tab && tab in legacyTabAliases) return legacyTabAliases[tab];
		}
		return 'overview';
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
	let activeOverviewSubTab = $state<OverviewSubTab>('requests');
	let stats = $state<MyLeaveRequestStatsResponse | null>(null);
	let statsRequestSequence = 0;
	let leaveBalancesData = $state<LeaveBalancesLoadResult | null>(null);
	let leaveBalancesLoading = $state(false);
	let leaveBalancesRequestSequence = 0;
	let leaveBalancesLastKey = $state('');
	let deleteDialogOpen = $state(false);
	let selectedRequestId = $state<string | null>(null);
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	let newRequest = $state<CreateLeaveFormState>(createEmptyCreateLeaveForm());
	let selectedEmployeeFromSearch = $state<EmployeeListItem | null>(null);
	let selectedSickEmployee = $state<EmployeeListItem | null>(null);
	let selectedPregnancyEmployee = $state<EmployeeListItem | null>(null);
	let selectedLateEmployee = $state<EmployeeListItem | null>(null);
	let lateCalendarStart = $state<string | null>(null);
	let lateCalendarEnd = $state<string | null>(null);

	let sickRequest = $state<DateRangeRequestFormState>(createEmptyDateRangeRequestForm());

	let pregnancyRequest = $state<DateRangeRequestFormState>(createEmptyDateRangeRequestForm());

	let lateRequest = $state<LateArrivalFormState>(createEmptyLateArrivalForm());

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
		if (activeTab !== 'overview' || activeOverviewSubTab !== 'requests') return;

		const timer = setTimeout(() => {
			void loadOverviewRequests(overviewCurrentPage, requestFilter, normalizedOverviewSearch);
		}, 250);

		return () => {
			clearTimeout(timer);
		};
	});

	async function loadLateArrivals(
		page: number,
		employeeSearch: string,
		dateFrom: string,
		dateTo: string
	) {
		const requestId = ++lateArrivalRequestSequence;
		lateArrivalLoading = true;
		lateArrivalError = null;

		try {
			const response = await listLateArrivals({
				page,
				pageSize: lateArrivalPageSize,
				employeeSearch: employeeSearch || undefined,
				dateFrom: dateFrom || undefined,
				dateTo: dateTo || undefined
			});

			if (requestId !== lateArrivalRequestSequence) return;

			lateArrivalRows = response.data.results;
			lateArrivalTotalCount = response.data.count;
			lateArrivalPageSize = response.data.page_size || lateArrivalPageSize;
		} catch (error) {
			if (requestId !== lateArrivalRequestSequence) return;
			lateArrivalRows = [];
			lateArrivalTotalCount = 0;
			lateArrivalError = error instanceof Error ? error.message : 'Could not load late arrivals.';
		} finally {
			if (requestId === lateArrivalRequestSequence) {
				lateArrivalLoading = false;
			}
		}
	}

	$effect(() => {
		if (activeTab !== 'overview' || activeOverviewSubTab !== 'lateArrivals') return;

		const timer = setTimeout(() => {
			void loadLateArrivals(
				lateArrivalCurrentPage,
				lateArrivalSearchQuery.trim(),
				lateArrivalDateFrom,
				lateArrivalDateTo
			);
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
		if (activeTab !== 'balances') return;

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

	const payoutRequests: {
		id: string;
		employee: string;
		hours: number;
		status: 'pending' | 'approved';
	}[] = [
		{ id: 'pay-1', employee: 'Ravi Singh', hours: 24, status: 'pending' },
		{ id: 'pay-2', employee: 'Nina Visser', hours: 12, status: 'approved' }
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

	function getLateArrivalErrorMessage(error: unknown) {
		if (error instanceof ApiClientError && (error.status === 400 || error.status === 409)) {
			return error.message;
		}

		return error instanceof Error ? error.message : 'Failed to save late arrival.';
	}

	function mapLateArrivalToLocalItem(row: LateArrivalListItemResponse): LocalLateArrivalItem {
		return {
			id: row.id,
			employeeId: row.employee_id,
			date: row.arrival_date,
			time: row.arrival_time,
			reason: row.reason ?? undefined
		};
	}

	function addLeaveRequest(payload: Omit<LeaveRequest, 'id' | 'status'>) {
		const id = crypto.randomUUID();
		leaveRequests = [{ ...payload, id, status: 'pending' }, ...leaveRequests];
		setToast(m.leave_toast_added(), 'success');
	}

	function refreshOverview() {
		void loadOverviewRequests(overviewCurrentPage, requestFilter, normalizedOverviewSearch);
	}

	async function submitAdminLeaveRequest({
		event,
		form,
		leaveType,
		missingFieldsMessage,
		errorMessage,
		reset
	}: {
		event: Event;
		form: CreateLeaveFormState | DateRangeRequestFormState;
		leaveType: CreatableLeaveType;
		missingFieldsMessage: string;
		errorMessage: string;
		reset: () => void;
	}) {
		event.preventDefault();

		const validatedData = getValidatedDateRangeFormData(form);
		if (!validatedData) {
			setToast(missingFieldsMessage, 'warning');
			return;
		}

		try {
			await createLeaveRequestByAdmin({
				employee_id: form.employeeId,
				leave_type: leaveType,
				start_date: form.startDate,
				end_date: form.endDate,
				reason: validatedData.reason
			});

			addLeaveRequest({
				employeeId: form.employeeId,
				type: leaveType,
				startDate: form.startDate,
				endDate: form.endDate,
				days: validatedData.days,
				hours: validatedData.days * 8,
				reason: validatedData.reason
			});
			reset();
			refreshOverview();
			void loadStats();
		} catch {
			setToast(errorMessage, 'error');
		}
	}

	async function handleCreateLeave(event: Event) {
		await submitAdminLeaveRequest({
			event,
			form: newRequest,
			leaveType: newRequest.type,
			missingFieldsMessage: m.leave_toast_missing_employee_dates(),
			errorMessage: m.leave_toast_request_error(),
			reset: () => {
				newRequest = createEmptyCreateLeaveForm();
				selectedEmployeeFromSearch = null;
			}
		});
	}

	async function handleCreateSick(event: Event) {
		await submitAdminLeaveRequest({
			event,
			form: sickRequest,
			leaveType: 'sick',
			missingFieldsMessage: m.leave_toast_missing_sick_fields(),
			errorMessage: m.leave_toast_sick_error(),
			reset: () => {
				sickRequest = createEmptyDateRangeRequestForm();
				selectedSickEmployee = null;
			}
		});
	}

	async function handleCreatePregnancy(event: Event) {
		await submitAdminLeaveRequest({
			event,
			form: pregnancyRequest,
			leaveType: 'pregnancy',
			missingFieldsMessage: m.leave_toast_missing_pregnancy_fields(),
			errorMessage: m.leave_toast_pregnancy_error(),
			reset: () => {
				pregnancyRequest = createEmptyDateRangeRequestForm();
				selectedPregnancyEmployee = null;
			}
		});
	}

	async function handleCreateLate(event: Event) {
		event.preventDefault();
		if (!lateRequest.employeeId || !lateRequest.date || !lateRequest.time) {
			setToast(m.leave_toast_missing_late_fields(), 'warning');
			return;
		}

		if (lateArrivalSubmitting) return;

		lateArrivalSubmitting = true;

		try {
			const response = await createLateArrivalByAdmin({
				employee_id: lateRequest.employeeId,
				arrival_date: lateRequest.date,
				arrival_time: lateRequest.time,
				reason: lateRequest.reason.trim() || undefined
			});

			lateArrivals = [mapLateArrivalToLocalItem(response.data), ...lateArrivals];
			setToast(m.leave_toast_late_added(), 'success');
			lateRequest = createEmptyLateArrivalForm();
			selectedLateEmployee = null;
			lateCalendarStart = null;
			lateCalendarEnd = null;
		} catch (error) {
			setToast(
				getLateArrivalErrorMessage(error),
				error instanceof ApiClientError && (error.status === 400 || error.status === 409)
					? 'warning'
					: 'error'
			);
		} finally {
			lateArrivalSubmitting = false;
		}
	}

	async function handleOverviewDecision(
		id: string,
		decision: LeaveRequestDecision,
		decisionNote?: string
	) {
		try {
			const response = await decideLeaveRequest(id, {
				decision,
				decision_note: decisionNote ?? null
			});

			overviewRows = overviewRows.map((request) =>
				request.id === id ? { ...request, ...response.data } : request
			);
			refreshOverview();
			void loadStats();
			setToast(
				decision === 'approve' ? m.leave_toast_approved() : m.leave_toast_rejected(),
				'success'
			);
		} catch (error) {
			setToast(error instanceof Error ? error.message : m.leave_toast_request_error(), 'error');
			throw error;
		}
	}

	async function handleApproveOverview(id: string, decisionNote?: string) {
		await handleOverviewDecision(id, 'approve', decisionNote);
	}

	async function handleRejectOverview(id: string, decisionNote?: string) {
		await handleOverviewDecision(id, 'reject', decisionNote);
	}

	function handleDeleteClick(id: string) {
		selectedRequestId = id;
		deleteDialogOpen = true;
	}

	function handleDeleteConfirm() {
		if (!selectedRequestId) return;
		if (activeTab === 'overview') {
			overviewRows = overviewRows.filter((request) => request.id !== selectedRequestId);
			overviewTotalCount = Math.max(0, overviewTotalCount - 1);
		} else {
			leaveRequests = leaveRequests.filter((request) => request.id !== selectedRequestId);
		}
		deleteDialogOpen = false;
		selectedRequestId = null;
		setToast(m.leave_toast_deleted(), 'warning');
	}

	function getEmployeeName(employeeId: string) {
		return employees.find((employee) => employee.id === employeeId)?.name ?? 'Onbekend';
	}
</script>

<svelte:head>
	<title>{m.leave_page_title()} | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<LeavePageHeader />
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
				{#if activeTab === 'requestLeave'}
					<LeaveRequestCreateTab
						bind:form={newRequest}
						bind:selectedEmployee={selectedEmployeeFromSearch}
						{leaveTypeOptions}
						{calculateDays}
						onSubmit={handleCreateLeave}
					/>
				{:else if activeTab === 'sickLeave'}
					<LeaveSickTab
						bind:form={sickRequest}
						bind:selectedEmployee={selectedSickEmployee}
						{calculateDays}
						onSubmit={handleCreateSick}
					/>
				{:else if activeTab === 'maternityLeave'}
					<LeavePregnancyTab
						bind:form={pregnancyRequest}
						bind:selectedEmployee={selectedPregnancyEmployee}
						{calculateDays}
						onSubmit={handleCreatePregnancy}
					/>
				{:else if activeTab === 'lateArrival'}
					<LeaveLateArrivalTab
						bind:form={lateRequest}
						bind:selectedEmployee={selectedLateEmployee}
						bind:calendarStart={lateCalendarStart}
						bind:calendarEnd={lateCalendarEnd}
						{lateArrivals}
						{formatDate}
						{getEmployeeName}
						isSubmitting={lateArrivalSubmitting}
						onSubmit={handleCreateLate}
					/>
				{:else if activeTab === 'overview'}
					<LeaveOverviewTab
						bind:activeSubTab={activeOverviewSubTab}
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
						onCreateRequest={() => (activeTab = 'requestLeave')}
						{lateArrivalRows}
						{lateArrivalLoading}
						{lateArrivalError}
						bind:lateArrivalCurrentPage
						{lateArrivalPageSize}
						{lateArrivalTotalCount}
						bind:lateArrivalSearchQuery
						bind:lateArrivalDateFrom
						bind:lateArrivalDateTo
					/>
				{:else if activeTab === 'balances'}
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
				{:else if activeTab === 'payouts'}
					<LeavePayoutTab {payoutRequests} />
				{:else if activeTab === 'contractChanges'}
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

<Toast
	message={toast?.message ?? null}
	type={toast?.type ?? 'success'}
	onClose={() => (toast = null)}
/>
