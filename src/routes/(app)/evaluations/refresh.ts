import type { GoalEvaluationResponse } from '$lib/types/api';

export const evaluationDependenciesAfterSave = (
	status: GoalEvaluationResponse['status']
): string[] => {
	const dependencies = [
		'app:evaluations:upcoming',
		'app:evaluations:drafts',
		'app:evaluations:stats'
	];
	if (status !== 'draft') dependencies.push('app:evaluations:submitted');
	return dependencies;
};
