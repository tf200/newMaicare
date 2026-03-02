export const formatFormError = (value: unknown): string => {
	if (!value) return '';
	if (typeof value === 'string') return value;
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === 'string').join('\n');
	}
	if (typeof value === 'object') {
		const maybeErrors = (value as { _errors?: unknown })._errors;
		if (Array.isArray(maybeErrors)) {
			return maybeErrors.filter((item): item is string => typeof item === 'string').join('\n');
		}
	}
	return '';
};
