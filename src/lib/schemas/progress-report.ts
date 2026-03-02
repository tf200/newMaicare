import * as v from 'valibot';

export const ProgressReportTypeSchema = v.picklist([
	'morning_report',
	'evening_report',
	'night_report',
	'shift_report',
	'one_to_one_report',
	'process_report',
	'contact_journal',
	'other'
]);

export const EmotionalStateSchema = v.picklist([
	'normal',
	'excited',
	'happy',
	'sad',
	'angry',
	'anxious',
	'depressed'
]);

const isRichTextEmpty = (html: string) => {
	if (!html) return true;
	// Simple server-side compatible check for empty tags or spaces
	const text = html
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/\u200b/g, '')
		.trim();
	return text.length === 0;
};

export const ProgressReportSchema = v.object({
	employee_id: v.optional(v.string()),
	title: v.optional(v.string()),
	date: v.pipe(v.string(), v.minLength(1, 'Date is required')),
	report_text: v.pipe(
		v.string(),
		v.check((val) => !isRichTextEmpty(val), 'Report text is required')
	),
	type: ProgressReportTypeSchema,
	emotional_state: EmotionalStateSchema
});

export type ProgressReportSchemaInput = v.InferInput<typeof ProgressReportSchema>;
export type ProgressReportInput = v.InferOutput<typeof ProgressReportSchema>;
