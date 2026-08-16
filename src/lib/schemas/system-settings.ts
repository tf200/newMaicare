import * as v from 'valibot';

export interface OrganizationSettingsValidationMessages {
	required: string;
	invalidEmail: string;
	invalidWebsite: string;
}

export function createOrganizationSettingsSchema(messages: OrganizationSettingsValidationMessages) {
	return v.object({
		name: v.pipe(v.string(), v.trim(), v.minLength(1, messages.required)),
		timezone: v.pipe(v.string(), v.minLength(1, messages.required)),
		address: v.object({
			street: v.pipe(v.string(), v.trim(), v.minLength(1, messages.required)),
			houseNumber: v.pipe(v.string(), v.trim(), v.minLength(1, messages.required)),
			houseNumberAddition: v.pipe(v.string(), v.trim()),
			postalCode: v.pipe(v.string(), v.trim(), v.minLength(1, messages.required)),
			city: v.pipe(v.string(), v.trim(), v.minLength(1, messages.required))
		}),
		contact: v.object({
			email: v.pipe(v.string(), v.trim(), v.email(messages.invalidEmail)),
			phone: v.pipe(v.string(), v.trim(), v.minLength(1, messages.required)),
			website: v.pipe(v.string(), v.trim(), v.url(messages.invalidWebsite))
		})
	});
}

export interface RoleValidationMessages {
	nameRequired: string;
	nameTooLong: string;
	descriptionTooLong: string;
}

export function createRoleSchema(messages: RoleValidationMessages) {
	return v.object({
		name: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, messages.nameRequired),
			v.maxLength(100, messages.nameTooLong)
		),
		description: v.pipe(v.string(), v.trim(), v.maxLength(500, messages.descriptionTooLong))
	});
}

export function createDepartmentSchema(required: string) {
	return v.object({
		name: v.pipe(v.string(), v.trim(), v.minLength(1, required)),
		description: v.pipe(v.string(), v.trim()),
		departmentHeadId: v.string()
	});
}

export type DepartmentSettingsInput = v.InferInput<ReturnType<typeof createDepartmentSchema>>;
