import * as v from 'valibot';

export interface IntakeValidationMessages {
	required: string;
	participantsRequired: string;
	integer: string;
	selfSufficiencyRange: string;
	evaluationIntervalRange: string;
	levelRange: string;
}

const requiredString = (message: string) => v.pipe(v.string(), v.trim(), v.nonEmpty(message));

export const createIntakeSchema = (messages: IntakeValidationMessages) =>
	v.object({
		date_of_intake: requiredString(messages.required),
		care_type: v.picklist([
			'protected_living',
			'training_center',
			'supported_independent_living',
			'ambulatory_support',
			'other'
		]),
		intake_participants: v.pipe(
			v.array(v.picklist(['client', 'referrer', 'parents/guardians', 'care_coordinator', 'other'])),
			v.minLength(1, messages.participantsRequired)
		),
		family_situation: requiredString(messages.required),
		psychological_state: requiredString(messages.required),
		self_sufficiency: v.pipe(
			v.number(),
			v.finite(messages.selfSufficiencyRange),
			v.integer(messages.integer),
			v.minValue(0, messages.selfSufficiencyRange),
			v.maxValue(100, messages.selfSufficiencyRange)
		),
		evaluation_interval_weeks: v.pipe(
			v.number(),
			v.finite(messages.evaluationIntervalRange),
			v.integer(messages.integer),
			v.minValue(1, messages.evaluationIntervalRange)
		),
		sender_id: requiredString(messages.required),
		assigned_location_id: requiredString(messages.required),
		risk_assessment: requiredString(messages.required),
		intake_conclusion: v.picklist([
			'suitable',
			'unsuitable',
			'further_investigation',
			'possible_palcement_date',
			'other'
		]),
		intake_conclusion_notes: v.pipe(v.string(), v.trim()),
		signature: requiredString(messages.required)
	});

export const createGoalAssessmentSchema = (messages: IntakeValidationMessages) =>
	v.object({
		current_level: v.pipe(
			v.number(),
			v.finite(messages.levelRange),
			v.integer(messages.integer),
			v.minValue(1, messages.levelRange)
		),
		proposed_goals: v.array(
			v.object({
				title: requiredString(messages.required),
				description: requiredString(messages.required),
				priority: v.picklist(['high', 'medium', 'low'])
			})
		),
		notes: v.nullable(v.string())
	});

export type IntakeSchemaInput = v.InferInput<ReturnType<typeof createIntakeSchema>>;
