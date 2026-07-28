export const maskBsn = (value: string | number | null | undefined) => {
	if (value === null || value === undefined) return '—';
	const normalized = String(value).trim();
	if (!normalized) return '—';
	return `***.***.${normalized.slice(-3)}`;
};
