import type {
	CreateLeaveFormState,
	DateRangeRequestFormState,
	LateArrivalFormState
} from './form-types';

export function createEmptyCreateLeaveForm(): CreateLeaveFormState {
	return {
		employeeId: '',
		type: 'vacation',
		startDate: '',
		endDate: '',
		reason: ''
	};
}

export function createEmptyDateRangeRequestForm(): DateRangeRequestFormState {
	return {
		employeeId: '',
		startDate: '',
		endDate: '',
		reason: ''
	};
}

export function createEmptyLateArrivalForm(): LateArrivalFormState {
	return {
		employeeId: '',
		date: '',
		time: '',
		reason: ''
	};
}

export function formatDate(dateText: string) {
	return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(
		new Date(dateText)
	);
}

export function calculateDays(startDate: string, endDate: string) {
	if (!startDate || !endDate) return 0;
	const start = new Date(startDate);
	const end = new Date(endDate);
	const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
	return diff > 0 ? diff : 0;
}

export function isValidDateYmd(value: string) {
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

export function normalizeReason(value: string) {
	const trimmed = value.trim();
	return trimmed ? trimmed : undefined;
}

export function getValidatedDateRangeFormData(form: {
	employeeId: string;
	startDate: string;
	endDate: string;
	reason: string;
}) {
	const days = calculateDays(form.startDate, form.endDate);

	if (
		!form.employeeId ||
		days === 0 ||
		!isValidDateYmd(form.startDate) ||
		!isValidDateYmd(form.endDate)
	) {
		return null;
	}

	return {
		days,
		reason: normalizeReason(form.reason)
	};
}
