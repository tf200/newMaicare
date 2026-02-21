import { api } from '$lib/api/client';
import type { ApiEnvelope, CreateScheduleRequest, ScheduleResponseItem } from '$lib/types/api';

export function createSchedules(payload: CreateScheduleRequest) {
	return api.post<ApiEnvelope<ScheduleResponseItem[]>>('/schedules', payload);
}
