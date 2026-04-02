import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	PaginatedResponse,
	ShiftSwapResponse,
	ShiftSwapStatus
} from '$lib/types/api';

export type ShiftSwapFilter = 'open' | 'to_approve' | 'history';

export interface ListShiftSwapsParams {
	page?: number;
	pageSize?: number;
	page_size?: number;
	status?: ShiftSwapStatus;
	filter?: ShiftSwapFilter;
	employeeId?: string;
	employee_id?: string;
}

export function listShiftSwaps(params: ListShiftSwapsParams = {}) {
	const query = new URLSearchParams();

	if (params.page != null) query.set('page', String(params.page));
	if (params.page_size != null) {
		query.set('page_size', String(params.page_size));
	} else if (params.pageSize != null) {
		query.set('page_size', String(params.pageSize));
	}

	if (params.status) query.set('status', params.status);
	if (params.filter) query.set('filter', params.filter);

	const employeeId = params.employee_id ?? params.employeeId;
	if (employeeId) query.set('employee_id', employeeId);

	const queryString = query.toString();
	const endpoint = queryString ? `/shift-swaps?${queryString}` : '/shift-swaps';

	return api.get<ApiEnvelope<PaginatedResponse<ShiftSwapResponse>>>(endpoint);
}
