import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { getEvaluationStats } from '$lib/api/evaluations';
import { PERMISSIONS } from '$lib/config/permissions';
import { m } from '$lib/paraglide/messages';
import { getAuthState } from '$lib/state/auth.svelte';
import type { EvaluationDateTime } from '$lib/types/api';

export interface EvaluationStatsLoadResult {
	attentionRequired: number;
	inProgress: number;
	recentlyFinalized: number;
	asOf: EvaluationDateTime | null;
	loadError: string | null;
}

export const load: LayoutLoad = ({ fetch, depends }) => {
	const auth = getAuthState();
	if (!auth.hasAllPermissions([PERMISSIONS.CLIENT.VIEW, PERMISSIONS.CLIENT.EVALUATION_VIEW])) {
		error(403, m.evaluations_access_denied());
	}

	depends('app:evaluations:stats');

	const stats: Promise<EvaluationStatsLoadResult> = getEvaluationStats({ fetchFn: fetch })
		.then((response) => ({
			attentionRequired: response.data.attention_required,
			inProgress: response.data.in_progress,
			recentlyFinalized: response.data.recently_finalized,
			asOf: response.data.as_of,
			loadError: null
		}))
		.catch((): EvaluationStatsLoadResult => ({
			attentionRequired: 0,
			inProgress: 0,
			recentlyFinalized: 0,
			asOf: null,
			loadError: m.failed_load_evaluation_stats()
		}));

	return { stats };
};
