<script lang="ts">
	import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-svelte';
	import { getEmployeeSchedules } from '$lib/api/schedules';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
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

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const getDaysInMonth = (date: Date): number => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date): number => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

	const formatDateString = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const isSameDay = (date1: Date, date2: Date): boolean => {
		return formatDateString(date1) === formatDateString(date2);
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
				type: schedule.shift_name || m.schedule(),
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
			scheduleError = m.schedule_load_error();
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
		new Intl.DateTimeFormat(resolveLocale(), { month: 'long', year: 'numeric' }).format(
			currentDate
		)
	);

	const weekdayLabels = $derived.by(() => {
		const formatter = new Intl.DateTimeFormat(resolveLocale(), { weekday: 'narrow' });
		const weekStart = new Date(Date.UTC(2024, 0, 7));
		return Array.from({ length: 7 }, (_, index) =>
			formatter.format(new Date(weekStart.getTime() + index * 86400000))
		);
	});

	const formatDisplayDate = (dateText: string) =>
		new Intl.DateTimeFormat(resolveLocale(), {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(`${dateText}T00:00:00`));

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
		<h3 class="mb-4 flex items-center gap-2 font-semibold text-text">
			<Calendar class="h-4 w-4 text-brand" />
			{selectedEmployee ? m.schedule_for_employee({ name: selectedEmployee.first_name }) : m.select_employee()}
		</h3>

		{#if !selectedEmployee}
			<div class="flex items-center justify-center py-12 text-sm text-text-muted">
				{m.select_employee_first()}
			</div>
		{:else}
			<div class="space-y-4">
				{#if isLoadingSchedules}
					<div class="flex items-center justify-center gap-3 py-8">
						<Loader2 class="h-5 w-5 animate-spin text-brand" />
						<span class="text-sm text-text-muted">{m.schedule_loading()}</span>
					</div>
				{:else if scheduleError}
					<div class="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
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
					{#each weekdayLabels as day, index (index)}
						<div class="text-xs font-semibold text-text-muted uppercase">{day}</div>
					{/each}
				</div>

				<!-- Calendar Grid -->
				<div class="grid grid-cols-7 gap-2">
					{#each calendarDays as date, index (date ? formatDateString(date) : `empty-${index}`)}
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
								class="group relative flex flex-col gap-1 rounded-lg border-2 p-2 text-center text-xs transition {isStart ||
								isEnd
									? 'border-brand bg-brand/10'
									: inRange
										? 'border-brand/30 bg-brand/5'
										: isToday
											? 'border-warning bg-warning/5'
											: 'hover:bg-surface-subtle/50 border-border/40'}"
							>
								<span
									class="font-semibold {isStart || isEnd
										? 'text-brand'
										: isToday
											? 'text-warning'
											: 'text-text'}"
								>
									{date.getDate()}
								</span>

								{#if shifts.length > 0}
									<div class="flex flex-col gap-0.5">
										{#each shifts.slice(0, 2) as shift (`${shift.date}-${shift.startTime}-${shift.endTime}-${shift.type}`)}
											<div
												class="rounded border {shift.color} px-1 py-0.5 text-[10px] leading-none font-semibold"
											>
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
					<div class="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
						<p class="font-semibold text-text">{m.schedule_selected_period()}</p>
						<p class="text-xs text-text-muted">
							{formatDisplayDate(selectedStartDate)} {m.to().toLowerCase()} {formatDisplayDate(selectedEndDate)}
						</p>
					</div>
				{:else if selectedStartDate}
					<div class="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
						<p class="text-xs text-text-muted">{m.schedule_select_second_date()}</p>
					</div>
				{/if}

				<!-- Legend -->
				<div class="grid grid-cols-2 gap-2 text-[10px] text-text-muted">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-sm border border-brand/30 bg-brand/10"></div>
						<span>{m.schedule_legend_worked()}</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-sm border-2 border-warning"></div>
						<span>{m.today()}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
