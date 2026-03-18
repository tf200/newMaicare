import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	AutoGenerateScheduleRequest,
	AutoGenerateScheduleResponse,
	CreateScheduleRequest,
	SaveGeneratedScheduleRequest,
	ScheduleResponseItem
} from '$lib/types/api';

export interface GetEmployeeSchedulesParams {
	employeeId: string;
	startDate?: string;
	endDate?: string;
	locationId?: string;
}

export function getEmployeeSchedules(params: GetEmployeeSchedulesParams) {
	const query = new URLSearchParams();
	query.set('employee_id', params.employeeId);
	if (params.startDate) query.set('start_date', params.startDate);
	if (params.endDate) query.set('end_date', params.endDate);
	if (params.locationId) query.set('location_id', params.locationId);

	const queryString = query.toString();
	const endpoint = `/schedules?${queryString}`;
	return api.get<ApiEnvelope<ScheduleResponseItem[]>>(endpoint);
}

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
