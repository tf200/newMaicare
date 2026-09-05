import * as v from 'valibot';

export const createClientCoordinatorSchema = (messages: {
	employeeRequired: string;
	dateFormat: string;
}) =>
	v.object({
		employee_id: v.pipe(v.string(), v.uuid(messages.employeeRequired)),
		start_date: v.pipe(v.string(), v.isoDate(messages.dateFormat))
	});
