import { getContext, setContext } from 'svelte';

const THEME_KEY = Symbol('THEME');
const STORAGE_KEY = 'theme';

export type ThemePreference = 'light' | 'dark' | 'system';

const isThemePreference = (value: string | null): value is ThemePreference =>
	value === 'light' || value === 'dark' || value === 'system';

export class ThemeState {
	preference = $state<ThemePreference>('system');
	systemPrefersDark = $state(false);
	isDark = $derived(
		this.preference === 'dark' || (this.preference === 'system' && this.systemPrefersDark)
	);

	constructor() {
		if (typeof window === 'undefined') return;

		const storedTheme = window.localStorage.getItem(STORAGE_KEY);
		if (isThemePreference(storedTheme)) {
			this.preference = storedTheme;
		}

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		this.systemPrefersDark = mediaQuery.matches;
		this.apply();

		mediaQuery.addEventListener('change', (event) => {
			this.systemPrefersDark = event.matches;
			if (this.preference === 'system') this.apply();
		});

		window.addEventListener('storage', (event) => {
			if (event.key !== STORAGE_KEY || !isThemePreference(event.newValue)) return;
			this.preference = event.newValue;
			this.apply();
		});
	}

	setPreference = (preference: ThemePreference) => {
		this.preference = preference;
		window.localStorage.setItem(STORAGE_KEY, preference);
		this.apply();
	};

	toggle = () => {
		this.setPreference(this.isDark ? 'light' : 'dark');
	};

	private apply() {
		if (typeof document === 'undefined') return;

		const root = document.documentElement;
		root.classList.toggle('dark', this.isDark);
		root.style.colorScheme = this.isDark ? 'dark' : 'light';
	}
}

export function setThemeState(): ThemeState {
	const theme = new ThemeState();
	setContext(THEME_KEY, theme);
	return theme;
}

export function getThemeState(): ThemeState {
	return getContext<ThemeState>(THEME_KEY);
}
