import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	AutoGenerateScheduleRequest,
	AutoGenerateScheduleResponse,
	CreateScheduleRequest,
	SaveGeneratedScheduleRequest,
	ScheduleResponseItem
} from '$lib/types/api';

export function createSchedules(payload: CreateScheduleRequest) {
	return api.post<ApiEnvelope<ScheduleResponseItem[]>>('/schedules', payload);
}

export function deleteSchedule(scheduleId: string) {
	return api.delete<ApiEnvelope<null>>(`/schedules/${scheduleId}`);
}

export function autoGenerateSchedules(payload: AutoGenerateScheduleRequest) {
	return api.post<ApiEnvelope<AutoGenerateScheduleResponse>>('/schedules/auto_generate', payload);
}

export function saveGeneratedSchedule(payload: SaveGeneratedScheduleRequest) {
	return api.post<ApiEnvelope<null>>('/schedules/save_generated', payload);
}
