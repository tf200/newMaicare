<script lang="ts">
	import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-svelte';
	import { getEmployeeSchedules } from '$lib/api/schedules';
	import type { EmployeeListItem } from '$lib/api/employees';
	import type { ScheduleResponseItem } from '$lib/types/api';

	interface Shift {
		date: string;
		type: string;
		startTime: string;
		endTime: string;
		color: string;
	}

	interface Props {
		selectedEmployee?: EmployeeListItem | null;
		onDateRangeSelect?: (startDate: string, endDate: string) => void;
		selectedStartDate?: string | null;
		selectedEndDate?: string | null;
	}

	let {
		selectedEmployee,
		onDateRangeSelect,
		selectedStartDate = $bindable<string | null>(null),
		selectedEndDate = $bindable<string | null>(null)
	}: Props = $props();

	let currentDate = $state(new Date());
	let rangeStartDate: Date | null = $state(null);
	let isSelectingRange = $state(false);
	let employeeSchedules = $state<ScheduleResponseItem[]>([]);
	let isLoadingSchedules = $state(false);
	let scheduleError = $state<string | null>(null);

	const getDaysInMonth = (date: Date): number => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date): number => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

	const formatDateString = (date: Date): string => {
		return date.toISOString().split('T')[0];
	};

	const isSameDay = (date1: Date, date2: Date): boolean => {
		return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
	};

	const convertScheduleToShifts = (schedules: ScheduleResponseItem[]): Record<string, Shift[]> => {
		const shifts: Record<string, Shift[]> = {};

		schedules.forEach((schedule) => {
			const startDate = schedule.start_datetime.split('T')[0];
			const startTime = schedule.start_datetime.split('T')[1]?.slice(0, 5) || '00:00';
			const endTime = schedule.end_datetime.split('T')[1]?.slice(0, 5) || '00:00';

			if (!shifts[startDate]) {
				shifts[startDate] = [];
			}

			shifts[startDate].push({
				date: startDate,
				type: schedule.shift_name || 'Dienst',
				startTime,
				endTime,
				color: 'bg-brand/10 border-brand/30'
			});
		});

		return shifts;
	};

	const getDayShifts = (dateStr: string): Shift[] => {
		const shifts = convertScheduleToShifts(employeeSchedules);
		return shifts[dateStr] || [];
	};

	const fetchEmployeeSchedules = async (employee: EmployeeListItem) => {
		if (!employee?.id) return;

		isLoadingSchedules = true;
		scheduleError = null;

		try {
			// Fetch schedules for the current month
			const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
			const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

			const response = await getEmployeeSchedules({
				employeeId: employee.id,
				startDate: formatDateString(startDate),
				endDate: formatDateString(endDate)
			});

			if (response.data) {
				const data = response.data as any;
				employeeSchedules = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
			}
		} catch (error) {
			console.error('Failed to fetch employee schedules:', error);
			scheduleError = 'Kon schema niet laden';
			employeeSchedules = [];
		} finally {
			isLoadingSchedules = false;
		}
	};

	const goToPreviousMonth = (): void => {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
		if (selectedEmployee) {
			fetchEmployeeSchedules(selectedEmployee);
		}
	};

	const goToNextMonth = (): void => {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
		if (selectedEmployee) {
			fetchEmployeeSchedules(selectedEmployee);
		}
	};

	const handleDateClick = (clickDate: Date): void => {
		const dateStr = formatDateString(clickDate);

		if (!isSelectingRange) {
			rangeStartDate = clickDate;
			isSelectingRange = true;
			selectedStartDate = dateStr;
			selectedEndDate = null;
		} else {
			let startStr = formatDateString(rangeStartDate!);
			let endStr = dateStr;

			// Ensure start is before end
			if (rangeStartDate! > clickDate) {
				[startStr, endStr] = [endStr, startStr];
				rangeStartDate = clickDate;
			}

			selectedStartDate = startStr;
			selectedEndDate = endStr;
			isSelectingRange = false;
			onDateRangeSelect?.(startStr, endStr);
		}
	};

	const isDateInRange = (date: Date): boolean => {
		if (!selectedStartDate || !selectedEndDate) return false;
		const dateStr = formatDateString(date);
		return dateStr >= selectedStartDate && dateStr <= selectedEndDate;
	};

	const isDateRangeStart = (date: Date): boolean => {
		return formatDateString(date) === selectedStartDate;
	};

	const isDateRangeEnd = (date: Date): boolean => {
		return formatDateString(date) === selectedEndDate;
	};

	const monthName = $derived(
		new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(currentDate)
	);

	const calendarDays = $derived.by(() => {
		const daysInMonth = getDaysInMonth(currentDate);
		const firstDay = getFirstDayOfMonth(currentDate);
		const days: (Date | null)[] = [];

		// Add empty cells for days before month starts
		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		// Add days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
		}

		return days;
	});

	// Watch for employee selection changes
	$effect(() => {
		if (selectedEmployee?.id) {
			fetchEmployeeSchedules(selectedEmployee);
		}
	});
