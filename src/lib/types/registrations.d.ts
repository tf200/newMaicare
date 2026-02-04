export interface RegistrationFilters {
	status: '' | 'pending' | 'processed';
	search: string | undefined;
	riskAggressiveBehavior?: boolean;
	riskSuicidalSelfharm?: boolean;
	riskSubstanceAbuse?: boolean;
	riskPsychiatricIssues?: boolean;
	riskCriminalHistory?: boolean;
	riskFlightBehavior?: boolean;
	riskWeaponPossession?: boolean;
	riskSexualBehavior?: boolean;
	riskDayNightRhythm?: boolean;
}
