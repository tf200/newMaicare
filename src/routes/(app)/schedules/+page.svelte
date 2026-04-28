<script lang="ts">
	import type { PageData } from './$types';
	import {
		CalendarDays,
		Clock,
		Moon,
		ChevronLeft,
		ChevronRight,
		Loader2,
		Plus,
		Sparkles,
		X
	} from 'lucide-svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import AssignEmployeesSheet from '$lib/components/schedules/AssignEmployeesSheet.svelte';
	import AutoGenerateScheduleModal from '$lib/components/schedules/AutoGenerateScheduleModal.svelte';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import { getLocationSchedules, listLocations } from '$lib/api/locations';
	import { createSchedules, deleteSchedule } from '$lib/api/schedules';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
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
		'bg-secondary text-white dark:bg-secondary',
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

{#snippet locationOption(option: OrganizationLocation)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="text-xs text-text-muted">
			<span>{option.street} {option.house_number}, {option.city}</span>
		</div>
	</div>
{/snippet}

<div class="flex h-full flex-col bg-surface">
	<header
		class="sticky top-0 z-20 flex shrink-0 flex-col gap-4 border-b border-border/60 bg-surface/85 px-6 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="flex items-center gap-3">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
				<CalendarDays class="h-5 w-5" />
			</div>
			<div>
				<h1 class="text-lg font-bold tracking-tight text-text">{m.schedules_management()}</h1>
				<div class="mt-0.5 flex items-center gap-2 text-sm text-text-muted">
					<SearchSelect
						bind:value={selectedLocationId}
						bind:displayValue={selectedLocationDisplay}
						loadOptions={loadLocationOptions}
						labelFn={(location) => location.name}
						valueFn={(location) => location.id}
						item={locationOption}
						placeholder={m.select_location()}
						searchPlaceholder={m.search_locations()}
						compact
						className="w-[200px]"
					/>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<div
				class="bg-surface-subtle mr-2 flex items-center rounded-xl border border-border/70 p-1 shadow-sm"
			>
				<button
					class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {viewMode === 'weekly'
						? 'bg-surface text-text shadow-sm'
						: 'text-text-muted hover:text-text'}"
					onclick={() => (viewMode = 'weekly')}
				>
					{m.weekly()}
				</button>
				<button
					class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {viewMode ===
					'monthly'
						? 'bg-surface text-text shadow-sm'
						: 'text-text-muted hover:text-text'}"
					onclick={() => (viewMode = 'monthly')}
				>
					{m.monthly()}
				</button>
			</div>

			{#if viewMode === 'weekly'}
				<div class="flex items-center rounded-xl border border-border/70 bg-surface p-1 shadow-sm">
					<button
						type="button"
						class="hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text"
						onclick={() => (weekOffset -= 1)}
						aria-label={m.previous_week()}
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<span class="px-3 text-sm font-medium text-text">
						{visibleDateRange}
					</span>
					<button
						type="button"
						class="hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text"
						onclick={() => (weekOffset += 1)}
						aria-label={m.next_week()}
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
				<Button variant="ghost" class="rounded-xl" onclick={() => (weekOffset = 0)}
					>{m.this_week()}</Button
				>
				<Button
					class="rounded-xl"
					onclick={() => {
						autoGenerateModalOpen = true;
					}}
					disabled={!selectedLocationId}
				>
					<Sparkles class="h-4 w-4" />
					{m.auto_generate()}
				</Button>
			{:else}
				<div class="flex items-center rounded-xl border border-border/70 bg-surface p-1 shadow-sm">
					<button
						type="button"
						class="hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text"
						onclick={() => (monthOffset -= 1)}
						aria-label={m.previous_month()}
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<span class="min-w-[120px] px-3 text-center text-sm font-medium text-text">
						{currentMonthDate.toLocaleDateString(getLocale(), {
							month: 'long',
							year: 'numeric'
						})}
					</span>
					<button
						type="button"
						class="hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text"
						onclick={() => (monthOffset += 1)}
						aria-label={m.next_month()}
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
				<Button variant="ghost" class="rounded-xl" onclick={() => (monthOffset = 0)}
					>{m.this_month()}</Button
				>
			{/if}
		</div>
	</header>

	<div class="flex-1 overflow-auto p-6">
		{#if schedulesError}
			<div class="mb-4">
				<InlineErrorBanner
					title={m.unable_to_load_schedules()}
					message={schedulesError}
					onRetry={retrySchedulesFetch}
				/>
			</div>
		{/if}

		{#if data.locationsLoadError}
			<div class="mb-4">
				<InlineErrorBanner title={m.unable_to_load_locations()} message={data.locationsLoadError} />
			</div>
		{/if}

		{#if !selectedLocationId}
			<div class="rounded-3xl border border-border/70 bg-surface p-5 text-sm text-text-muted">
				{m.no_location_selected()}
			</div>
		{:else if viewMode === 'weekly'}
			<div class="min-w-[980px] overflow-hidden rounded-3xl border border-border/70 bg-surface">
				<div class="grid grid-cols-[220px_repeat(7,minmax(132px,1fr))]">
					<div
						class="bg-surface-subtle/80 flex items-end border-r border-b border-border/60 p-4 text-xs font-semibold tracking-wider text-text-muted uppercase"
					>
						{m.shift_template()}
					</div>

					{#each visibleDays as day (day.date)}
						<div
							class="border-r border-b border-border/60 p-3 text-center {day.isToday
								? 'bg-brand/5'
								: 'bg-surface-subtle/80'}"
						>
							<span class="text-[11px] font-semibold tracking-wider text-text-muted uppercase"
								>{day.dayName}</span
							>
							<div
								class="mt-1 text-2xl font-light {day.isToday
									? 'mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-medium text-brand'
									: 'text-text'}"
							>
								{day.dayNumber}
							</div>
						</div>
					{/each}

					{#if templates.length === 0}
						<div
							class="col-span-8 flex items-center justify-center border-r border-b border-border/60 bg-surface px-4 py-10 text-sm text-text-muted"
						>
							{m.no_shift_templates()}
						</div>
					{:else}
						{#each templates as template (template.id)}
							<div class="sticky left-0 z-10 border-r border-b border-border/60 bg-surface p-4">
								<div class="flex items-center gap-2">
									<div class="h-3.5 w-3.5 rounded-full {template.colorClass.split(' ')[0]}"></div>
									<span class="text-sm font-bold text-text">{template.name}</span>
								</div>
								<div class="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-subtle">
									<Clock class="h-3.5 w-3.5" />
									<span>{template.startTime} - {template.endTime}</span>
								</div>
								{#if template.isCrossMidnight}
									<div
										class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
									>
										<Moon class="h-3 w-3" />
										<span>{m.cross_midnight()}</span>
									</div>
								{/if}
							</div>

							{#each visibleDays as day (day.date)}
								{@const cellShifts = getShifts(template.id, day.date)}
								<div
									class="group/cell flex min-h-[124px] flex-col gap-2 border-r border-b border-border/60 p-2.5 {day.isToday
										? 'bg-brand/5'
										: 'bg-surface/80'}"
								>
									{#if cellShifts.length > 0}
										<div class="flex flex-col gap-2">
											{#each cellShifts as shift (shift.id)}
												{@const visibleEmployees = shift.employees.slice(0, 2)}
												{#each visibleEmployees as employee (employee.id)}
													<div class="group relative">
														<div
															class="flex w-full items-center justify-between gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold shadow-sm {template.colorClass}"
														>
															<span class="block min-w-0 flex-1 truncate text-left"
																>{employee.name}</span
															>
															{#if employee.scheduleId}
																<button
																	type="button"
																	class="flex items-center justify-center rounded-md p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10"
																	onclick={() => void handleUnassignEmployee(employee.scheduleId!)}
																	disabled={deletingScheduleIds.includes(employee.scheduleId)}
																	aria-label={m.remove_employee_from_shift({ name: employee.name })}
																>
																	{#if deletingScheduleIds.includes(employee.scheduleId)}
																		<Loader2 class="h-3.5 w-3.5 animate-spin" />
																	{:else}
																		<X class="h-3.5 w-3.5" />
																	{/if}
																</button>
															{/if}
														</div>
													</div>
												{/each}

												{#if shift.employees.length > 2}
													<Tooltip
														content={shift.employees
															.slice(2)
															.map((employee) => employee.name)
															.join(', ')}
														position="top"
													>
														<div
															class="inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-xs font-medium text-text-muted"
														>
															{m.more_count({ count: shift.employees.length - 2 })}
														</div>
													</Tooltip>
												{/if}
											{/each}
										</div>
										<button
											type="button"
											class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/40 py-1.5 text-[11px] font-medium text-text-muted/40 transition-all hover:!border-brand/30 hover:!bg-brand/5 hover:!text-brand"
											aria-label={m.add_employee_to_shift({
												name: template.name,
												date: day.date
											})}
											onclick={() => openAssignSheet(day.date, template.id)}
										>
											<Plus class="h-3.5 w-3.5" />
											<span class="opacity-0 transition-opacity group-hover/cell:opacity-100"
												>{m.add()}</span
											>
										</button>
									{:else}
										<button
											type="button"
											class="flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/30 text-text-muted/40 transition-all hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
											aria-label={m.add_employee_to_shift({
												name: template.name,
												date: day.date
											})}
											onclick={() => openAssignSheet(day.date, template.id)}
										>
											<Plus class="h-5 w-5" />
											<span
												class="text-[11px] font-medium opacity-0 transition-opacity group-hover/cell:opacity-100"
												>{m.add_employee()}</span
											>
										</button>
									{/if}
								</div>
							{/each}
						{/each}
					{/if}
				</div>
			</div>
		{:else}
			<div
				class="flex h-full min-h-[600px] min-w-[700px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-surface sm:h-auto"
			>
				<div class="bg-surface-subtle/80 hidden grid-cols-7 border-b border-border/60 sm:grid">
					{#each weekdaysShort as d (d)}
						<div
							class="p-3 text-center text-[11px] font-semibold tracking-wider text-text-muted uppercase"
						>
							{d}
						</div>
					{/each}
				</div>
				<div class="grid flex-1 grid-cols-1 sm:auto-rows-[minmax(130px,1fr)] sm:grid-cols-7">
					{#each monthlyDays as day (day.date)}
						{@const dayShifts = shiftsByDate.get(day.date) ?? []}
						<div
							class="group/day flex flex-col border-b border-border/60 p-3 sm:flex-col sm:border-r sm:p-2 {day.isCurrentMonth
								? 'bg-surface'
								: 'bg-surface-subtle/30 hidden sm:flex'} {day.isToday ? 'bg-brand/5' : ''}"
						>
							<div class="mb-3 flex items-center justify-between sm:mb-2">
								<div class="flex items-center gap-2">
									<span class="w-8 text-xs font-semibold text-text-muted uppercase sm:hidden"
										>{day.dayName}</span
									>
									<span
										class="text-sm font-medium {day.isToday
											? 'flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand'
											: day.isCurrentMonth
												? 'text-text'
												: 'text-text-muted/50'}"
									>
										{day.dayNumber}
									</span>
								</div>
								<button
									class="bg-surface-subtle rounded-md p-1.5 text-text-muted transition-opacity group-hover/day:opacity-100 hover:bg-brand/10 hover:text-brand sm:bg-transparent sm:p-1 sm:opacity-0"
									aria-label={m.add_shift_on_date({ date: day.date })}
									onclick={() => openAssignSheet(day.date, null)}
								>
									<Plus class="h-4 w-4" />
								</button>
							</div>

							<div class="flex flex-1 flex-col gap-1.5">
								{#each dayShifts.slice(0, 3) as shift (shift.id)}
									{@const template = templateById.get(shift.templateId)}
									{#if template}
										<Tooltip
											content={shift.employees.map((employee) => employee.name).join(', ')}
											position="top"
										>
											<div
												class="flex cursor-default items-center justify-between rounded-md px-1.5 py-1 text-[11px] font-medium shadow-sm {template.colorClass} hover:brightness-110"
											>
												<div class="mr-1 truncate">
													{template.name}
												</div>
												<div class="flex shrink-0 items-center gap-1">
													<span class="opacity-90">{shift.employees.length}</span>
													{#if template.isCrossMidnight}
														<Moon class="h-2.5 w-2.5 opacity-70" />
													{/if}
												</div>
											</div>
										</Tooltip>
									{/if}
								{/each}
								{#if dayShifts.length > 3}
									<div class="px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
										{m.more_count({ count: dayShifts.length - 3 })}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
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
