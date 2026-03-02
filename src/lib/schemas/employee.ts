import * as v from 'valibot';

export const EmployeeGenderSchema = v.picklist(['male', 'female', 'not_specified']);
export const EmployeeContractTypeSchema = v.picklist(['loondienst', 'ZZP', 'none']);

export const EmployeeSchema = v.object({
	// Personal
	first_name: v.pipe(v.string(), v.minLength(1, 'First name is required')),
	last_name: v.pipe(v.string(), v.minLength(1, 'Last name is required')),
	bsn: v.pipe(v.string(), v.minLength(1, 'BSN is required')),
	gender: EmployeeGenderSchema,
	date_of_birth: v.optional(v.string()),

	// Contact
	work_email_address: v.pipe(
		v.string(),
		v.minLength(1, 'Work email is required'),
		v.email('Invalid work email address')
	),
	private_email_address: v.optional(v.pipe(v.string(), v.email('Invalid private email address'))),
	work_phone_number: v.optional(v.string()),
	private_phone_number: v.optional(v.string()),
	home_telephone_number: v.optional(v.string()),

	// Address
	postal_code: v.pipe(v.string(), v.minLength(1, 'Postal code is required')),
	house_number: v.pipe(v.string(), v.minLength(1, 'House number is required')),
	house_number_addition: v.optional(v.string()),
	street: v.pipe(v.string(), v.minLength(1, 'Street is required')),
	city: v.pipe(v.string(), v.minLength(1, 'City is required')),

	// Employment
	employee_number: v.optional(v.string()),
	employment_number: v.optional(v.string()),
	role_id: v.pipe(v.string(), v.minLength(1, 'Role is required')),
	location_id: v.optional(v.string()),
	position: v.optional(v.string()),
	department: v.optional(v.string()),

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