</script>

<div class="flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface p-6 shadow-sm">
	<div>
		<h3 class="flex items-center gap-2 font-semibold text-text mb-4">
			<Calendar class="h-4 w-4 text-brand" />
			{selectedEmployee ? `Schema ${selectedEmployee.first_name}` : 'Selecteer medewerker'}
		</h3>

		{#if !selectedEmployee}
			<div class="flex items-center justify-center py-12 text-sm text-text-muted">
				Selecteer eerst een medewerker
			</div>
		{:else}
			<div class="space-y-4">
				{#if isLoadingSchedules}
					<div class="flex items-center justify-center gap-3 py-8">
						<Loader2 class="h-5 w-5 animate-spin text-brand" />
						<span class="text-sm text-text-muted">Schema laden...</span>
					</div>
				{:else if scheduleError}
					<div class="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
						{scheduleError}
					</div>
				{/if}

				<!-- Month Header -->
				<div class="flex items-center justify-between">
					<button
						type="button"
						onclick={goToPreviousMonth}
						class="rounded-lg p-1 transition hover:bg-border/20"
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<h4 class="text-sm font-semibold text-text capitalize">{monthName}</h4>
					<button
						type="button"
						onclick={goToNextMonth}
						class="rounded-lg p-1 transition hover:bg-border/20"
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>

				<!-- Day Headers -->
				<div class="grid grid-cols-7 gap-2 text-center">
					{#each ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'] as day}
						<div class="text-xs font-semibold text-text-muted uppercase">{day}</div>
					{/each}
				</div>

				<!-- Calendar Grid -->
				<div class="grid grid-cols-7 gap-2">
					{#each calendarDays as date}
						{#if date === null}
							<div></div>
						{:else}
							{@const dateStr = formatDateString(date)}
							{@const shifts = getDayShifts(dateStr)}
							{@const isStart = isDateRangeStart(date)}
							{@const isEnd = isDateRangeEnd(date)}
							{@const inRange = isDateInRange(date)}
							{@const isToday = isSameDay(date, new Date())}
							<button
								type="button"
								onclick={() => handleDateClick(date)}
								class="group relative flex flex-col gap-1 rounded-lg border-2 p-2 text-center text-xs transition {isStart || isEnd
									? 'border-brand bg-brand/10'
									: inRange
										? 'border-brand/30 bg-brand/5'
										: isToday
											? 'border-warning bg-warning/5'
											: 'border-border/40 hover:bg-surface-subtle/50'}"
							>
								<span class="font-semibold {isStart || isEnd ? 'text-brand' : isToday ? 'text-warning' : 'text-text'}">
									{date.getDate()}
								</span>

								{#if shifts.length > 0}
									<div class="flex flex-col gap-0.5">
										{#each shifts.slice(0, 2) as shift}
											<div class="rounded border {shift.color} px-1 py-0.5 text-[10px] font-semibold leading-none">
												{shift.type.slice(0, 3)}
											</div>
										{/each}
										{#if shifts.length > 2}
											<div class="text-[9px] text-text-muted">
												+{shifts.length - 2}
											</div>
										{/if}
									</div>
								{/if}
							</button>
						{/if}
					{/each}
				</div>

				<!-- Selected Range Display -->
				{#if selectedStartDate && selectedEndDate}
					<div class="rounded-xl bg-brand/5 border border-brand/20 px-4 py-3 text-sm">
						<p class="font-semibold text-text">Geselecteerde periode:</p>
						<p class="text-xs text-text-muted">
							{new Date(selectedStartDate).toLocaleDateString('nl-NL')} tot {new Date(selectedEndDate).toLocaleDateString('nl-NL')}
						</p>
					</div>
				{:else if selectedStartDate}
					<div class="rounded-xl bg-brand/5 border border-brand/20 px-4 py-3 text-sm">
						<p class="text-xs text-text-muted">
							Klik op een tweede datum om bereik te selecteren
						</p>
					</div>
				{/if}

				<!-- Legend -->
				<div class="grid grid-cols-2 gap-2 text-[10px] text-text-muted">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-sm bg-brand/10 border border-brand/30"></div>
						<span>Gewerkt</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-sm border-2 border-warning"></div>
						<span>Vandaag</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
