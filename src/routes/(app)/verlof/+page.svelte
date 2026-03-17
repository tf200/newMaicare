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
		Trash2
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

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
	const filteredRequests = $derived.by(() =>
		requestFilter === 'all' ? leaveRequests : leaveRequests.filter((r) => r.status === requestFilter)
	);

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

<section class="flex flex-col gap-6">
	<header class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
					<Calendar class="h-6 w-6" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-text">Verlof & Verzuim</h1>
					<p class="text-sm text-text-muted">Beheer verlofaanvragen en ziekteverzuim</p>
				</div>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<div class="flex items-center gap-1 rounded-2xl border border-border/60 bg-surface-subtle p-1">
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
	</header>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
		<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
			<div class="text-xs font-semibold uppercase text-text-muted">Openstaande aanvragen</div>
			<div class="mt-3 flex items-center gap-3">
				<AlertCircle class="h-5 w-5 text-warning" />
				<span class="text-2xl font-bold text-text">{pendingCount}</span>
			</div>
		</div>
		<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
			<div class="text-xs font-semibold uppercase text-text-muted">Goedgekeurd</div>
			<div class="mt-3 flex items-center gap-3">
				<CheckCircle class="h-5 w-5 text-success" />
				<span class="text-2xl font-bold text-text">{approvedCount}</span>
			</div>
		</div>
		<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
			<div class="text-xs font-semibold uppercase text-text-muted">Ziekteverzuim</div>
			<div class="mt-3 flex items-center gap-3">
				<Calendar class="h-5 w-5 text-info" />
				<span class="text-2xl font-bold text-text">
					{((sickCount / Math.max(employees.length, 1)) * 100).toFixed(1)}%
				</span>
			</div>
		</div>
		<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
			<div class="text-xs font-semibold uppercase text-text-muted">Totaal medewerkers</div>
			<div class="mt-3 flex items-center gap-3">
				<Users class="h-5 w-5 text-brand" />
				<span class="text-2xl font-bold text-text">{employees.length}</span>
			</div>
		</div>
	</div>

	<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
		<div class="flex flex-wrap gap-2 rounded-2xl border border-border/50 bg-surface-subtle p-2">
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
				<form class="grid gap-6 lg:grid-cols-[2fr_1fr]" onsubmit={handleCreateLeave}>
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h2 class="text-lg font-semibold text-text">Nieuwe aanvraag</h2>
						<p class="mt-1 text-sm text-text-muted">
							Plan verlof, persoonlijke dagen of scholing.
						</p>
						<div class="mt-4 grid gap-4 sm:grid-cols-2">
							<Select label="Medewerker" options={employeeOptions} bind:value={newRequest.employeeId} />
							<Select label="Type" options={leaveTypeOptions} bind:value={newRequest.type} />
							<Input label="Startdatum" type="date" bind:value={newRequest.startDate} />
							<Input label="Einddatum" type="date" bind:value={newRequest.endDate} />
						</div>
						<div class="mt-4">
							<Textarea label="Reden (optioneel)" bind:value={newRequest.reason} />
						</div>
						<div class="mt-4 flex justify-end">
							<Button type="submit">Aanvraag indienen</Button>
						</div>
					</div>
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h3 class="text-sm font-semibold text-text">Richtlijnen</h3>
						<ul class="mt-3 space-y-2 text-sm text-text-muted">
							<li>Controleer bezetting voordat je verlof aanvraagt.</li>
							<li>Verlof wordt standaard per 8 uur per dag geboekt.</li>
							<li>Een teamleider beoordeelt de aanvraag binnen 48 uur.</li>
						</ul>
					</div>
				</form>
			{:else if activeTab === 'ziekmelding'}
				<form class="grid gap-6 lg:grid-cols-[2fr_1fr]" onsubmit={handleCreateSick}>
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h2 class="text-lg font-semibold text-text">Ziekmelding registreren</h2>
						<p class="mt-1 text-sm text-text-muted">
							Leg ziekteverzuim vast inclusief hersteltijd.
						</p>
						<div class="mt-4 grid gap-4 sm:grid-cols-2">
							<Select label="Medewerker" options={employeeOptions} bind:value={sickRequest.employeeId} />
							<Input label="Datum" type="date" bind:value={sickRequest.date} />
							<Input label="Starttijd" type="time" bind:value={sickRequest.startTime} />
							<Input label="Hersteltijd" type="time" bind:value={sickRequest.endTime} />
						</div>
						<div class="mt-4">
							<Textarea label="Toelichting" bind:value={sickRequest.reason} />
						</div>
						<div class="mt-4 flex justify-end">
							<Button type="submit">Ziekmelding opslaan</Button>
						</div>
					</div>
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h3 class="text-sm font-semibold text-text">Let op</h3>
						<p class="mt-3 text-sm text-text-muted">
							Vul een hersteltijd in zodra de medewerker hersteld is. Bij langdurig verzuim
							wordt automatisch een vervolgactie aangemaakt.
						</p>
					</div>
				</form>
			{:else if activeTab === 'zwangerschap'}
				<form class="grid gap-6 lg:grid-cols-[2fr_1fr]" onsubmit={handleCreatePregnancy}>
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h2 class="text-lg font-semibold text-text">Zwangerschapsverlof</h2>
						<p class="mt-1 text-sm text-text-muted">
							Registratie van zwangerschaps- en bevallingsverlof.
						</p>
						<div class="mt-4 grid gap-4 sm:grid-cols-2">
							<Select label="Medewerker" options={employeeOptions} bind:value={pregnancyRequest.employeeId} />
							<Input label="Startdatum" type="date" bind:value={pregnancyRequest.startDate} />
							<Input label="Einddatum" type="date" bind:value={pregnancyRequest.endDate} />
						</div>
						<div class="mt-4">
							<Textarea label="Opmerking" bind:value={pregnancyRequest.reason} />
						</div>
						<div class="mt-4 flex justify-end">
							<Button type="submit">Verlof vastleggen</Button>
						</div>
					</div>
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h3 class="text-sm font-semibold text-text">Tip</h3>
						<p class="mt-3 text-sm text-text-muted">
							Controleer of het verlof aansluit op het verlofsaldo. Pas de planning aan waar nodig.
						</p>
					</div>
				</form>
			{:else if activeTab === 'telaat'}
				<div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
					<form class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6" onsubmit={handleCreateLate}>
						<h2 class="text-lg font-semibold text-text">Te laat registratie</h2>
						<p class="mt-1 text-sm text-text-muted">Registreer een late aankomst met reden.</p>
						<div class="mt-4 grid gap-4 sm:grid-cols-2">
							<Select label="Medewerker" options={employeeOptions} bind:value={lateRequest.employeeId} />
							<Input label="Datum" type="date" bind:value={lateRequest.date} />
							<Input label="Tijd" type="time" bind:value={lateRequest.time} />
						</div>
						<div class="mt-4">
							<Textarea label="Reden" bind:value={lateRequest.reason} />
						</div>
						<div class="mt-4 flex justify-end">
							<Button type="submit">Registratie toevoegen</Button>
						</div>
					</form>
					<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
						<h3 class="text-sm font-semibold text-text">Recente meldingen</h3>
						<div class="mt-4 space-y-3">
							{#each lateArrivals as item}
								<div class="rounded-xl border border-border/60 bg-surface p-3 text-sm">
									<p class="font-semibold text-text">{getEmployeeName(item.employeeId)}</p>
									<p class="text-xs text-text-muted">
										{formatDate(item.date)} • {item.time}
									</p>
									{#if item.reason}
										<p class="mt-2 text-xs text-text-muted">{item.reason}</p>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else if activeTab === 'overzicht'}
				<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
					<div class="flex flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-surface p-2">
						<button
							class="rounded-xl px-4 py-2 text-sm font-semibold transition-all {requestFilter ===
							'all'
								? 'bg-surface-subtle text-text shadow-sm'
								: 'text-text-muted hover:text-text'}"
							onclick={() => (requestFilter = 'all')}
						>
							Alles
						</button>
						<button
							class="rounded-xl px-4 py-2 text-sm font-semibold transition-all {requestFilter ===
							'pending'
								? 'bg-surface-subtle text-text shadow-sm'
								: 'text-text-muted hover:text-text'}"
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
							class="rounded-xl px-4 py-2 text-sm font-semibold transition-all {requestFilter ===
							'approved'
								? 'bg-surface-subtle text-text shadow-sm'
								: 'text-text-muted hover:text-text'}"
							onclick={() => (requestFilter = 'approved')}
						>
							Goedgekeurd
						</button>
						<button
							class="rounded-xl px-4 py-2 text-sm font-semibold transition-all {requestFilter ===
							'rejected'
								? 'bg-surface-subtle text-text shadow-sm'
								: 'text-text-muted hover:text-text'}"
							onclick={() => (requestFilter = 'rejected')}
						>
							Afgewezen
						</button>
					</div>

					{#if filteredRequests.length === 0}
						<div class="flex flex-col items-center gap-3 py-12 text-sm text-text-muted">
							<Calendar class="h-10 w-10 text-text-subtle" />
							<p>Geen verlofaanvragen gevonden</p>
							<Button onclick={() => (activeTab = 'aanvragen')}>
								<CalendarPlus class="h-4 w-4" />
								Nieuwe aanvraag maken
							</Button>
						</div>
					{:else}
						<div class="mt-4 divide-y divide-border/60">
							{#each filteredRequests as request}
								{@const statusMeta = statusConfig[request.status]}
								{@const StatusIcon = statusMeta.icon}
								<div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
									<div class="flex items-center gap-4">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand"
										>
											{getEmployeeName(request.employeeId)
												.split(' ')
												.map((part) => part[0])
												.join('')
												.slice(0, 2)
												.toUpperCase()}
										</div>
										<div>
											<h3 class="font-semibold text-text">{getEmployeeName(request.employeeId)}</h3>
											<p class="text-sm text-text-muted">
												{employees.find((employee) => employee.id === request.employeeId)?.role ?? ''}
											</p>
										</div>
									</div>

									<div class="flex flex-wrap items-center gap-4">
										<span
											class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold {leaveTypeConfig[
												request.type
											].className}"
										>
											{leaveTypeConfig[request.type].label}
										</span>
										<div class="text-sm">
											<p class="font-semibold text-text">
												{formatDate(request.startDate)} - {formatDate(request.endDate)}
											</p>
											<p class="text-text-muted">
												{request.days} {request.days === 1 ? 'dag' : 'dagen'} ({request.hours} uur)
											</p>
										</div>
									</div>

									<div class="flex flex-wrap items-center gap-3">
										<div class="flex items-center gap-2">
											<StatusIcon class="h-4 w-4 {statusMeta.color}" />
											<span class="text-sm font-semibold {statusMeta.color}">
												{statusMeta.label}
											</span>
										</div>
										<div class="flex items-center gap-2">
											{#if request.status === 'pending'}
												<Button
													variant="ghost"
													class="h-9"
													onclick={() => handleReject(request.id)}
												>
													Afwijzen
												</Button>
												<Button class="h-9" onclick={() => handleApprove(request.id)}>
													Goedkeuren
												</Button>
											{/if}
											<Button
												variant="ghost"
												class="h-9"
												onclick={() => handleDeleteClick(request.id)}
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if activeTab === 'saldo'}
				<div class="grid gap-4 md:grid-cols-2">
					{#each leaveBalances as balance}
						{@const available = balance.budget - balance.used}
						<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
							<div class="flex items-center justify-between">
								<div>
									<p class="font-semibold text-text">{balance.name}</p>
									<p class="text-xs text-text-muted">{balance.department}</p>
								</div>
								<span class="rounded-full border border-border/60 px-3 py-1 text-xs text-text-muted">
									{available} uur beschikbaar
								</span>
							</div>
							<div class="mt-4 space-y-2 text-sm text-text-muted">
								<div class="flex items-center justify-between">
									<span>Verlofbudget</span>
									<span class="font-semibold text-text">{balance.budget} uur</span>
								</div>
								<div class="flex items-center justify-between">
									<span>Opgenomen</span>
									<span class="font-semibold text-text">{balance.used} uur</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if activeTab === 'uitbetalen'}
				<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
					<h2 class="text-lg font-semibold text-text">Verlofuren uitbetalen</h2>
					<p class="mt-1 text-sm text-text-muted">
						Beheer aanvragen voor uitbetaling van verlofuren.
					</p>
					<div class="mt-4 grid gap-3">
						{#each payoutRequests as payout}
							<div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-surface p-4">
								<div>
									<p class="font-semibold text-text">{payout.employee}</p>
									<p class="text-xs text-text-muted">{payout.hours} uur</p>
								</div>
								<span class="rounded-full border border-border/60 px-3 py-1 text-xs text-text-muted">
									{payout.status}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{:else if activeTab === 'contractwijzigingen'}
				<div class="rounded-2xl border border-border/60 bg-surface-subtle/40 p-6">
					<h2 class="text-lg font-semibold text-text">Contractwijzigingen</h2>
					<p class="mt-1 text-sm text-text-muted">
						Overzicht van contracturenwijzigingen en impact op saldo.
					</p>
					<div class="mt-4 grid gap-3">
						{#each contractChanges as change}
							<div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-surface p-4">
								<div>
									<p class="font-semibold text-text">{change.employee}</p>
									<p class="text-xs text-text-muted">{formatDate(change.date)}</p>
								</div>
								<span class="rounded-full border border-border/60 px-3 py-1 text-xs text-text-muted">
									{change.fromHours}u → {change.toHours}u
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
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

<Modal bind:open={emailDialogOpen} title="Verlofoverzicht versturen per e-mail" size="sm">
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
