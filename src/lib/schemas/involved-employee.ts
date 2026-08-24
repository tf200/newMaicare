import * as v from 'valibot';

export const createInvolvedEmployeeSchema = (messages: {
	employeeRequired: string;
	startDateRequired: string;
	roleRequired: string;
	dateFormat: string;
}) =>
	v.object({
		employee_id: v.pipe(v.string(), v.minLength(1, messages.employeeRequired)),
		start_date: v.pipe(
			v.string(),
			v.minLength(1, messages.startDateRequired),
			v.regex(/^\d{4}-\d{2}-\d{2}$/, messages.dateFormat)
		),
		role: v.pipe(v.string(), v.trim(), v.minLength(1, messages.roleRequired))
	});

export type InvolvedEmployeeFormInput = v.InferInput<
	ReturnType<typeof createInvolvedEmployeeSchema>
>;
