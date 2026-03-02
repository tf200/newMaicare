import * as v from 'valibot';

export const EvaluationProgressSchema = v.picklist([
	'no_progress',
	'regression',
	'limited_progress',
	'good_progress',
	'achieved',
	'blocked'
]);

export const EvaluationItemSchema = v.object({
	goal_id: v.pipe(v.string(), v.minLength(1)),
	progress: EvaluationProgressSchema,
	notes: v.optional(v.string())
});

export const EvaluationSchema = v.object({
	overall_notes: v.optional(v.string()),
	submit: v.boolean(),
	items: v.array(EvaluationItemSchema)
});

export type EvaluationSchemaInput = v.InferInput<typeof EvaluationSchema>;
export type EvaluationInput = v.InferOutput<typeof EvaluationSchema>;
export type EvaluationItemInput = v.InferOutput<typeof EvaluationItemSchema>;
