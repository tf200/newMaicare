import * as v from 'valibot';
import { m } from '$lib/paraglide/messages';

export const EmployeeGenderSchema = v.picklist(['male', 'female', 'not_specified']);
export const EmployeeContractTypeSchema = v.picklist(['loondienst', 'ZZP', 'none']);

export const EmployeeSchema = v.object({
	// Personal
	first_name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.required_field())
	),
	last_name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.required_field())
	),
	bsn: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.required_field())
	),
	gender: EmployeeGenderSchema,
	date_of_birth: v.optional(v.string()),

	// Contact
	work_email_address: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.required_field()),
		v.email(() => m.invalid_email())
	),
	private_email_address: v.optional(
		v.union([
			v.literal(''),
			v.pipe(
				v.string(),
				v.email(() => m.invalid_email())
			)
		])
	),
	work_phone_number: v.optional(v.string()),
	private_phone_number: v.optional(v.string()),
	home_telephone_number: v.optional(v.string()),

	// Address
	postal_code: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.required_field())
	),
	house_number: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.required_field())
	),
	house_number_addition: v.optional(v.string()),
	street: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.required_field())
	),
	city: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.required_field())
	),

	// Employment
	employee_number: v.optional(v.string()),
	role_id: v.pipe(
		v.string(),
		v.minLength(1, () => m.required_field())
	),
	location_id: v.optional(v.string()),
	position: v.optional(v.string()),
	department_id: v.optional(v.string()),

	// Contract
	contract_type: EmployeeContractTypeSchema,
	contract_hours: v.optional(
		v.pipe(
			v.union([v.number(), v.string()]),
			v.transform((val) => {
				if (typeof val === 'number') return val;
				if (!val) return undefined;
				return Number.parseFloat(val);
			})
		)
	),
	contract_rate: v.optional(
		v.pipe(
			v.union([v.number(), v.string()]),
			v.transform((val) => {
				if (typeof val === 'number') return val;
				if (!val) return undefined;
				return Number.parseFloat(val);
			})
		)
	),
	contract_start_date: v.optional(v.string()),
	contract_end_date: v.optional(v.string())
});

export type EmployeeSchemaInput = v.InferInput<typeof EmployeeSchema>;
export type EmployeeInput = v.InferOutput<typeof EmployeeSchema>;

export const UpdateEmployeeSchema = v.object({
	first_name: v.pipe(v.string(), v.minLength(1, 'First name is required')),
	last_name: v.pipe(v.string(), v.minLength(1, 'Last name is required')),
	position: v.optional(v.string()),
	department_id: v.optional(v.string()),
	manager_employee_id: v.optional(v.string()),
	employee_number: v.optional(v.string()),
	private_email_address: v.optional(v.pipe(v.string(), v.email('Invalid private email address'))),
	private_phone_number: v.optional(v.string()),
	work_phone_number: v.optional(v.string()),
	date_of_birth: v.optional(v.string()),
	home_telephone_number: v.optional(v.string()),
	gender: v.picklist(['male', 'female', 'other', 'unknown']),
	location_id: v.optional(v.string()),
	has_borrowed: v.boolean(),
	out_of_service: v.boolean(),
	is_archived: v.boolean()
});

export type UpdateEmployeeSchemaInput = v.InferInput<typeof UpdateEmployeeSchema>;
