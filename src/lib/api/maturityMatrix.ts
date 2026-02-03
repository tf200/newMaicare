import { api } from '$lib/api/client';
import type { ApiEnvelope, ListCarePlanTopics } from '$lib/types/api';

export function listMaturityMatrixTopics() {
	return api.get<ApiEnvelope<ListCarePlanTopics[]>>('/maturity_matrix');
}
