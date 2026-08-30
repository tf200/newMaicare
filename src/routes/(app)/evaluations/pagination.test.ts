import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { evaluationPageHref, readEvaluationPage } from './pagination';

describe('evaluation listing pagination', () => {
	test('reads each listing page independently', () => {
		const params = new URLSearchParams('upcoming_page=2&drafts_page=3&submitted_page=4');
		assert.equal(readEvaluationPage(params, 'upcoming_page'), 2);
		assert.equal(readEvaluationPage(params, 'drafts_page'), 3);
		assert.equal(readEvaluationPage(params, 'submitted_page'), 4);
	});

	test('normalizes invalid pages to the first page', () => {
		for (const value of ['0', '-1', '1.5', 'invalid']) {
			assert.equal(
				readEvaluationPage(new URLSearchParams(`drafts_page=${value}`), 'drafts_page'),
				1
			);
		}
	});

	test('changes only the requested listing page', () => {
		const url = new URL(
			'https://example.test/evaluations?upcoming_page=2&drafts_page=3&submitted_page=4'
		);
		assert.equal(
			evaluationPageHref(url, 'drafts_page', 5),
			'/evaluations?upcoming_page=2&drafts_page=5&submitted_page=4'
		);
	});

	test('removes first-page and obsolete shared-page state', () => {
		const url = new URL('https://example.test/evaluations?page=7&drafts_page=3');
		assert.equal(evaluationPageHref(url, 'drafts_page', 1), '/evaluations');
	});
});
