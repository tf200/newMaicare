import { intakes } from '$lib/api/intakes';
import type { PageLoad } from './$types';
import { m } from '$lib/paraglide/messages';
import type { GetIntakeFormResponse } from '$lib/types/api';

export interface IntakeDetailLoadResult {
	intake: GetIntakeFormResponse | null;
	loadError: string | null;
}

export const load: PageLoad = ({ depends, params }) => {
	depends('app:intakes:detail');

	const intakeData: Promise<IntakeDetailLoadResult> = intakes
		.getById(params.id)
		.then((response) => ({
			intake: response.data,
			loadError: null
		}))
		.catch((error): IntakeDetailLoadResult => ({
			intake: null,
			loadError: error instanceof Error ? error.message : m.failed_load_intake_detail()
		}));

	return {
		initial: {
			id: params.id
		},
		intakeData
	};
};
