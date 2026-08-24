import { api } from '$lib/api/client';
import type { ApiRequestOptions } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateEventRequest,
	CreateEventResponse,
	ListEventsRequest,
	EventOccurrenceResponse,
	ListWorkApprovalQueueRequest,
	ListWorkApprovalQueueResponse,
	SetEventWorkApprovalRequest,
	UpdateEventRequest
} from '$lib/types/api';

export function createEvent(payload: CreateEventRequest, options?: ApiRequestOptions) {
	return api.post<ApiEnvelope<CreateEventResponse>>('/events', payload, options);
}

export function listEvents(payload: ListEventsRequest, options?: ApiRequestOptions) {
	return api.post<ApiEnvelope<EventOccurrenceResponse[]>>('/events/list', payload, options);
}

export function getEvent(id: string, options?: ApiRequestOptions) {
	return api.get<ApiEnvelope<CreateEventResponse>>(`/events/${id}`, options);
}

export function updateEvent(id: string, payload: UpdateEventRequest, options?: ApiRequestOptions) {
	return api.patch<ApiEnvelope<CreateEventResponse>>(`/events/${id}`, payload, options);
}

export function listWorkApprovalQueue(payload: ListWorkApprovalQueueRequest) {
	return api.post<ApiEnvelope<ListWorkApprovalQueueResponse>>(
		'/events/work_approval_queue',
		payload
	);
}

export function setEventWorkApproval(id: string, payload: SetEventWorkApprovalRequest) {
	return api.put<ApiEnvelope<unknown>>(`/events/${id}/work_approval`, payload);
}
