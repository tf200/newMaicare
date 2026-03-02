import * as v from 'valibot';

export const DiagnosisStatusSchema = v.picklist([
	'confirmed',
	'suspected',
	'resolved',
	'ruled_out'
]);
export const DiagnosisSeveritySchema = v.picklist(['unknown', 'mild', 'moderate', 'severe']);

export const DiagnosisSchema = v.pipe(
	v.object({
		code_system: v.pipe(v.string(), v.minLength(1, 'Code system is required.')),
		code: v.pipe(v.string(), v.minLength(1, 'Code is required.')),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		status: DiagnosisStatusSchema,
		severity: DiagnosisSeveritySchema,
		diagnosed_on: v.optional(v.string()),
		resolved_on: v.optional(v.string()),
		diagnosing_clinician: v.optional(v.string()),
		notes: v.optional(v.string())
	}),
	v.forward(
		v.check((input) => {
			const isResolvedStatus = input.status === 'resolved' || input.status === 'ruled_out';
			if (isResolvedStatus && input.diagnosed_on && input.resolved_on) {
				return new Date(input.resolved_on) >= new Date(input.diagnosed_on);
			}
			return true;
		}, 'Resolved date cannot be before diagnosed date.'),
		['resolved_on']
	)
);

export type DiagnosisSchemaInput = v.InferInput<typeof DiagnosisSchema>;
export type DiagnosisInput = v.InferOutput<typeof DiagnosisSchema>;
