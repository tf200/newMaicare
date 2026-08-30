import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { EvaluationInput } from '$lib/schemas/evaluation';
import type { GoalEvaluationResponse } from '$lib/types/api';
import { evaluationFormData, evaluationFormSnapshot } from './evaluation-form-state';

const savedEvaluation = (items: GoalEvaluationResponse['items']): GoalEvaluationResponse => ({
	id: 'evaluation-1',
	client_id: 'client-1',
	evaluation_date: '2026-08-30',
	period_start: null,
	period_end: null,
	evaluation_interval_weeks: 12,
	status: 'draft',
	overall_notes: null,
	created_by_employee_id: 'employee-1',
	creator_name: 'Evaluator',
	created_at: '2026-08-30T08:00:00Z',
	updated_at: '2026-08-30T09:00:00Z',
	items
});

const savedItem = (
	goalId: string,
	progress: GoalEvaluationResponse['items'][number]['progress'],
	notes: string | null = null
): GoalEvaluationResponse['items'][number] => ({
	id: `item-${goalId}`,
	evaluation_id: 'evaluation-1',
	goal_id: goalId,
	goal_title: `Goal ${goalId}`,
	goal_description: null,
	topic_name_snapshot: null,
	progress,
	notes,
	created_at: '2026-08-30T08:00:00Z',
	updated_at: '2026-08-30T09:00:00Z'
});

describe('evaluation form state', () => {
	test('keeps preferred goal order while accepting saved values by goal ID', () => {
		const preferred: EvaluationInput['items'] = [
			{ goal_id: 'goal-a', progress: 'no_progress', notes: '' },
			{ goal_id: 'goal-b', progress: 'no_progress', notes: '' }
		];
		const result = evaluationFormData(
			savedEvaluation([
				savedItem('goal-b', 'achieved', 'Second'),
				savedItem('goal-a', 'good_progress', 'First')
			]),
			preferred
		);

		assert.deepEqual(result.items, [
			{ goal_id: 'goal-a', progress: 'good_progress', notes: 'First' },
			{ goal_id: 'goal-b', progress: 'achieved', notes: 'Second' }
		]);
	});

	test('preserves preferred goals missing from a partial response', () => {
		const preferred: EvaluationInput['items'] = [
			{ goal_id: 'goal-a', progress: 'limited_progress', notes: 'Local value' },
			{ goal_id: 'goal-b', progress: 'not_evaluated', notes: '' }
		];

		assert.deepEqual(
			evaluationFormData(savedEvaluation([savedItem('goal-b', 'blocked')]), preferred).items,
			[
				{ goal_id: 'goal-a', progress: 'limited_progress', notes: 'Local value' },
				{ goal_id: 'goal-b', progress: 'blocked', notes: '' }
			]
		);
	});

	test('keeps unanswered goals distinct from an explicit no-progress assessment', () => {
		const preferred: EvaluationInput['items'] = [
			{ goal_id: 'goal-a', progress: 'not_evaluated', notes: '' },
			{ goal_id: 'goal-b', progress: 'not_evaluated', notes: '' }
		];

		assert.deepEqual(
			evaluationFormData(savedEvaluation([savedItem('goal-a', 'no_progress')]), preferred).items,
			[
				{ goal_id: 'goal-a', progress: 'no_progress', notes: '' },
				{ goal_id: 'goal-b', progress: 'not_evaluated', notes: '' }
			]
		);
	});

	test('dirty snapshots ignore submission state and item ordering', () => {
		const initial: EvaluationInput = {
			overall_notes: '',
			submit: false,
			items: [
				{ goal_id: 'goal-a', progress: 'good_progress', notes: '' },
				{ goal_id: 'goal-b', progress: 'blocked', notes: 'Reason' }
			]
		};
		const reordered: EvaluationInput = {
			...initial,
			submit: true,
			items: initial.items.slice().reverse()
		};

		assert.equal(evaluationFormSnapshot(initial), evaluationFormSnapshot(reordered));
	});

	test('dirty snapshots change after a user-editable value changes', () => {
		const initial: EvaluationInput = {
			overall_notes: '',
			submit: false,
			items: [{ goal_id: 'goal-a', progress: 'no_progress', notes: '' }]
		};

		assert.notEqual(
			evaluationFormSnapshot(initial),
			evaluationFormSnapshot({ ...initial, overall_notes: 'Changed' })
		);
	});
});
