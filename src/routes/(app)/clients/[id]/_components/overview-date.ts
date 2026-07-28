const toBrowserLocale = (locale: string) => (locale === 'nl' ? 'nl-NL' : 'en-GB');

export const formatOverviewDate = (
	dateString: string | undefined,
	locale: string,
	fallback: string
) => {
	if (!dateString) return fallback;
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return fallback;

	return date.toLocaleDateString(toBrowserLocale(locale), {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
};
