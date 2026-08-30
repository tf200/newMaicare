import { formatDateOnly } from '$lib/utils/date';

const toBrowserLocale = (locale: string) => (locale === 'nl' ? 'nl-NL' : 'en-GB');

export const formatOverviewDate = (
	dateString: string | undefined,
	locale: string,
	fallback: string
) => {
	if (!dateString) return fallback;
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
		return formatDateOnly(dateString, toBrowserLocale(locale), fallback);
	}

	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return fallback;
	return date.toLocaleDateString(toBrowserLocale(locale), {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
};
