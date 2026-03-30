export type SelectSize = 'sm' | 'md' | 'lg';

export const selectSizeClasses: Record<SelectSize, string> = {
	sm: 'h-10 py-0 px-3 text-xs',
	md: 'py-2.5 px-4 text-sm',
	lg: 'py-3.5 px-4 text-sm'
};
