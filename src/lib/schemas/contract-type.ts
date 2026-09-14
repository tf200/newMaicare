import * as v from 'valibot';
import { m } from '$lib/paraglide/messages';

export const ContractTypeSchema = v.object({
	name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, () => m.contract_type_name_required()),
		v.maxLength(100, () => m.contract_type_name_too_long())
	)
});

export type ContractTypeInput = v.InferInput<typeof ContractTypeSchema>;
