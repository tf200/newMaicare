import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateEventRequest,
	CreateEventResponse,
	ListEventsRequest,
	EventOccurrenceResponse,
	ListWorkApprovalQueueRequest,
	ListWorkApprovalQueueResponse,
	SetEventWorkApprovalRequest
} from '$lib/types/api';

export function createEvent(payload: CreateEventRequest) {
	return api.post<ApiEnvelope<CreateEventResponse>>('/events', payload);
}

export function listEvents(payload: ListEventsRequest) {
	return api.post<ApiEnvelope<EventOccurrenceResponse[]>>('/events/list', payload);
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
