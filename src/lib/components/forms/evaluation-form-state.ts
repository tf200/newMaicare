import type { EvaluationInput } from '$lib/schemas/evaluation';
import type { GoalEvaluationResponse } from '$lib/types/api';

type EvaluationFormItem = EvaluationInput['items'][number];

const normalizeItem = (item: EvaluationFormItem): EvaluationFormItem => ({
	goal_id: item.goal_id,
	progress: item.progress,
	notes: item.notes ?? ''
});

export const evaluationFormData = (
	evaluation: GoalEvaluationResponse,
	preferredItems: EvaluationFormItem[] = []
): EvaluationInput => {
	const savedItems = new Map(
		evaluation.items.map((item) => [
			item.goal_id,
			{
				goal_id: item.goal_id,
				progress: item.progress,
				notes: item.notes ?? ''
			} satisfies EvaluationFormItem
		])
	);
	const items = preferredItems.map((item) => savedItems.get(item.goal_id) ?? normalizeItem(item));
	const preferredGoalIds = new Set(preferredItems.map((item) => item.goal_id));

	for (const item of savedItems.values()) {
		if (!preferredGoalIds.has(item.goal_id)) items.push(item);
	}

	return {
		overall_notes: evaluation.overall_notes ?? '',
		submit: false,
		items
	};
};

export const evaluationFormSnapshot = (data: EvaluationInput): string =>
	JSON.stringify({
		overall_notes: data.overall_notes ?? '',
		items: data.items
			.map(normalizeItem)
			.sort((left, right) => left.goal_id.localeCompare(right.goal_id))
	});
