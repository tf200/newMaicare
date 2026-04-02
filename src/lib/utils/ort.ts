import { parseISO, getDay } from 'date-fns';
import type { OrtBreakdown, OrtAmounts } from '$lib/types/api/salary';

export const ORT_PERCENTAGES = {
	earlyMorning: 0.25,
	evening: 0.25,
	night: 0.45,
	saturdayDay: 0.3,
	sundayHoliday: 0.45
} as const;

const FIXED_HOLIDAYS_2025 = [
	'01-01', // Nieuwjaarsdag
	'04-27', // Koningsdag
	'05-05', // Bevrijdingsdag
	'12-25', // Eerste Kerstdag
	'12-26' // Tweede Kerstdag
];

const VARIABLE_HOLIDAYS_2025 = [
	'04-18', // Goede Vrijdag
	'04-20', // Eerste Paasdag
	'04-21', // Tweede Paasdag
	'05-29', // Hemelvaartsdag
	'06-08', // Eerste Pinksterdag
	'06-09' // Tweede Pinksterdag
];

function isNationalHoliday(date: Date): boolean {
	const year = date.getFullYear();
	const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

	if (year === 2025) {
		return [...FIXED_HOLIDAYS_2025, ...VARIABLE_HOLIDAYS_2025].includes(mmdd);
	}

	return FIXED_HOLIDAYS_2025.includes(mmdd);
}

function timeToMinutes(time: string): number {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
}

function calculateOverlapHours(
	shiftStart: number,
	shiftEnd: number,
	rangeStart: number,
	rangeEnd: number,
	isOvernightRange: boolean = false
): number {
	if (shiftEnd <= shiftStart) {
		const beforeMidnight = calculateOverlapHours(
			shiftStart,
			24 * 60,
			rangeStart,
			rangeEnd,
			isOvernightRange
		);
		const afterMidnight = calculateOverlapHours(
			0,
			shiftEnd,
			rangeStart,
			rangeEnd,
			isOvernightRange
		);
		return beforeMidnight + afterMidnight;
	}

	if (isOvernightRange && rangeEnd < rangeStart) {
		const beforeMidnight = calculateOverlapHours(shiftStart, shiftEnd, rangeStart, 24 * 60, false);
		const afterMidnight = calculateOverlapHours(shiftStart, shiftEnd, 0, rangeEnd, false);
		return beforeMidnight + afterMidnight;
	}

	const overlapStart = Math.max(shiftStart, rangeStart);
	const overlapEnd = Math.min(shiftEnd, rangeEnd);

	if (overlapEnd <= overlapStart) return 0;

	return (overlapEnd - overlapStart) / 60;
}

export function calculateShiftOrtHours(
	shiftDate: string,
	startTime: string | null,
	endTime: string | null,
	totalShiftHours: number
): OrtBreakdown {
	const date = parseISO(shiftDate);
	const dayOfWeek = getDay(date);
	const isSunday = dayOfWeek === 0;
	const isSaturday = dayOfWeek === 6;
	const isHoliday = isNationalHoliday(date);
	const isWeekday = !isSunday && !isSaturday;

	const breakdown: OrtBreakdown = {
		earlyMorningHours: 0,
		eveningHours: 0,
		nightHours: 0,
		saturdayDayHours: 0,
		sundayHolidayHours: 0,
		totalOrtHours: 0
	};

	if (isSunday || isHoliday) {
		breakdown.sundayHolidayHours = totalShiftHours;
		breakdown.totalOrtHours = totalShiftHours;
		return breakdown;
	}

	if (!startTime || !endTime) {
		if (isSaturday) {
			breakdown.saturdayDayHours = totalShiftHours;
			breakdown.totalOrtHours = totalShiftHours;
		}
		return breakdown;
	}

	const shiftStartMinutes = timeToMinutes(startTime);
	const shiftEndMinutes = timeToMinutes(endTime);

	if (isSaturday) {
		const dayHours = calculateOverlapHours(shiftStartMinutes, shiftEndMinutes, 6 * 60, 22 * 60);
		const nightHours = calculateOverlapHours(
			shiftStartMinutes,
			shiftEndMinutes,
			22 * 60,
			6 * 60,
			true
		);
		breakdown.saturdayDayHours = dayHours;
		breakdown.nightHours = nightHours;
		breakdown.totalOrtHours = dayHours + nightHours;
		return breakdown;
	}

	if (isWeekday) {
		const earlyMorningHours = calculateOverlapHours(
			shiftStartMinutes,
			shiftEndMinutes,
			6 * 60,
			7 * 60
		);
		const eveningHours = calculateOverlapHours(
			shiftStartMinutes,
			shiftEndMinutes,
			19 * 60,
			22 * 60
		);
		const nightHours = calculateOverlapHours(
			shiftStartMinutes,
			shiftEndMinutes,
			22 * 60,
			6 * 60,
			true
		);

		breakdown.earlyMorningHours = earlyMorningHours;
		breakdown.eveningHours = eveningHours;
		breakdown.nightHours = nightHours;
		breakdown.totalOrtHours = earlyMorningHours + eveningHours + nightHours;
	}

	return breakdown;
}

export function calculateOrtAmounts(breakdown: OrtBreakdown, hourlyRate: number): OrtAmounts {
	return {
		earlyMorningOrt: breakdown.earlyMorningHours * hourlyRate * ORT_PERCENTAGES.earlyMorning,
		eveningOrt: breakdown.eveningHours * hourlyRate * ORT_PERCENTAGES.evening,
		nightOrt: breakdown.nightHours * hourlyRate * ORT_PERCENTAGES.night,
		saturdayDayOrt: breakdown.saturdayDayHours * hourlyRate * ORT_PERCENTAGES.saturdayDay,
		sundayHolidayOrt: breakdown.sundayHolidayHours * hourlyRate * ORT_PERCENTAGES.sundayHoliday,
		totalOrt:
			breakdown.earlyMorningHours * hourlyRate * ORT_PERCENTAGES.earlyMorning +
			breakdown.eveningHours * hourlyRate * ORT_PERCENTAGES.evening +
			breakdown.nightHours * hourlyRate * ORT_PERCENTAGES.night +
			breakdown.saturdayDayHours * hourlyRate * ORT_PERCENTAGES.saturdayDay +
			breakdown.sundayHolidayHours * hourlyRate * ORT_PERCENTAGES.sundayHoliday
	};
}

export function combineOrtBreakdowns(breakdowns: OrtBreakdown[]): OrtBreakdown {
	return breakdowns.reduce(
		(acc, b) => ({
			earlyMorningHours: acc.earlyMorningHours + b.earlyMorningHours,
			eveningHours: acc.eveningHours + b.eveningHours,
			nightHours: acc.nightHours + b.nightHours,
			saturdayDayHours: acc.saturdayDayHours + b.saturdayDayHours,
			sundayHolidayHours: acc.sundayHolidayHours + b.sundayHolidayHours,
			totalOrtHours: acc.totalOrtHours + b.totalOrtHours
		}),
		{
			earlyMorningHours: 0,
			eveningHours: 0,
			nightHours: 0,
			saturdayDayHours: 0,
			sundayHolidayHours: 0,
			totalOrtHours: 0
		}
	);
}
