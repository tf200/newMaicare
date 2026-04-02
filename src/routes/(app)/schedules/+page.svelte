<script lang="ts">
	import type { PageData } from './$types';
	import {
		CalendarDays,
		CalendarCheck,
		Clock,
		Users,
		CircleDot,
		Hourglass,
		FileDown,
		Mail,
		Settings
	} from 'lucide-svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import AssignEmployeesSheet from '$lib/components/schedules/AssignEmployeesSheet.svelte';
	import AutoGenerateScheduleModal from '$lib/components/schedules/AutoGenerateScheduleModal.svelte';
	import SchedulesTabContent from '$lib/components/schedules/tabs/SchedulesTabContent.svelte';
	import OpenServicesTabPage from '$lib/components/schedules/tabs/OpenServicesTabPage.svelte';
	import HoursTabPage from '$lib/components/schedules/tabs/HoursTabPage.svelte';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import { getLocationSchedules, listLocations } from '$lib/api/locations';
	import { createSchedules, deleteSchedule } from '$lib/api/schedules';
	import { m } from '$lib/paraglide/messages';
	import type {
		CreateScheduleCustomRequest,
		CreateSchedulePresetRequest,
		LocationScheduleDay,
		LocationScheduleShiftItem,
		LocationShift,
		OrganizationLocation,
		ScheduleRecurrence
	} from '$lib/types/api';

	interface Employee {
		id: string;
		name: string;
		scheduleId: string | null;
	}

	interface ShiftTemplate {
		id: string;
		name: string;
		startTime: string;
		endTime: string;
		isCrossMidnight: boolean;
		colorClass: string;
	}

	interface ScheduledShift {
		id: string;
		templateId: string;
		date: string;
		employees: Employee[];
	}

	interface DateRange {
		startDate: string;
		endDate: string;
	}

	let { data }: { data: PageData } = $props();

	const TEMPLATE_COLORS = [
		'bg-emerald-500 text-white dark:bg-emerald-700',
		'bg-amber-500 text-white dark:bg-amber-700',
		'bg-indigo-500 text-white dark:bg-indigo-700',
		'bg-sky-500 text-white dark:bg-sky-700',
		'bg-rose-500 text-white dark:bg-rose-700',
		'bg-orange-500 text-white dark:bg-orange-700',
		'bg-violet-500 text-white dark:bg-violet-700',
		'bg-cyan-500 text-white dark:bg-cyan-700'
	] as const;

	let searchedLocationsById = $state<Record<string, OrganizationLocation>>({});
	let locationsById = $derived.by(() => {
		const merged: Record<string, OrganizationLocation> = {};

		for (const location of data.locations) {
			merged[location.id] = location;
		}

		for (const locationId of Object.keys(searchedLocationsById)) {
			merged[locationId] = searchedLocationsById[locationId];
		}

		return merged;
	});
	let selectedLocationId = $state('');
	let selectedLocationDisplay = $state('');
	let viewMode = $state<'weekly' | 'monthly'>('weekly');
	let weekOffset = $state(0);
	let monthOffset = $state(0);
	const weekdaysShort = [
		m.weekday_mon_short(),
		m.weekday_tue_short(),
		m.weekday_wed_short(),
		m.weekday_thu_short(),
		m.weekday_fri_short(),
		m.weekday_sat_short(),
		m.weekday_sun_short()
	];

	let schedulesLoading = $state(false);
	let schedulesError = $state<string | null>(null);
	let currentShifts = $state<ScheduledShift[]>([]);
	let scheduleFetchNonce = $state(0);
	let scheduleRequestId = 0;
	let employeesLoading = $state(false);
	let employeesLoadError = $state<string | null>(null);
	let locationEmployees = $state<Employee[]>([]);
	let employeeSearchQuery = $state('');
	let employeeFetchNonce = $state(0);
	let employeeRequestId = 0;

	// Assign Employees Side Sheet State
	let assignSheetOpen = $state(false);
	let assignSheetDate = $state('');
	let assignSheetTemplateId = $state<string | null>(null);
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;
	let deletingScheduleIds = $state<string[]>([]);
	let autoGenerateModalOpen = $state(false);
	let activeTab = $state<'schedules' | 'open-services' | 'hours'>('schedules');

	const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	const SHIFT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
	const VALID_RECURRENCES: ReadonlySet<ScheduleRecurrence> = new Set([
		'none',
		'end_of_week',
		'end_of_month'
	]);

	let availableEmployees = $derived(locationEmployees);

	function openAssignSheet(date: string, templateId: string | null = null) {
		assignSheetDate = date;
		assignSheetTemplateId = templateId;
		employeeSearchQuery = '';
		assignSheetOpen = true;
	}

	function isUuid(value: string): boolean {
		return UUID_PATTERN.test(value);
	}

	function isValidShiftDate(value: string): boolean {
		if (!SHIFT_DATE_PATTERN.test(value)) {
			return false;
		}

		const [year, month, day] = value.split('-').map(Number);
		const parsedDate = new Date(Date.UTC(year, month - 1, day));

		return (
			parsedDate.getUTCFullYear() === year &&
			parsedDate.getUTCMonth() === month - 1 &&
			parsedDate.getUTCDate() === day
		);
	}

	function parseDatetime(value: string): Date | null {
		const parsedDate = new Date(value);
		return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
	}

	function resetToastAfterDelay() {
		if (toastTimeout) {
			clearTimeout(toastTimeout);
		}

		toastTimeout = setTimeout(() => {
			toast = null;
		}, 4000);
	}

	async function handleAssign(
		isCustom: boolean,
		templateId: string,
		startDatetime: string,
		endDatetime: string,
		employeeIds: string[],
		recurrence: ScheduleRecurrence
	) {
		if (!selectedLocationId || !isUuid(selectedLocationId)) {
			throw new Error('Please select a valid location before assigning employees.');
		}

		if (!VALID_RECURRENCES.has(recurrence)) {
			throw new Error('Selected recurrence is invalid. Please re-open the assignment panel.');
		}

		const normalizedEmployeeIds = employeeIds.map((id) => id.trim());

		if (normalizedEmployeeIds.length === 0) {
			throw new Error('Please select at least one valid employee.');
		}

		if (normalizedEmployeeIds.some((id) => !id || !isUuid(id))) {
			throw new Error('One or more selected employees are invalid. Please reselect and try again.');
		}

		const lowerCaseEmployeeIds = normalizedEmployeeIds.map((id) => id.toLowerCase());
		if (new Set(lowerCaseEmployeeIds).size !== lowerCaseEmployeeIds.length) {
			throw new Error('Duplicate employees are not allowed in a single assignment.');
		}

		let payload: CreateScheduleCustomRequest | CreateSchedulePresetRequest;

		if (isCustom) {
			if (!startDatetime || !endDatetime) {
				throw new Error('Start and end times are required for custom shifts.');
			}

			const parsedStartDatetime = parseDatetime(startDatetime);
			const parsedEndDatetime = parseDatetime(endDatetime);

			if (!parsedStartDatetime || !parsedEndDatetime) {
				throw new Error('Start or end time is invalid. Please choose valid date-times.');
			}

			if (parsedStartDatetime >= parsedEndDatetime) {
				throw new Error('End time must be after start time.');
			}

			payload = {
				employee_ids: normalizedEmployeeIds,
				location_id: selectedLocationId,
				is_custom: true,
				recurrence,
				start_datetime: parsedStartDatetime.toISOString(),
				end_datetime: parsedEndDatetime.toISOString()
			};
		} else {
			if (!templateId || !isUuid(templateId)) {
				throw new Error(
					'This shift template is not yet synced. Please use a saved location shift.'
				);
			}

			if (!assignSheetDate || !isValidShiftDate(assignSheetDate)) {
				throw new Error('Selected date is invalid. Please re-open the assignment panel.');
			}

			payload = {
				employee_ids: normalizedEmployeeIds,
				location_id: selectedLocationId,
				is_custom: false,
				recurrence,
				location_shift_id: templateId,
				shift_date: assignSheetDate
			};
		}

		try {
			await createSchedules(payload);
		} catch (error) {
			throw new Error(
				error instanceof Error && error.message
					? error.message
					: 'Unable to assign employees right now. Please try again.'
			);
		}

		toast = {
			message: `Successfully assigned ${normalizedEmployeeIds.length} employee(s).`,
			type: 'success'
		};
		resetToastAfterDelay();
		retrySchedulesFetch();
	}

	async function handleUnassignEmployee(scheduleId: string) {
		if (!scheduleId || !isUuid(scheduleId)) {
			const message = 'Unable to unassign this employee because the assignment id is invalid.';
			toast = { message, type: 'warning' };
			resetToastAfterDelay();
			schedulesError = message;
			return;
		}

		if (deletingScheduleIds.includes(scheduleId)) {
			return;
		}

		deletingScheduleIds = [...deletingScheduleIds, scheduleId];

		try {
			await deleteSchedule(scheduleId);
			toast = { message: 'Employee unassigned successfully.', type: 'success' };
			resetToastAfterDelay();
			schedulesError = null;
			retrySchedulesFetch();
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: 'Unable to unassign employee right now. Please try again.';
			toast = { message, type: 'error' };
			resetToastAfterDelay();
			schedulesError = message;
		} finally {
			deletingScheduleIds = deletingScheduleIds.filter((id) => id !== scheduleId);
		}
	}

	function parseDateOnly(dateText: string): Date {
		const [year, month, day] = dateText.split('-').map(Number);
		return new Date(year, month - 1, day);
	}

	function addDays(base: Date, days: number): Date {
		const next = new Date(base);
		next.setDate(next.getDate() + days);
		return next;
	}

	function startOfISOWeek(base: Date): Date {
		const date = new Date(base);
		const day = date.getDay() || 7; // Sunday (0) -> 7
		date.setDate(date.getDate() - (day - 1));
		date.setHours(0, 0, 0, 0);
		return date;
	}

	function formatDateKey(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function normalizeTime(value: string | null | undefined): string {
		if (!value) return '00:00';

		const isoMatch = value.match(/T(\d{2}):(\d{2})(?::\d{2})?/);
		if (isoMatch) {
			return `${isoMatch[1]}:${isoMatch[2]}`;
		}

		const clockMatch = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
		if (clockMatch) {
			return `${clockMatch[1]}:${clockMatch[2]}`;
		}

		return '00:00';
	}

	function isCrossMidnight(startTime: string, endTime: string): boolean {
		return endTime <= startTime;
	}

	function hashText(value: string): number {
		let hash = 0;
		for (let index = 0; index < value.length; index += 1) {
			hash = (hash * 31 + value.charCodeAt(index)) | 0;
		}
		return Math.abs(hash);
	}

	function pickTemplateColor(seed: string, index: number): string {
		return TEMPLATE_COLORS[(hashText(seed) + index) % TEMPLATE_COLORS.length];
	}

	function slugify(value: string): string {
		return value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function fallbackTemplateId(
		shiftName: string,
		startTime: string,
		endTime: string,
		slot: number | null,
		index: number
	): string {
		const shiftSlug = slugify(shiftName) || 'shift';
		const startToken = startTime.replace(':', '');
		const endToken = endTime.replace(':', '');
		const slotToken = slot ?? index + 1;
		return `template-${shiftSlug}-${startToken}-${endToken}-slot-${slotToken}`;
	}

	function getTemplateIdFromLocationShift(locationShift: LocationShift, index: number): string {
		const startTime = normalizeTime(locationShift.start_time);
		const endTime = normalizeTime(locationShift.end_time);
		return (
			locationShift.id ??
			fallbackTemplateId(locationShift.shift, startTime, endTime, locationShift.slot ?? null, index)
		);
	}

	function buildShiftSignature(
		shiftName: string | null | undefined,
		startTime: string,
		endTime: string
	): string {
		return `${(shiftName ?? '').trim().toLowerCase()}|${startTime}|${endTime}`;
	}

	function getISOWeek(d: Date): number {
		const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
		const dayNum = date.getUTCDay() || 7;
		date.setUTCDate(date.getUTCDate() + 4 - dayNum);
		const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
		return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	}

	function getISOWeekYear(d: Date): number {
		const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
		const dayNum = date.getUTCDay() || 7;
		date.setUTCDate(date.getUTCDate() + 4 - dayNum);
		return date.getUTCFullYear();
	}

	function formatDateRange(startDate: string, endDate: string): string {
		if (!startDate || !endDate) return '';
		const start = parseDateOnly(startDate);
		const end = parseDateOnly(endDate);
		const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		const endLabel = end.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
		return `${startLabel} - ${endLabel}`;
	}

	async function loadLocationOptions(query: string): Promise<OrganizationLocation[]> {
		const response = await listLocations({
			search: query.trim() || undefined,
			pageSize: 20
		});

		if (response.data.results.length > 0) {
			const nextLocations = { ...searchedLocationsById };
			for (const location of response.data.results) {
				nextLocations[location.id] = location;
			}
			searchedLocationsById = nextLocations;
		}

		return response.data.results;
	}

	function retrySchedulesFetch() {
		scheduleFetchNonce += 1;
	}

	function retryEmployeeFetch() {
		employeeFetchNonce += 1;
	}

	function handleGeneratedScheduleSaved() {
		toast = { message: 'Generated schedule saved successfully.', type: 'success' };
		resetToastAfterDelay();
		retrySchedulesFetch();
	}

	function openAutoGenerateModal() {
		autoGenerateModalOpen = true;
	}

	function handleEmployeeSearchQueryChange(query: string) {
		employeeSearchQuery = query;
	}

	function mapEmployeeOption(employee: EmployeeListItem): Employee {
		const firstName = employee.first_name?.trim() ?? '';
		const lastName = employee.last_name?.trim() ?? '';
		const name = `${firstName} ${lastName}`.trim() || 'Unknown employee';

		return {
			id: employee.id,
			name,
			scheduleId: null
		};
	}

	async function fetchEmployees(searchQuery: string): Promise<Employee[]> {
		const response = await listEmployees({
			page: 1,
			pageSize: 6,
			search: searchQuery || undefined,
			isArchived: false,
			outOfService: false
		});

		const uniqueEmployeesById = new Map<string, Employee>();
		for (const employee of response.data.results) {
			if (!isUuid(employee.id)) continue;
			uniqueEmployeesById.set(employee.id, mapEmployeeOption(employee));
		}

		return Array.from(uniqueEmployeesById.values());
	}

	let firstLocationId = $derived(data.locations[0]?.id ?? '');

	$effect(() => {
		if (!selectedLocationId && firstLocationId) {
			selectedLocationId = firstLocationId;
			return;
		}

		if (selectedLocationId && !locationsById[selectedLocationId] && firstLocationId) {
			selectedLocationId = firstLocationId;
		}
	});

	$effect(() => {
		selectedLocationDisplay = locationsById[selectedLocationId]?.name ?? '';
	});

	let selectedLocation = $derived.by(() => locationsById[selectedLocationId] ?? null);

	let sortedLocationShifts = $derived.by(() => {
		const shifts = selectedLocation?.shifts ?? [];
		return [...shifts].sort((left, right) => {
			const leftSlot = left.slot ?? Number.MAX_SAFE_INTEGER;
			const rightSlot = right.slot ?? Number.MAX_SAFE_INTEGER;
			if (leftSlot !== rightSlot) return leftSlot - rightSlot;
			return left.shift.localeCompare(right.shift);
		});
	});

	let templates = $derived.by(() => {
		return sortedLocationShifts.map((shift, index): ShiftTemplate => {
			const startTime = normalizeTime(shift.start_time);
			const endTime = normalizeTime(shift.end_time);
			const id = getTemplateIdFromLocationShift(shift, index);
			const colorClass = pickTemplateColor(`${shift.shift}|${shift.slot ?? index}|${id}`, index);

			return {
				id,
				name: shift.shift,
				startTime,
				endTime,
				isCrossMidnight: isCrossMidnight(startTime, endTime),
				colorClass
			};
		});
	});

	let templateById = $derived.by(() => {
		const map = new Map<string, ShiftTemplate>();
		for (const template of templates) {
			map.set(template.id, template);
		}
		return map;
	});

	let templateIdByLocationShiftId = $derived.by(() => {
		const map = new Map<string, string>();

		for (const [index, shift] of sortedLocationShifts.entries()) {
			if (!shift.id) continue;
			map.set(shift.id, getTemplateIdFromLocationShift(shift, index));
		}

		return map;
	});

	let templateIdBySignature = $derived.by(() => {
		const map = new Map<string, string>();

		for (const [index, shift] of sortedLocationShifts.entries()) {
			const startTime = normalizeTime(shift.start_time);
			const endTime = normalizeTime(shift.end_time);
			const signature = buildShiftSignature(shift.shift, startTime, endTime);
			map.set(signature, getTemplateIdFromLocationShift(shift, index));
		}

		return map;
	});

	let weekStart = $derived.by(() => {
		const base = data.baseDate ? parseDateOnly(data.baseDate) : new Date();
		return addDays(startOfISOWeek(base), weekOffset * 7);
	});

	let visibleDays = $derived.by(() => {
		const base = data.baseDate ? parseDateOnly(data.baseDate) : new Date();
		const todayKey = formatDateKey(base);
		return Array.from({ length: 7 }, (_, index) => {
			const date = addDays(weekStart, index);
			const dateKey = formatDateKey(date);
			return {
				date: dateKey,
				dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
				dayNumber: date.getDate(),
				isToday: dateKey === todayKey
			};
		});
	});

	let weeklyRange = $derived.by<DateRange>(() => {
		const start = visibleDays[0]?.date ?? '';
		const end = visibleDays[visibleDays.length - 1]?.date ?? '';
		return { startDate: start, endDate: end };
	});

	let currentMonthDate = $derived.by(() => {
		const base = data.baseDate ? parseDateOnly(data.baseDate) : new Date();
		return new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
	});

	let monthlyDays = $derived.by(() => {
		const year = currentMonthDate.getFullYear();
		const month = currentMonthDate.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);

		const startDayOfWeek = firstDay.getDay() || 7;
		const startDate = new Date(firstDay);
		startDate.setDate(startDate.getDate() - (startDayOfWeek - 1));

		const endDayOfWeek = lastDay.getDay() || 7;
		const endDate = new Date(lastDay);
		endDate.setDate(endDate.getDate() + (7 - endDayOfWeek));

		const days = [];
		let current = new Date(startDate);
		const base = data.baseDate ? parseDateOnly(data.baseDate) : new Date();
		const todayKey = formatDateKey(base);

		while (current <= endDate) {
			days.push({
				date: formatDateKey(current),
				dayNumber: current.getDate(),
				dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
				isCurrentMonth: current.getMonth() === month,
				isToday: formatDateKey(current) === todayKey
			});
			current.setDate(current.getDate() + 1);
		}

		return days;
	});

	let monthlyRange = $derived.by<DateRange>(() => {
		const start = monthlyDays[0]?.date ?? '';
		const end = monthlyDays[monthlyDays.length - 1]?.date ?? '';
		return { startDate: start, endDate: end };
	});

	let activeRange = $derived.by(() => (viewMode === 'weekly' ? weeklyRange : monthlyRange));

	let visibleDateRange = $derived.by(() => {
		return formatDateRange(activeRange.startDate, activeRange.endDate);
	});

	function resolveTemplateIdFromScheduleShift(shift: LocationScheduleShiftItem): string | null {
		if (shift.location_shift_id) {
			const templateIdFromLocationShift = templateIdByLocationShiftId.get(shift.location_shift_id);
			if (templateIdFromLocationShift) {
				return templateIdFromLocationShift;
			}
		}

		const signature = buildShiftSignature(
			shift.shift_name,
			normalizeTime(shift.start_time),
			normalizeTime(shift.end_time)
		);

		const fromSignature = templateIdBySignature.get(signature);
		if (fromSignature) {
			return fromSignature;
		}

		if (shift.location_shift_id) {
			return shift.location_shift_id;
		}

		if (shift.shift_name) {
			return `custom-${slugify(shift.shift_name)}-${normalizeTime(shift.start_time)}-${normalizeTime(shift.end_time)}`;
		}

		return null;
	}

	function mapSchedules(days: LocationScheduleDay[]): ScheduledShift[] {
		const groupedShifts = new Map<string, ScheduledShift>();

		for (const day of days) {
			for (const shift of day.shifts) {
				const templateId = resolveTemplateIdFromScheduleShift(shift);
				if (!templateId) continue;

				const groupKey = `${day.date}|${templateId}`;
				let scheduledShift = groupedShifts.get(groupKey);

				if (!scheduledShift) {
					scheduledShift = {
						id: `${day.date}-${templateId}`,
						templateId,
						date: day.date,
						employees: []
					};
					groupedShifts.set(groupKey, scheduledShift);
				}

				const employeeName = `${shift.employee_first_name} ${shift.employee_last_name}`.trim();
				const scheduleId = shift.schedule_id ?? null;
				const employeeId =
					shift.employee_id || scheduleId || `${day.date}-${templateId}-${employeeName}`;
				if (!employeeId) continue;

				if (!scheduledShift.employees.some((employee) => employee.id === employeeId)) {
					scheduledShift.employees.push({
						id: employeeId,
						name: employeeName || 'Unknown employee',
						scheduleId
					});
				}
			}
		}

		const templateOrder = new Map<string, number>();
		for (const [index, template] of templates.entries()) {
			templateOrder.set(template.id, index);
		}

		return Array.from(groupedShifts.values()).sort((left, right) => {
			if (left.date !== right.date) return left.date.localeCompare(right.date);
			return (
				(templateOrder.get(left.templateId) ?? 999) - (templateOrder.get(right.templateId) ?? 999)
			);
		});
	}

	$effect(() => {
		const locationId = selectedLocationId;
		const sheetOpen = assignSheetOpen;
		const searchQuery = employeeSearchQuery.trim();
		const retryCount = employeeFetchNonce;

		void retryCount;

		if (!locationId) {
			employeeRequestId += 1;
			locationEmployees = [];
			employeesLoadError = null;
			employeesLoading = false;
			return;
		}

		if (!sheetOpen) {
			employeeRequestId += 1;
			locationEmployees = [];
			employeesLoadError = null;
			employeesLoading = false;
			return;
		}

		const requestId = ++employeeRequestId;
		employeesLoading = true;
		employeesLoadError = null;

		fetchEmployees(searchQuery)
			.then((employees) => {
				if (requestId !== employeeRequestId) return;
				locationEmployees = employees;
			})
			.catch((error) => {
				if (requestId !== employeeRequestId) return;
				locationEmployees = [];
				employeesLoadError = error instanceof Error ? error.message : 'Failed to load employees.';
			})
			.finally(() => {
				if (requestId !== employeeRequestId) return;
				employeesLoading = false;
			});
	});

	$effect(() => {
		const locationId = selectedLocationId;
		const startDate = activeRange.startDate;
		const endDate = activeRange.endDate;
		const currentViewMode = viewMode;
		const retryCount = scheduleFetchNonce;

		void currentViewMode;
		void retryCount;

		if (!locationId || !startDate || !endDate) {
			currentShifts = [];
			schedulesError = null;
			schedulesLoading = false;
			return;
		}

		const requestId = ++scheduleRequestId;
		schedulesLoading = true;
		schedulesError = null;

		getLocationSchedules(locationId, { startDate, endDate })
			.then((response) => {
				if (requestId !== scheduleRequestId) return;
				currentShifts = mapSchedules(response.data);
			})
			.catch((error) => {
				if (requestId !== scheduleRequestId) return;
				currentShifts = [];
				schedulesError =
					error instanceof Error ? error.message : 'Failed to load schedules for this range.';
			})
			.finally(() => {
				if (requestId !== scheduleRequestId) return;
				schedulesLoading = false;
			});
	});

	let shiftsByTemplateDate = $derived.by(() => {
		const grouped = new Map<string, ScheduledShift[]>();

		for (const shift of currentShifts) {
			const key = `${shift.templateId}|${shift.date}`;
			const existing = grouped.get(key);
			if (existing) {
				existing.push(shift);
				continue;
			}
			grouped.set(key, [shift]);
		}

		return grouped;
	});

	let shiftsByDate = $derived.by(() => {
		const grouped = new Map<string, ScheduledShift[]>();

		for (const shift of currentShifts) {
			const existing = grouped.get(shift.date);
			if (existing) {
				existing.push(shift);
				continue;
			}
			grouped.set(shift.date, [shift]);
		}

		return grouped;
	});

	function getShifts(templateId: string, date: string): ScheduledShift[] {
		return shiftsByTemplateDate.get(`${templateId}|${date}`) ?? [];
	}
</script>

<div class="flex h-full flex-col gap-4 p-6">
	<div class="flex items-center justify-between">
		<div
			class="flex shrink-0 rounded-xl border border-border bg-surface p-1 shadow-sm"
		>
			<button
				onclick={() => (activeTab = 'schedules')}
				class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all
				{activeTab === 'schedules'
					? 'border border-border/50 bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
					: 'text-text-muted hover:text-text'}"
			>
				<CalendarDays class="h-4 w-4" />
				Schedules
			</button>
			<button
				onclick={() => (activeTab = 'open-services')}
				class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all
				{activeTab === 'open-services'
					? 'border border-border/50 bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
					: 'text-text-muted hover:text-text'}"
			>
				<CircleDot class="h-4 w-4" />
				Open Services
			</button>
			<button
				onclick={() => (activeTab = 'hours')}
				class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all
				{activeTab === 'hours'
					? 'border border-border/50 bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
					: 'text-text-muted hover:text-text'}"
			>
				<Clock class="h-4 w-4" />
				Hours
			</button>
		</div>

	</div>

	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-teal-100/70 to-emerald-100/20 blur-2xl"
		></div>
		<div class="relative space-y-2">
			<h1 class="text-3xl font-bold tracking-tighter text-text">{m.schedules_management()}</h1>
			<p class="max-w-2xl text-sm font-medium text-text-muted">
				Plan and manage employee shifts across your care locations.
			</p>
		</div>
	</header>

	{#if activeTab === 'schedules'}
		<div class="flex flex-wrap items-center gap-2 sm:justify-end">
			<Button variant="secondary" class="gap-2 rounded-xl">
				<FileDown class="h-4 w-4" />
				Export PDF
			</Button>
			<Button variant="secondary" class="gap-2 rounded-xl">
				<Mail class="h-4 w-4" />
				E-mail
			</Button>
			<Button class="gap-2 rounded-xl">
				<Settings class="h-4 w-4" />
				Manage Services
			</Button>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div
				class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-brand/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-brand opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<CalendarCheck class="h-28 w-28" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						Scheduled This Week
					</div>
					<div class="mt-2 text-2xl font-bold tracking-tight text-brand sm:text-3xl">0</div>
					<p class="mt-2 text-xs font-medium text-text-muted">services</p>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-emerald-500/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-emerald-600 opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<Users class="h-28 w-28" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						Available Employees
					</div>
					<div class="mt-2 text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">6</div>
					<p class="mt-2 text-xs font-medium text-text-muted">active</p>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-amber-500/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-amber-600 opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<CircleDot class="h-28 w-28" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						Open Services
					</div>
					<div class="mt-2 text-2xl font-bold tracking-tight text-amber-600 sm:text-3xl">0</div>
					<p class="mt-2 text-xs font-medium text-text-muted">to be filled in</p>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-indigo-500/30"
			>
				<div
					class="absolute -right-4 -bottom-4 text-indigo-600 opacity-[0.03] transition-opacity group-hover:opacity-10"
				>
					<Hourglass class="h-28 w-28" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						Hours This Week
					</div>
					<div class="mt-2 text-2xl font-bold tracking-tight text-indigo-600 sm:text-3xl">0</div>
					<p class="mt-2 text-xs font-medium text-text-muted">totally planned</p>
				</div>
			</div>
		</div>

		<SchedulesTabContent
			bind:selectedLocationId
			bind:selectedLocationDisplay
			bind:viewMode
			bind:weekOffset
			bind:monthOffset
			{loadLocationOptions}
			{visibleDateRange}
			{currentMonthDate}
			{schedulesError}
			{retrySchedulesFetch}
			locationsLoadError={data.locationsLoadError}
			{templates}
			{visibleDays}
			{getShifts}
			{deletingScheduleIds}
			onUnassignEmployee={handleUnassignEmployee}
			onOpenAssignSheet={openAssignSheet}
			{weekdaysShort}
			{shiftsByDate}
			{monthlyDays}
			{templateById}
			onOpenAutoGenerateModal={openAutoGenerateModal}
		/>
	{:else if activeTab === 'open-services'}
		<OpenServicesTabPage />
	{:else}
		<HoursTabPage />
	{/if}
</div>

<AssignEmployeesSheet
	bind:open={assignSheetOpen}
	date={assignSheetDate}
	locationName={selectedLocationDisplay}
	{templates}
	preselectedTemplateId={assignSheetTemplateId}
	{availableEmployees}
	{employeesLoading}
	{employeesLoadError}
	onRetryEmployees={retryEmployeeFetch}
	onSearchQueryChange={handleEmployeeSearchQueryChange}
	onAssign={handleAssign}
/>

<AutoGenerateScheduleModal
	bind:open={autoGenerateModalOpen}
	locationId={selectedLocationId}
	locationName={selectedLocationDisplay}
	week={getISOWeek(weekStart)}
	year={getISOWeekYear(weekStart)}
	weekStartDate={formatDateKey(weekStart)}
	onSaved={handleGeneratedScheduleSaved}
/>

<Toast
	message={toast?.message ?? null}
	type={toast?.type ?? 'success'}
	onClose={() => (toast = null)}
/>
