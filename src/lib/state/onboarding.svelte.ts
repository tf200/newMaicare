const ONBOARDING_PREFIX = 'maicare_onboarding_';

export interface OnboardingState {
	welcomeCompleted: boolean;
	seenTooltips: Record<string, boolean>;
	completedSteps: Record<string, boolean>;
}

function readKey(key: string): boolean {
	if (typeof localStorage === 'undefined') return false;
	return localStorage.getItem(`${ONBOARDING_PREFIX}${key}`) === 'true';
}

function writeKey(key: string, value: boolean) {
	if (typeof localStorage === 'undefined') return;
	if (value) {
		localStorage.setItem(`${ONBOARDING_PREFIX}${key}`, 'true');
	} else {
		localStorage.removeItem(`${ONBOARDING_PREFIX}${key}`);
	}
}

export const onboarding = {
	get welcomeCompleted() {
		return readKey('welcome_completed');
	},

	markWelcomeCompleted() {
		writeKey('welcome_completed', true);
	},

	resetWelcome() {
		writeKey('welcome_completed', false);
	},

	hasSeenTooltip(id: string): boolean {
		return readKey(`tooltip_${id}`);
	},

	markTooltipSeen(id: string) {
		writeKey(`tooltip_${id}`, true);
	},

	resetTooltip(id: string) {
		writeKey(`tooltip_${id}`, false);
	},

	isStepCompleted(step: string): boolean {
		return readKey(`step_${step}`);
	},

	markStepCompleted(step: string) {
		writeKey(`step_${step}`, true);
	},

	resetAll() {
		if (typeof localStorage === 'undefined') return;
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(ONBOARDING_PREFIX)) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach((key) => localStorage.removeItem(key));
	}
};
