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
		Filter,
		TrendingUp,
		Zap
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import EmployeeSearch from '$lib/components/forms/EmployeeSearch.svelte';
	import ScheduleCalendar from '$lib/components/forms/ScheduleCalendar.svelte';
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

	const leaveTypeConfig: Record<LeaveType, { label: string; className: string }> = {
		vacation: { label: 'Vakantie', className: 'bg-info/10 text-info border-info/20' },
		sick: { label: 'Ziekte', className: 'bg-error/10 text-error border-error/20' },
		personal: { label: 'Persoonlijk', className: 'bg-warning/10 text-warning border-warning/20' },
		training: { label: 'Scholing', className: 'bg-brand/10 text-brand border-brand/20' },
		pregnancy: { label: 'Zwangerschapsverlof', className: 'bg-pink-500/10 text-pink-600 border-pink-400/40' }
	};

	const statusConfig: Record<LeaveStatus, { label: string; icon: typeof AlertCircle; color: string }> = {
		pending: { label: 'In behandeling', icon: AlertCircle, color: 'text-warning' },
		approved: { label: 'Goedgekeurd', icon: CheckCircle, color: 'text-success' },
		rejected: { label: 'Afgewezen', icon: XCircle, color: 'text-error' }
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

	const leaveTypeOptions = [
		{ label: 'Vakantie', value: 'vacation' },
		{ label: 'Persoonlijk', value: 'personal' },
		{ label: 'Scholing', value: 'training' }
	];

	const columns: DataTableColumn[] = [
		{ key: 'employee', label: 'Medewerker' },
		{ key: 'type', label: 'Type' },
		{ key: 'period', label: 'Periode' },
		{ key: 'status', label: 'Status', align: 'center' },
		{ key: 'actions', label: '', align: 'right' }
	];

	let activeTab = $state<
		| 'aanvragen'
		| 'ziekmelding'
		| 'zwangerschap'
		| 'telaat'
		| 'overzicht'
		| 'saldo'
		| 'uitbetalen'
		| 'contractwijzigingen'
	>('aanvragen');
	let requestFilter = $state<'all' | LeaveStatus>('all');
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

	const pendingCount = $derived.by(() => leaveRequests.filter((r) => r.status === 'pending').length);
	const approvedCount = $derived.by(() => leaveRequests.filter((r) => r.status === 'approved').length);
	const sickCount = $derived.by(() => leaveRequests.filter((r) => r.type === 'sick').length);
	const rejectedCount = $derived.by(() => leaveRequests.filter((r) => r.status === 'rejected').length);
	const filteredPendingCount = $derived.by(() =>
		filteredRequests.filter((r) => r.status === 'pending').length
	);
	const filteredApprovedCount = $derived.by(() =>
		filteredRequests.filter((r) => r.status === 'approved').length
	);
	const filteredRejectedCount = $derived.by(() =>
		filteredRequests.filter((r) => r.status === 'rejected').length
	);
	const filteredSickCount = $derived.by(() =>
		filteredRequests.filter((r) => r.type === 'sick').length
	);
	
	const filteredRequests = $derived.by(() => {
		let results = requestFilter === 'all' ? leaveRequests : leaveRequests.filter((r) => r.status === requestFilter);
		
		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			results = results.filter((r) => 
				getEmployeeName(r.employeeId).toLowerCase().includes(query)
			);
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
	
	const departments = $derived.by(() => 
		Array.from(new Set(employees.map((e) => e.department)))
	);
	
	const hasActiveFilters = $derived.by(() => 
		searchQuery.trim() !== '' || 
		selectedDepartmentFilter !== null || 
		selectedTypeFilter !== null || 
		dateRangeStart !== '' || 
		dateRangeEnd !== ''
	);
	
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
		setToast('Verlofaanvraag toegevoegd.', 'success');
	}

	function handleCreateLeave(event: Event) {
		event.preventDefault();
		const days = calculateDays(newRequest.startDate, newRequest.endDate);
		if (!newRequest.employeeId || days === 0) {
			setToast('Vul medewerker en datums in.', 'warning');
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
			setToast('Vul medewerker, datum en starttijd in.', 'warning');
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
			setToast('Vul medewerker en datums in.', 'warning');
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
			setToast('Vul medewerker, datum en tijd in.', 'warning');
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
		setToast('Te laat registratie toegevoegd.', 'success');
		lateRequest = { employeeId: '', date: '', time: '', reason: '' };
	}

	function handleApprove(id: string) {
		leaveRequests = leaveRequests.map((request) =>
			request.id === id ? { ...request, status: 'approved' } : request
		);
		setToast('Verlof goedgekeurd.', 'success');
	}

	function handleReject(id: string) {
		leaveRequests = leaveRequests.map((request) =>
			request.id === id ? { ...request, status: 'rejected' } : request
		);
		setToast('Verlof afgewezen.', 'warning');
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
		setToast('Verlofaanvraag verwijderd.', 'warning');
	}

	function handleDownloadPdf() {
		setToast('PDF export voorbereid.', 'success');
	}

	function handleSendEmail() {
		if (!emailAddress) {
			setToast('Voer een e-mailadres in.', 'warning');
			return;
		}
		setToast(`PDF verstuurd naar ${emailAddress}.`, 'success');
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
	<title>Verlof & Verzuim | MaiCare</title>
</svelte:head>

{#snippet requestFilters()}
	<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-4 space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative w-full sm:w-64">
				<Search
					class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
				/>
				<input
					type="text"
					placeholder="Zoek op medewerker..."
					bind:value={searchQuery}
					class="h-9 w-full rounded-xl border border-border bg-surface pr-9 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
				/>
				{#if searchQuery}
					<button
						class="absolute top-1/2 right-3 -translate-y-1/2 text-text-muted hover:text-text transition"
						onclick={() => (searchQuery = '')}
					>
						<XCircle class="h-4 w-4" />
					</button>
				{/if}
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<button
					class="h-9 rounded-full px-4 text-xs font-semibold transition-all {requestFilter ===
					'all'
						? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
						: 'border border-border text-text-muted hover:text-text'}"
					onclick={() => (requestFilter = 'all')}
				>
					Alles
				</button>
				<button
					class="h-9 rounded-full px-4 text-xs font-semibold transition-all {requestFilter ===
					'pending'
						? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
						: 'border border-border text-text-muted hover:text-text'}"
					onclick={() => (requestFilter = 'pending')}
				>
					In behandeling
					{#if pendingCount > 0}
						<span
							class="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning/20 text-[11px] font-semibold text-warning"
						>
							{pendingCount}
						</span>
					{/if}
				</button>
				<button
					class="h-9 rounded-full px-4 text-xs font-semibold transition-all {requestFilter ===
					'approved'
						? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
						: 'border border-border text-text-muted hover:text-text'}"
					onclick={() => (requestFilter = 'approved')}
				>
					Goedgekeurd
				</button>
				<button
					class="h-9 rounded-full px-4 text-xs font-semibold transition-all {requestFilter ===
					'rejected'
						? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
						: 'border border-border text-text-muted hover:text-text'}"
					onclick={() => (requestFilter = 'rejected')}
				>
					Afgewezen
				</button>

				{#if hasActiveFilters}
					<button
						class="h-9 rounded-full border border-warning/20 bg-warning/5 px-4 text-xs font-semibold text-warning transition hover:bg-warning/10"
						onclick={clearAllFilters}
					>
						<Filter class="inline h-3 w-3 mr-1" />
						{#if selectedDepartmentFilter || selectedTypeFilter || dateRangeStart}
							Filters wissen
						{:else}
							Zoekopdracht wissen
						{/if}
					</button>
				{/if}
			</div>
		</div>

		{#if activeTab === 'overzicht'}
			<div class="grid gap-3 sm:grid-cols-3">
				<div>
					<label for="dept-filter" class="text-xs font-semibold uppercase text-text-muted">Afdeling</label>
					<select
						id="dept-filter"
						bind:value={selectedDepartmentFilter}
						class="mt-1 h-9 w-full rounded-xl border border-border/60 bg-surface px-3 text-sm text-text outline-none"
					>
						<option value={null}>Alle afdelingen</option>
						{#each departments as dept}
							<option value={dept}>{dept}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="type-filter" class="text-xs font-semibold uppercase text-text-muted">Type verlof</label>
					<select
						id="type-filter"
						bind:value={selectedTypeFilter}
						class="mt-1 h-9 w-full rounded-xl border border-border/60 bg-surface px-3 text-sm text-text outline-none"
					>
						<option value={null}>Alle types</option>
						{#each leaveTypeOptions as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="date-filter" class="text-xs font-semibold uppercase text-text-muted">Van datum</label>
					<input
						id="date-filter"
						type="date"
						bind:value={dateRangeStart}
						class="mt-1 h-9 w-full rounded-xl border border-border/60 bg-surface px-3 text-sm text-text outline-none"
					/>
				</div>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet requestActions()}
	<Button variant="primary" class="gap-2 sm:ml-auto" onclick={() => (activeTab = 'aanvragen')}>
		<CalendarPlus class="h-4 w-4" />
		Nieuwe aanvraag
	</Button>
{/snippet}

{#snippet employeeCell(row: LeaveRequest)}
	<div class="flex items-center gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-xs font-semibold text-brand">
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
		{leaveTypeConfig[row.type].label}
	</span>
{/snippet}

{#snippet periodCell(row: LeaveRequest)}
	<div class="text-sm">
		<p class="font-semibold text-text">
			{formatDate(row.startDate)} - {formatDate(row.endDate)}
		</p>
		<p class="text-text-muted">
			{row.days} {row.days === 1 ? 'dag' : 'dagen'} ({row.hours} uur)
		</p>
	</div>
{/snippet}

{#snippet statusCell(row: LeaveRequest)}
	{@const statusMeta = statusConfig[row.status]}
	<span class="inline-flex items-center gap-2 text-xs font-semibold {statusMeta.color}">
		<statusMeta.icon class="h-4 w-4" />
		{statusMeta.label}
	</span>
{/snippet}

{#snippet actionsCell(row: LeaveRequest)}
	<div class="flex items-center justify-end gap-2 text-xs font-semibold">
		{#if row.status === 'pending'}
			<button class="text-text-muted transition hover:text-text" onclick={() => handleReject(row.id)}>
				Afwijzen
			</button>
			<button class="text-brand transition hover:text-brand" onclick={() => handleApprove(row.id)}>
				Goedkeuren
			</button>
		{/if}
		<button class="text-text-muted transition hover:text-text" onclick={() => handleDeleteClick(row.id)}>
			Verwijderen
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
						<span>Verlofbeheer</span>
					</div>
					<h1 class="text-3xl font-bold tracking-tighter text-text">Verlof & Verzuim</h1>
					<p class="max-w-2xl text-sm font-medium text-text-muted">
						Beheer verlofaanvragen, ziekteverzuim en balansoverzichten.
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
						<span class="min-w-[140px] text-center text-sm font-semibold capitalize text-text">
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
						Export PDF
					</Button>
					<Button variant="ghost" class="rounded-xl" onclick={() => (emailDialogOpen = true)}>
						<Mail class="h-4 w-4" />
						E-mail
					</Button>
				</div>
			</div>

			<!-- Quick Stats Row -->
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
					<div class="absolute -right-4 -bottom-4 text-warning opacity-[0.04]">
						<Clock class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">Openstaand</div>
						<div class="mt-2 text-3xl font-bold tracking-tight text-text">{pendingCount}</div>
						<p class="mt-1 text-xs font-medium text-text-muted">In behandeling</p>
					</div>
				</div>
				<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
					<div class="absolute -right-4 -bottom-4 text-success opacity-[0.04]">
						<CheckCircle class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">Goedgekeurd</div>
						<div class="mt-2 text-3xl font-bold tracking-tight text-text">{approvedCount}</div>
						<p class="mt-1 text-xs font-medium text-text-muted">Afgehandeld</p>
					</div>
				</div>
				<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
					<div class="absolute -right-4 -bottom-4 text-error opacity-[0.04]">
						<XCircle class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">Afgewezen</div>
						<div class="mt-2 text-3xl font-bold tracking-tight text-text">{rejectedCount}</div>
						<p class="mt-1 text-xs font-medium text-text-muted">Niet akkoord</p>
					</div>
				</div>
				<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
					<div class="absolute -right-4 -bottom-4 text-error opacity-[0.04]">
						<Stethoscope class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">Ziekteverzuim</div>
						<div class="mt-2 text-3xl font-bold tracking-tight text-text">{sickCount}</div>
						<p class="mt-1 text-xs font-medium text-text-muted">Ziekmeldingen</p>
					</div>
				</div>
			</div>
		</div>
	</header>

	<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm animate-in fade-in">
		<div class="flex flex-wrap gap-2 rounded-2xl border border-border/50 bg-surface-subtle/70 p-2">
			<button
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab ===
				'aanvragen'
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'aanvragen')}
			>
				<CalendarPlus class="h-4 w-4" />
				Nieuwe aanvraag
			</button>
			<button
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab ===
				'ziekmelding'
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'ziekmelding')}
			>
				<Stethoscope class="h-4 w-4" />
				Ziekmelding
			</button>
			<button
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab ===
				'zwangerschap'
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'zwangerschap')}
			>
				<Baby class="h-4 w-4 text-pink-500" />
				Zwangerschapsverlof
			</button>
			<button
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab ===
				'telaat'
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'telaat')}
			>
				<AlarmClock class="h-4 w-4 text-warning" />
				Te laat
			</button>
			<button
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab ===
				'overzicht'
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'overzicht')}
			>
				<List class="h-4 w-4" />
				Overzicht
				{#if pendingCount > 0}
					<span
						class="flex h-5 w-5 items-center justify-center rounded-full bg-warning/20 text-[11px] font-semibold text-warning"
					>
						{pendingCount}
					</span>
				{/if}
			</button>
			<button
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab ===
				'saldo'
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'saldo')}
			>
				<Users class="h-4 w-4" />
				Verlof saldo
			</button>
			<button
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab ===
				'uitbetalen'
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'uitbetalen')}
			>
				<Euro class="h-4 w-4" />
				Uitbetalen
			</button>
			<button
				class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab ===
				'contractwijzigingen'
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'contractwijzigingen')}
			>
				<FileText class="h-4 w-4" />
				Contractwijzigingen
			</button>
		</div>

		<div class="mt-6">
			{#if activeTab === 'aanvragen'}
				<form class="grid gap-6 {selectedEmployeeFromSearch ? 'lg:grid-cols-[1.5fr_1fr]' : 'lg:grid-cols-[2fr_1fr]'}" onsubmit={handleCreateLeave}>
					<!-- Left: Form -->
					<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
						<div class="flex items-center gap-3 mb-5">
							<div class="rounded-xl bg-brand/10 p-2 text-brand">
								<CalendarPlus class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-semibold text-text">Nieuwe verlofaanvraag</h2>
								<p class="text-xs text-text-muted">Plan verlof, persoonlijke dagen of scholing.</p>
							</div>
						</div>
						<div class="space-y-5">
							<!-- Employee Search Component -->
							<EmployeeSearch
								labelText="Medewerker selecteren"
								placeholder="Zoek op naam..."
								bind:selectedId={newRequest.employeeId}
								onSelect={(emp) => {
									selectedEmployeeFromSearch = emp;
								}}
							/>
							
							{#if selectedEmployeeFromSearch}
								<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-4 space-y-4">
									<!-- Type Select -->
									<div>
										<label for="leave-type" class="ml-1 text-xs font-semibold text-text-muted">Type verlof</label>
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
										<div class="ml-1 text-xs font-semibold text-text-muted">Datumbereik</div>
										<div class="grid gap-3 sm:grid-cols-2">
											<div class="rounded-xl border border-border/60 bg-surface px-3 py-3 text-sm">
												<p class="text-xs text-text-muted mb-1">Van</p>
												<p class="font-semibold text-text">
													{newRequest.startDate ? new Date(newRequest.startDate).toLocaleDateString('nl-NL') : 'Selecteren'}
												</p>
											</div>
											<div class="rounded-xl border border-border/60 bg-surface px-3 py-3 text-sm">
												<p class="text-xs text-text-muted mb-1">Tot</p>
												<p class="font-semibold text-text">
													{newRequest.endDate ? new Date(newRequest.endDate).toLocaleDateString('nl-NL') : 'Selecteren'}
												</p>
											</div>
										</div>
									</div>
								</div>

								<!-- Reason Textarea -->
								<Textarea label="Reden (optioneel)" bind:value={newRequest.reason} placeholder="Beschrijf de reden voor verlof..." />

								<!-- Days Calculator -->
								<div class="flex items-center justify-between rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand">
									<div class="flex items-center gap-2">
										<Zap class="h-4 w-4" />
										<span>{calculateDays(newRequest.startDate, newRequest.endDate)} {calculateDays(newRequest.startDate, newRequest.endDate) === 1 ? 'dag' : 'dagen'}</span>
									</div>
									<span>{calculateDays(newRequest.startDate, newRequest.endDate) * 8} uur</span>
								</div>

								<!-- Submit Button -->
								<Button type="submit" class="w-full gap-2 py-3">
									<CheckCircle class="h-4 w-4" />
									Aanvraag indienen
								</Button>
							{:else}
								<div class="rounded-2xl border border-dashed border-border/50 bg-surface-subtle/30 px-4 py-8 text-center text-sm text-text-muted">
									Selecteer eerst een medewerker om door te gaan
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
							<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase flex items-center gap-2">
								<AlertCircle class="h-4 w-4 text-brand" />
								Richtlijnen
							</div>
							<h3 class="mt-2 text-sm font-semibold text-text">Richtlijnen</h3>
							<ul class="mt-4 space-y-3 text-sm text-text-muted">
									<li class="flex gap-2">
										<span class="text-brand font-bold">•</span>
										<span>Controleer bezetting voordat je verlof aanvraagt.</span>
									</li>
									<li class="flex gap-2">
										<span class="text-brand font-bold">•</span>
										<span>Verlof wordt standaard per 8 uur per dag geboekt.</span>
									</li>
									<li class="flex gap-2">
										<span class="text-brand font-bold">•</span>
										<span>Een teamleider beoordeelt binnen 48 uur.</span>
									</li>
								</ul>
							</div>
						<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
							<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase mb-4">Snelle status</p>
							<div class="space-y-3">
								<div class="flex items-center justify-between rounded-2xl border border-border/50 bg-surface-subtle/40 px-4 py-3">
									<span class="text-sm text-text-muted">Openstaand</span>
									<span class="font-bold text-warning text-lg">{pendingCount}</span>
								</div>
								<div class="flex items-center justify-between rounded-2xl border border-border/50 bg-surface-subtle/40 px-4 py-3">
									<span class="text-sm text-text-muted">Goedgekeurd</span>
									<span class="font-bold text-success text-lg">{approvedCount}</span>
								</div>
							</div>
						</div>
						</div>
					{/if}
				</form>
			{:else if activeTab === 'ziekmelding'}
				<form class="grid gap-6 lg:grid-cols-[1.5fr_1fr]" onsubmit={handleCreateSick}>
					<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
						<div class="flex items-center gap-3 mb-4">
							<div class="rounded-xl bg-error/10 p-2 text-error">
								<Stethoscope class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-semibold text-text">Ziekmelding registreren</h2>
								<p class="text-xs text-text-muted">Leg ziekteverzuim vast inclusief hersteltijd.</p>
							</div>
						</div>
						<div class="mt-6 grid gap-4 sm:grid-cols-2">
							<EmployeeSearch
								labelText="Medewerker"
								placeholder="Zoek medewerker..."
								bind:selectedId={sickRequest.employeeId}
								onSelect={(employee) => {
									selectedSickEmployee = employee;
									sickRequest.employeeId = employee?.id ?? '';
								}}
							/>
							<Input label="Datum" type="date" bind:value={sickRequest.date} />
							<Input label="Starttijd" type="time" bind:value={sickRequest.startTime} />
							<Input label="Hersteltijd" type="time" bind:value={sickRequest.endTime} />
						</div>
						<div class="mt-4">
							<Textarea label="Toelichting (optioneel)" bind:value={sickRequest.reason} placeholder="Voeg medische details in..." />
						</div>
						<div class="mt-6 flex justify-end">
							<Button type="submit" class="gap-2">
								<CheckCircle class="h-4 w-4" />
								Ziekmelding opslaan
							</Button>
						</div>
					</div>
					{#if selectedSickEmployee}
						<div class="animate-in fade-in">
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
					<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm animate-in fade-in">
						<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase flex items-center gap-2">
							<AlertCircle class="h-4 w-4 text-error" />
							Let op
						</p>
						<h3 class="mt-2 text-sm font-semibold text-text">Let op</h3>
							<div class="space-y-4 text-sm text-text-muted">
								<p>
									Vul een hersteltijd in zodra de medewerker hersteld is.
								</p>
								<div class="rounded-xl bg-error/5 border border-error/10 p-3">
									<p class="font-semibold text-error text-xs mb-1">⚠️ Langdurig verzuim</p>
									<p class="text-xs">Bij verzuim langer dan 2 dagen wordt automatisch een vervolgactie aangemaakt.</p>
								</div>
							</div>
						</div>
					{/if}
				</form>
			{:else if activeTab === 'zwangerschap'}
				<form class="grid gap-6 lg:grid-cols-[1.5fr_1fr]" onsubmit={handleCreatePregnancy}>
					<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
						<div class="flex items-center gap-3 mb-4">
							<div class="rounded-xl bg-pink-100 dark:bg-pink-900/20 p-2 text-pink-600 dark:text-pink-400">
								<Baby class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-semibold text-text">Zwangerschapsverlof</h2>
								<p class="text-xs text-text-muted">Registratie van zwangerschaps- en bevallingsverlof.</p>
							</div>
						</div>
						<div class="mt-6 grid gap-4 sm:grid-cols-2">
							<EmployeeSearch
								labelText="Medewerker"
								placeholder="Zoek medewerker..."
								bind:selectedId={pregnancyRequest.employeeId}
								onSelect={(employee) => {
									selectedPregnancyEmployee = employee;
									pregnancyRequest.employeeId = employee?.id ?? '';
								}}
							/>
							<Input label="Startdatum" type="date" bind:value={pregnancyRequest.startDate} />
							<Input label="Einddatum" type="date" bind:value={pregnancyRequest.endDate} />
						</div>
						<div class="mt-4">
							<Textarea label="Opmerking (optioneel)" bind:value={pregnancyRequest.reason} placeholder="Relevante informatie..." />
						</div>
						<div class="mt-6 flex justify-end">
							<Button type="submit" class="gap-2">
								<CheckCircle class="h-4 w-4" />
								Verlof vastleggen
							</Button>
						</div>
					</div>
					{#if selectedPregnancyEmployee}
						<div class="animate-in fade-in">
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
					<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm animate-in fade-in">
						<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase flex items-center gap-2">
							<AlertCircle class="h-4 w-4 text-pink-600 dark:text-pink-400" />
							Tip
						</p>
						<h3 class="mt-2 text-sm font-semibold text-text">Tip</h3>
							<div class="space-y-4 text-sm text-text-muted">
								<p>
									Controleer of het verlof aansluit op het verlofsaldo. Pas de planning aan waar nodig.
								</p>
								<div class="rounded-xl bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-900/20 p-3">
									<p class="font-semibold text-pink-700 dark:text-pink-300 text-xs mb-1">Wettelijke bepalingen</p>
									<p class="text-xs">Raadpleeg de arbeidsrechtelijke bepalingen voor zwangerschapsverlof in uw regio.</p>
								</div>
							</div>
						</div>
					{/if}
				</form>
			{:else if activeTab === 'telaat'}
				<div class="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
					<form class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm" onsubmit={handleCreateLate}>
						<div class="flex items-center gap-3 mb-4">
							<div class="rounded-xl bg-warning/10 p-2 text-warning">
								<AlarmClock class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-semibold text-text">Te laat registratie</h2>
								<p class="text-xs text-text-muted">Registreer een late aankomst met reden.</p>
							</div>
						</div>
						<div class="mt-6 grid gap-4 sm:grid-cols-2">
							<EmployeeSearch
								labelText="Medewerker"
								placeholder="Zoek medewerker..."
								bind:selectedId={lateRequest.employeeId}
								onSelect={(employee) => {
									selectedLateEmployee = employee;
									lateRequest.employeeId = employee?.id ?? '';
								}}
							/>
							<Input label="Datum" type="date" bind:value={lateRequest.date} />
							<Input label="Aankomsttijd" type="time" bind:value={lateRequest.time} />
						</div>
						<div class="mt-4">
							<Textarea label="Reden (optioneel)" bind:value={lateRequest.reason} placeholder="Beschrijf de reden..." />
						</div>
						<div class="mt-6 flex justify-end">
							<Button type="submit" class="gap-2">
								<CheckCircle class="h-4 w-4" />
								Registratie toevoegen
							</Button>
						</div>
					</form>
					{#if selectedLateEmployee}
						<div class="animate-in fade-in">
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
					<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm animate-in fade-in">
						<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase flex items-center gap-2">
							<Clock class="h-4 w-4 text-warning" />
							Recente meldingen
						</p>
						<h3 class="mt-2 text-sm font-semibold text-text">Recente meldingen</h3>
							<div class="space-y-3">
								{#each lateArrivals as item}
								<div class="rounded-2xl border border-border/50 bg-surface-subtle/40 p-3 text-sm">
									<p class="font-semibold text-text">{getEmployeeName(item.employeeId)}</p>
									<p class="text-xs text-text-muted mt-1">
										{formatDate(item.date)} • {item.time}
									</p>
									{#if item.reason}
										<p class="mt-2 text-xs text-text-muted bg-surface rounded-lg px-2 py-1">{item.reason}</p>
									{/if}
								</div>
								{/each}
								{#if lateArrivals.length === 0}
								<div class="rounded-2xl border border-dashed border-border/40 bg-surface-subtle/30 p-4 text-center text-xs text-text-muted">
									Geen recente meldingen
								</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'overzicht'}
				<div class="space-y-4">
					<DataTable
						{columns}
						rows={filteredRequests}
						rowKey="id"
						title="Verlofaanvragen"
						description="Overzicht van alle verlof- en verzuimaanvragen."
						emptyTitle="Geen verlofaanvragen gevonden"
						emptyDescription="Maak een nieuwe aanvraag of pas de filters aan."
						emptyActionLabel="Nieuwe aanvraag"
						emptyAction={() => (activeTab = 'aanvragen')}
						filters={requestFilters}
						actions={requestActions}
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
				<div class="space-y-4">
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h2 class="text-lg font-semibold text-text">Verlof saldo per medewerker</h2>
						<p class="mt-1 text-sm text-text-muted">Budget, opgenomen en beschikbare verlofuren</p>
					</div>
					<div class="grid gap-4 md:grid-cols-2">
						{#each leaveBalances as balance}
							{@const available = balance.budget - balance.used}
							{@const usagePercent = (balance.used / balance.budget) * 100}
							<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
								<div class="flex items-start justify-between mb-4">
									<div>
										<p class="font-semibold text-text">{balance.name}</p>
										<p class="text-xs text-text-muted">{balance.department}</p>
									</div>
									<span class="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
										{available} uur beschikbaar
									</span>
								</div>
								
								<!-- Progress bar -->
								<div class="mb-4">
									<div class="flex items-center justify-between mb-2">
										<span class="text-xs font-semibold text-text-muted">Opname</span>
										<span class="text-xs font-semibold text-text">{usagePercent.toFixed(0)}%</span>
									</div>
									<div class="h-2 w-full rounded-full bg-border/40 overflow-hidden">
										<div
											class="h-full bg-gradient-to-r from-brand to-brand/60 transition-all duration-300"
											style="width: {Math.min(usagePercent, 100)}%"
										></div>
									</div>
								</div>

								<!-- Details grid -->
								<div class="grid gap-2 text-sm">
									<div class="flex items-center justify-between">
										<span class="text-text-muted">Totaal budget</span>
										<span class="font-semibold text-text">{balance.budget} uur</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-text-muted">Opgenomen</span>
										<span class="font-semibold text-text">{balance.used} uur</span>
									</div>
									<div class="border-t border-border/50 pt-2 mt-2 flex items-center justify-between">
										<span class="text-xs font-semibold text-text-muted">Beschikbaar</span>
										<span class="font-bold text-text">{available} uur</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if activeTab === 'uitbetalen'}
				<div class="space-y-4">
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h2 class="text-lg font-semibold text-text">Verlofuren uitbetalen</h2>
						<p class="mt-1 text-sm text-text-muted">
							Beheer aanvragen voor uitbetaling van verlofuren.
						</p>
					</div>
					<div class="grid gap-3">
						{#each payoutRequests as payout}
							{@const isApproved = payout.status === 'Goedgekeurd'}
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/60 bg-surface p-4 shadow-sm hover:shadow-md transition-shadow">
								<div class="flex-1">
									<p class="font-semibold text-text">{payout.employee}</p>
									<p class="text-xs text-text-muted mt-1">{payout.hours} uur aangevraagd</p>
								</div>
								<div class="flex items-center gap-3">
									<span class={`rounded-full border px-3 py-1 text-xs font-semibold ${
										isApproved 
											? 'border-success/20 bg-success/10 text-success'
											: 'border-warning/20 bg-warning/10 text-warning'
									}`}>
										{payout.status}
									</span>
									<Button variant="ghost" class="h-9 rounded-xl text-xs">Bekijken</Button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if activeTab === 'contractwijzigingen'}
				<div class="space-y-4">
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h2 class="text-lg font-semibold text-text">Contractwijzigingen</h2>
						<p class="mt-1 text-sm text-text-muted">
							Overzicht van contracturenwijzigingen en impact op saldo.
						</p>
					</div>
					<div class="grid gap-3">
						{#each contractChanges as change}
							{@const isReduction = change.toHours < change.fromHours}
							<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/60 bg-surface p-4 shadow-sm hover:shadow-md transition-shadow">
								<div class="flex-1">
									<p class="font-semibold text-text">{change.employee}</p>
									<p class="text-xs text-text-muted mt-1">{formatDate(change.date)}</p>
								</div>
								<div class="flex items-center gap-4">
									<div class="text-right">
										<p class="text-xs text-text-muted mb-1">Uren per week</p>
										<div class="flex items-center gap-2">
											<span class="text-sm font-semibold text-text-muted line-through">{change.fromHours}u</span>
											<span class="text-xs text-text-muted">→</span>
											<span class={`text-sm font-semibold ${isReduction ? 'text-error' : 'text-success'}`}>
												{change.toHours}u
											</span>
										</div>
									</div>
									<div class={`rounded-full border px-3 py-1 text-xs font-semibold ${
										isReduction 
											? 'border-error/20 bg-error/10 text-error'
											: 'border-success/20 bg-success/10 text-success'
									}`}>
										{isReduction ? '−' : '+'}{Math.abs(change.toHours - change.fromHours)}u
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
</section>

<Modal bind:open={deleteDialogOpen} title="Verlofaanvraag verwijderen" description="Deze actie kan niet ongedaan worden gemaakt." size="sm">
	{#snippet children()}
		<p class="text-sm text-text-muted">
			Weet je zeker dat je deze verlofaanvraag wilt verwijderen?
		</p>
	{/snippet}
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={() => (deleteDialogOpen = false)}>Annuleren</Button>
			<Button variant="destructive" onclick={handleDeleteConfirm}>Verwijderen</Button>
		</div>
	{/snippet}
</Modal>

<Modal
	bind:open={emailDialogOpen}
	title="Verlofoverzicht versturen per e-mail"
	description="Verstuur het maandelijkse overzicht naar een e-mailadres."
	size="sm"
>
	{#snippet children()}
		<div class="space-y-4">
			<Input
				label="E-mailadres"
				type="email"
				placeholder="voorbeeld@email.nl"
				bind:value={emailAddress}
			/>
			<p class="text-sm text-text-muted">
				Het verlofoverzicht voor <span class="font-semibold">{formatMonth(currentMonth)}</span> wordt
				verstuurd naar dit adres.
			</p>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={() => (emailDialogOpen = false)}>Annuleren</Button>
			<Button onclick={handleSendEmail}>Versturen</Button>
		</div>
	{/snippet}
</Modal>

<Toast message={toast?.message ?? null} type={toast?.type ?? 'success'} onClose={() => (toast = null)} />
