<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { addMonths, subMonths, format } from 'date-fns';
	import { Search } from 'lucide-svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type {
		EmployeeSalaryRow,
		ZzpSalaryRow,
		SalaryTotals,
		ZzpTotals,
		CaoSalaryScale,
		ShiftAssignment,
		Service,
		ContractChange,
		LeaveBalance,
		LeavePayout,
		OrtBreakdown,
		OrtAmounts
	} from '$lib/types/api/salary';
	import type { EmployeeListItem } from '$lib/api/employees';
	import SalaryPageHeader from './_components/SalaryPageHeader.svelte';
	import SalaryStatsCards from './_components/SalaryStatsCards.svelte';
	import SalaryTable from './_components/SalaryTable.svelte';
	import ZZPTab from './_components/ZZPTab.svelte';
	import ORTTab from './_components/ORTTab.svelte';
	import RatesTab from './_components/RatesTab.svelte';
	import {
		listCaoSalaryScales,
		listShiftAssignments,
		listServices,
		listContractChanges,
		listLeaveBalancesForYear,
		listLeavePayoutsForMonth,
		listMockEmployees
	} from '$lib/api/salary.mock';
	import {
		calculateShiftOrtHours,
		calculateOrtAmounts,
		combineOrtBreakdowns
	} from '$lib/utils/ort';

	let { data } = $props();

	const ZORGCOORDINATOR_ROLE_ID = '78cd3c50-0df9-45d9-9c4c-52a4bb47593e';
	const DEFAULT_HOURS_PER_SHIFT = 7.5;
	const WEEKS_PER_MONTH = 4.33;

	type TabId = 'salary' | 'zzp' | 'ort' | 'rates';
	let activeTab = $state<TabId>('salary');

	let currentMonth = $state(new Date(data.initial.monthStart));
	let searchQuery = $state('');
	let departmentFilter = $state('all');
	let employeeFilter = $state('all');
	let includeBreaks = $state(false);

	let employees = $state<EmployeeListItem[]>([]);
	let salaryScales = $state<CaoSalaryScale[]>([]);
	let assignments = $state<ShiftAssignment[]>([]);
	let services = $state<Service[]>([]);
	let contractChanges = $state<ContractChange[]>([]);
	let leaveBalances = $state<LeaveBalance[]>([]);
	let leavePayouts = $state<LeavePayout[]>([]);

	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let dataSequence = 0;

	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	function setToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
		toast = { message, type };
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			toast = null;
		}, 3500);
	}

	const monthStartStr = $derived(format(currentMonth, 'yyyy-MM-01'));
	const monthEndStr = $derived(
		format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), 'yyyy-MM-dd')
	);
	const currentYear = $derived(currentMonth.getFullYear());
	const salaryMonthKey = $derived(format(currentMonth, 'yyyy-MM-01'));

	async function loadAllData() {
		const requestId = ++dataSequence;
		loading = true;
		loadError = null;

		try {
			const [empRes, scalesRes, assignsRes, servicesRes, changesRes, balancesRes, payoutsRes] =
				await Promise.all([
					listMockEmployees(),
					listCaoSalaryScales(),
					listShiftAssignments({ start_date: monthStartStr, end_date: monthEndStr }),
					listServices(),
					listContractChanges(),
					listLeaveBalancesForYear(currentYear),
					listLeavePayoutsForMonth(salaryMonthKey)
				]);

			if (requestId !== dataSequence) return;

			employees = empRes.data.results ?? [];
			salaryScales = scalesRes.data ?? [];
			assignments = assignsRes.data ?? [];
			services = servicesRes.data ?? [];
			contractChanges = changesRes.data ?? [];
			leaveBalances = balancesRes.data ?? [];
			leavePayouts = payoutsRes.data ?? [];
		} catch (error) {
			if (requestId !== dataSequence) return;
			loadError = error instanceof Error ? error.message : 'Kon salarisdata niet laden.';
		} finally {
			if (requestId === dataSequence) {
				loading = false;
			}
		}
	}

	$effect(() => {
		void loadAllData();
	});

	const monthLabel = $derived(
		new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(currentMonth)
	);

	function navigateMonth(direction: 'prev' | 'next') {
		currentMonth =
			direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);

		const params = new URLSearchParams(page.url.searchParams.toString());
		params.set('month', format(currentMonth, 'yyyy-MM'));
		goto(`${page.url.pathname}?${params.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((p) => p[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	const departments = $derived(
		[...new Set(employees.map((e) => e.department))].filter(Boolean) as string[]
	);

	const visibleEmployees = $derived(
		employees.filter((emp) => {
			const type = String(emp.contract_type ?? '').toLowerCase().trim();
			return type !== 'zzp';
		})
	);

	const zzpEmployees = $derived(
		employees.filter((emp) => {
			const type = String(emp.contract_type ?? '').toLowerCase().trim();
			return type === 'zzp';
		})
	);

	const filteredEmployees = $derived(
		visibleEmployees.filter((emp) => {
			const name = `${emp.first_name} ${emp.last_name}`.toLowerCase();
			const matchesSearch = name.includes(searchQuery.toLowerCase());
			const matchesDepartment =
				departmentFilter === 'all' || emp.department === departmentFilter;
			const matchesEmployee = employeeFilter === 'all' || emp.id === employeeFilter;
			return matchesSearch && matchesDepartment && matchesEmployee;
		})
	);

	function getSalaryDataForEmployee(scaleNumber: number | null, periodiek: number | null) {
		if (!scaleNumber || periodiek === null) return { hourlyRate: null, monthlySalary: null };
		const scale = salaryScales.find(
			(s) => s.scale_number === scaleNumber && s.periodiek === periodiek
		);
		return {
			hourlyRate: scale?.hourly_rate ?? null,
			monthlySalary: scale?.monthly_salary ?? null
		};
	}

	function getServiceForAssignment(serviceId: string) {
		return services.find((s) => s.id === serviceId || s.legacy_id === serviceId);
	}

	function getHoursForService(
		serviceId: string,
		assignmentStartTime?: string | null,
		assignmentEndTime?: string | null
	) {
		const service = getServiceForAssignment(serviceId);

		if (service?.paid_hours !== null && service?.paid_hours !== undefined) {
			return Number(service.paid_hours);
		}

		if (assignmentStartTime && assignmentEndTime) {
			const duration = calculateDuration(assignmentStartTime, assignmentEndTime);
			if (duration !== null) return includeBreaks ? duration + 0.5 : duration;
		} else if (service?.start_time && service?.end_time) {
			const duration = calculateDuration(service.start_time, service.end_time);
			if (duration !== null) return includeBreaks ? duration + 0.5 : duration;
		}

		return DEFAULT_HOURS_PER_SHIFT;
	}

	function calculateDuration(start: string, end: string): number | null {
		const [sh, sm] = start.split(':').map(Number);
		const [eh, em] = end.split(':').map(Number);
		let minutes = eh * 60 + em - (sh * 60 + sm);
		if (minutes <= 0) minutes += 24 * 60;
		if (minutes > 0) return minutes / 60 - 0.5;
		return null;
	}

	function getTimesForShift(
		serviceId: string,
		assignmentStartTime?: string | null,
		assignmentEndTime?: string | null
	) {
		if (assignmentStartTime && assignmentEndTime) {
			return { startTime: assignmentStartTime, endTime: assignmentEndTime };
		}
		const service = getServiceForAssignment(serviceId);
		return { startTime: service?.start_time || null, endTime: service?.end_time || null };
	}

	function getMaxShifts(hoursPerWeek: number | null) {
		const weekly = hoursPerWeek ?? 36;
		const monthly = weekly * WEEKS_PER_MONTH;
		return Math.round((monthly / DEFAULT_HOURS_PER_SHIFT) * 10) / 10;
	}

	function getContractForDate(
		empId: string,
		targetDate: Date,
		emp: EmployeeListItem
	) {
		const empChanges = contractChanges
			.filter((c) => c.employee_id === empId && c.field_changed.startsWith('hours_per_week'))
			.sort((a, b) => new Date(a.change_date).getTime() - new Date(b.change_date).getTime());

		if (empChanges.length === 0) {
			return {
				hours_per_week: (emp as any).contract_hours ?? 36,
				contract_hours_type: 'vast'
			};
		}

		let activeHours = (emp as any).contract_hours ?? 36;
		let activeType = 'vast';

		const firstChange = empChanges[0];
		if (firstChange?.old_value !== null) {
			const oldHours = parseFloat(firstChange.old_value!);
			activeHours = oldHours;
			activeType = oldHours === 0 ? 'nul-uren' : 'vast';
		}

		for (const change of empChanges) {
			const changeDate = new Date(change.change_date);
			if (changeDate <= targetDate && change.change_date) {
				const newHours = parseFloat(change.new_value!);
				if (!isNaN(newHours)) {
					activeHours = newHours;
					activeType = newHours === 0 ? 'nul-uren' : 'vast';
				}
			}
		}

		return { hours_per_week: activeHours, contract_hours_type: activeType };
	}

	const employeeSalaryData = $derived.by<EmployeeSalaryRow[]>(() => {
		return filteredEmployees.map((emp) => {
			const empAssignments = assignments.filter((a) => a.employee_id === emp.id);
			const fullName = `${emp.first_name} ${emp.last_name}`;
			const isZorgcoordinator = false;

			let regularHours = 0;
			const ortBreakdowns: OrtBreakdown[] = [];

			empAssignments.forEach((assignment) => {
				const { startTime, endTime } = getTimesForShift(
					assignment.service_id,
					assignment.start_time,
					assignment.end_time
				);
				const hours = getHoursForService(
					assignment.service_id,
					assignment.start_time,
					assignment.end_time
				);

				regularHours += hours;

				if (!isZorgcoordinator) {
					const ortBreakdown = calculateShiftOrtHours(
						assignment.shift_date,
						startTime,
						endTime,
						hours
					);
					ortBreakdowns.push(ortBreakdown);
				}
			});

			const combinedOrt = combineOrtBreakdowns(ortBreakdowns);
			const salaryData = getSalaryDataForEmployee(
				(emp as any).salary_scale ?? null,
				(emp as any).salary_periodiek ?? null
			);
			const hourlyRate = salaryData.hourlyRate;
			const monthlySalary = salaryData.monthlySalary;

			let regularPay = 0;
			let totalOrt = 0;
			let ortAmounts: OrtAmounts | null = null;

			if (isZorgcoordinator) {
				regularPay = monthlySalary || 0;
			} else {
				regularPay = hourlyRate ? regularHours * hourlyRate : 0;
				ortAmounts = hourlyRate ? calculateOrtAmounts(combinedOrt, hourlyRate) : null;
				totalOrt = ortAmounts?.totalOrt || 0;
			}

			const totalGross = regularPay + totalOrt;

			const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
			const contractAtMonth = getContractForDate(emp.id, monthEnd, emp);
			const isZeroHoursContract =
				contractAtMonth.contract_hours_type === 'nul-uren' ||
				contractAtMonth.hours_per_week === 0;

			let maxShifts = 0;
			let shiftsDifference = 0;
			let isOverScheduled = false;
			let isUnderScheduled = false;
			let maxHoursPerMonth = 0;
			let hoursDifference = 0;
			let isOverHours = false;
			let isUnderHours = false;

			if (!isZeroHoursContract) {
				maxShifts = getMaxShifts(contractAtMonth.hours_per_week);
				shiftsDifference = empAssignments.length - maxShifts;
				isOverScheduled = shiftsDifference > 0.5;
				isUnderScheduled = shiftsDifference < -0.5;

				maxHoursPerMonth = contractAtMonth.hours_per_week * WEEKS_PER_MONTH;
				hoursDifference = regularHours - maxHoursPerMonth;
				isOverHours = hoursDifference > 0;
				isUnderHours = hoursDifference < -3;
			}

			return {
				employee: {
					id: emp.id,
					name: fullName,
					first_name: emp.first_name,
					last_name: emp.last_name,
					department: emp.department,
					salary_scale: (emp as any).salary_scale ?? null,
					salary_periodiek: (emp as any).salary_periodiek ?? null,
					hours_per_week: contractAtMonth.hours_per_week,
					contract_hours_type: contractAtMonth.contract_hours_type,
					employee_type: String(emp.contract_type ?? ''),
					status: '',
					organizational_role_id: null,
					hourly_rate: (emp as any).contract_rate ?? null,
					birth_date: (emp as any).date_of_birth ?? null,
					start_date: (emp as any).contract_start_date ?? null,
					bsn: emp.bsn,
					tax_credit: null,
					wage_tax_table: null
				},
				shifts: empAssignments.length,
				regularHours,
				ortBreakdown: combinedOrt,
				hourlyRate,
				monthlySalary,
				regularPay,
				ortAmounts,
				totalOrt,
				totalGross,
				maxShifts,
				shiftsDifference,
				isOverScheduled,
				isUnderScheduled,
				maxHoursPerMonth,
				hoursDifference,
				isOverHours,
				isUnderHours,
				isZeroHoursContract,
				isZorgcoordinator
			} satisfies EmployeeSalaryRow;
		});
	});

	const totals = $derived.by<SalaryTotals>(() => {
		return employeeSalaryData.reduce(
			(acc, d) => ({
				totalShifts: acc.totalShifts + d.shifts,
				regularHours: acc.regularHours + d.regularHours,
				totalOrtHours: acc.totalOrtHours + d.ortBreakdown.totalOrtHours,
				earlyMorningOrtHours: acc.earlyMorningOrtHours + d.ortBreakdown.earlyMorningHours,
				eveningOrtHours: acc.eveningOrtHours + d.ortBreakdown.eveningHours,
				nightOrtHours: acc.nightOrtHours + d.ortBreakdown.nightHours,
				saturdayOrtHours: acc.saturdayOrtHours + d.ortBreakdown.saturdayDayHours,
				sundayOrtHours: acc.sundayOrtHours + d.ortBreakdown.sundayHolidayHours,
				regularPay: acc.regularPay + d.regularPay,
				totalOrt: acc.totalOrt + d.totalOrt,
				totalGross: acc.totalGross + d.totalGross
			}),
			{
				totalShifts: 0,
				regularHours: 0,
				totalOrtHours: 0,
				earlyMorningOrtHours: 0,
				eveningOrtHours: 0,
				nightOrtHours: 0,
				saturdayOrtHours: 0,
				sundayOrtHours: 0,
				regularPay: 0,
				totalOrt: 0,
				totalGross: 0
			}
		);
	});

	const zzpSalaryData = $derived.by<ZzpSalaryRow[]>(() => {
		return zzpEmployees.map((emp) => {
			const empAssignments = assignments.filter((a) => a.employee_id === emp.id);
			const fullName = `${emp.first_name} ${emp.last_name}`;
			let regularHours = 0;

			empAssignments.forEach((assignment) => {
				regularHours += getHoursForService(
					assignment.service_id,
					assignment.start_time,
					assignment.end_time
				);
			});

			const hourlyRate = (emp as any).contract_rate ? Number((emp as any).contract_rate) : null;
			const totalCost = hourlyRate ? regularHours * hourlyRate : 0;

			return {
				employee: {
					id: emp.id,
					name: fullName,
					first_name: emp.first_name,
					last_name: emp.last_name,
					department: emp.department,
					hourly_rate: hourlyRate,
					employee_type: String(emp.contract_type ?? ''),
					status: ''
				},
				shifts: empAssignments.length,
				regularHours,
				hourlyRate,
				totalCost
			} satisfies ZzpSalaryRow;
		});
	});

	const zzpTotals = $derived.by<ZzpTotals>(() => {
		return zzpSalaryData.reduce(
			(acc, d) => ({
				totalShifts: acc.totalShifts + d.shifts,
				totalHours: acc.totalHours + d.regularHours,
				totalCost: acc.totalCost + d.totalCost
			}),
			{ totalShifts: 0, totalHours: 0, totalCost: 0 }
		);
	});

	const tabs: { id: TabId; label: string }[] = [
		{ id: 'salary', label: 'Salarisoverzicht' },
		{ id: 'zzp', label: "ZZP'ers" },
		{ id: 'ort', label: 'ORT Overzicht' },
		{ id: 'rates', label: 'Tarieven' }
	];

	function handleDownloadPdf(_row: EmployeeSalaryRow) {
		setToast('PDF download wordt ondersteund via de backend API.', 'warning');
	}

	function handlePreviewPdf(_row: EmployeeSalaryRow) {
		setToast('PDF preview wordt ondersteund via de backend API.', 'warning');
	}
</script>

<svelte:head>
	<title>Salarisadministratie | MaiCare</title>
</svelte:head>

<section class="space-y-8">
	<SalaryPageHeader
		{currentMonth}
		{includeBreaks}
		onNavigate={navigateMonth}
		onToggleBreaks={(v) => (includeBreaks = v)}
	/>

	{#if loadError}
		<InlineErrorBanner message={loadError} onRetry={loadAllData} />
	{/if}

	<SalaryStatsCards {totals} />

	<!-- Tab bar -->
	<div class="flex items-center gap-1 border-b border-border">
		{#each tabs as tab}
			<button
				class="relative px-5 py-3 text-sm font-semibold transition-colors {activeTab === tab.id
					? 'text-text'
					: 'text-text-subtle hover:text-text-muted'}"
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
				{#if activeTab === tab.id}
					<div class="absolute -bottom-px left-2 right-2 h-[2px] rounded-full bg-brand"></div>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Content area (no card wrapper) -->
	<div>
		{#if activeTab === 'salary'}
			<!-- Filters inline -->
			<div class="mb-6 flex flex-col gap-3 sm:flex-row">
				<div class="relative flex-1">
					<Search
						class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
					/>
					<input
						type="text"
						placeholder="Zoek medewerker..."
						bind:value={searchQuery}
						class="h-9 w-full rounded-xl border border-border bg-surface px-3 pl-9 text-sm text-text placeholder:text-text-subtle transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
					/>
				</div>
				<Select
					bind:value={employeeFilter}
					size="sm"
					options={[
						{ value: 'all', label: 'Alle medewerkers' },
						...visibleEmployees
							.sort((a, b) => a.first_name.localeCompare(b.first_name))
							.map((emp) => ({
								value: emp.id,
								label: `${emp.first_name} ${emp.last_name}`
							}))
					]}
					placeholder="Alle medewerkers"
				/>
				<Select
					bind:value={departmentFilter}
					size="sm"
					options={[
						{ value: 'all', label: 'Alle afdelingen' },
						...departments.map((d) => ({ value: d, label: d }))
					]}
					placeholder="Alle afdelingen"
				/>
			</div>

			<SalaryTable
				rows={employeeSalaryData}
				{totals}
				{loading}
				{includeBreaks}
				onDownloadPdf={handleDownloadPdf}
				onPreviewPdf={handlePreviewPdf}
			/>
		{:else if activeTab === 'zzp'}
			<ZZPTab rows={zzpSalaryData} totals={zzpTotals} {loading} />
		{:else if activeTab === 'ort'}
			<ORTTab rows={employeeSalaryData} {totals} {loading} />
		{:else if activeTab === 'rates'}
			<RatesTab scales={salaryScales} {loading} {includeBreaks} />
		{/if}
	</div>
</section>

<Toast
	message={toast?.message ?? null}
	type={toast?.type ?? 'success'}
	onClose={() => (toast = null)}
/>
