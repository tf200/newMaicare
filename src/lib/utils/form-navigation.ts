export const formErrorSelector = '[aria-invalid="true"],[data-invalid]';

export function getFormErrorNavigationOptions(reducedMotion?: boolean) {
	const shouldReduceMotion =
		reducedMotion ??
		(typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches);

	return {
		errorSelector: formErrorSelector,
		scrollToError: {
			behavior: shouldReduceMotion ? ('auto' as const) : ('smooth' as const),
			block: 'center' as const,
			inline: 'nearest' as const
		},
		autoFocusOnError: 'detect' as const
	};
}
