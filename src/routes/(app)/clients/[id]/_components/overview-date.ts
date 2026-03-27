const toBrowserLocale = (locale: string) => (locale === 'nl' ? 'nl-NL' : 'en-GB');

export const formatOverviewDate = (
	dateString: string | undefined,
	locale: string,
	fallback: string
) => {
	if (!dateString) return fallback;
	return new Date(dateString).toLocaleDateString(toBrowserLocale(locale), {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
};
