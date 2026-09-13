import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { formErrorSelector, getFormErrorNavigationOptions } from './form-navigation';

describe('form error navigation', () => {
	test('centers and focuses the first accessible invalid control', () => {
		const options = getFormErrorNavigationOptions(false);

		assert.equal(options.errorSelector, formErrorSelector);
		assert.deepEqual(options.scrollToError, {
			behavior: 'smooth',
			block: 'center',
			inline: 'nearest'
		});
		assert.equal(options.autoFocusOnError, 'detect');
	});

	test('uses instant scrolling when reduced motion is requested', () => {
		assert.equal(getFormErrorNavigationOptions(true).scrollToError.behavior, 'auto');
	});
});
