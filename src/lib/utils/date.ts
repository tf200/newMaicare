/**
 * Shared date formatting utilities.
 *
 * All functions accept a nullable date string and return a formatted string
 * or a placeholder when the value is null/undefined.
 */

/** Short date: "12 Mar 2026" */
export const formatDate = (dateStr: string | null | undefined, placeholder = '—'): string => {
	if (!dateStr) return placeholder;
	return new Date(dateStr).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
};

/** Date + time: "12 Mar 2026, 14:30" */
export const formatDateTime = (dateStr: string | null | undefined, placeholder = '—'): string => {
	if (!dateStr) return placeholder;
	return new Date(dateStr).toLocaleString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
};

/** Relative time: "2 days ago", "in 3 hours", "just now" */
export const formatRelativeTime = (dateStr: string): string => {
	const diffMs = new Date(dateStr).getTime() - Date.now();
	const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
		['day', 1000 * 60 * 60 * 24],
		['hour', 1000 * 60 * 60],
		['minute', 1000 * 60],
		['second', 1000]
	];

	for (const [unit, unitMs] of units) {
		if (Math.abs(diffMs) >= unitMs || unit === 'second') {
			return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
				Math.round(diffMs / unitMs),
				unit
			);
		}
	}

	return 'just now';
};
