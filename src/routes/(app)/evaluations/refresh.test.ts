import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { evaluationDependenciesAfterSave } from './refresh';

describe('evaluation refresh dependencies', () => {
	test('refreshes draft-related sections after saving a draft', () => {
		assert.deepEqual(evaluationDependenciesAfterSave('draft'), [
			'app:evaluations:upcoming',
			'app:evaluations:drafts',
			'app:evaluations:stats'
		]);
	});

	test('also refreshes submitted evaluations after submission', () => {
		assert.deepEqual(evaluationDependenciesAfterSave('completed'), [
			'app:evaluations:upcoming',
			'app:evaluations:drafts',
			'app:evaluations:stats',
			'app:evaluations:submitted'
		]);
	});
});
