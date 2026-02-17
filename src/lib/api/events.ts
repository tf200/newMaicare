import { api } from '$lib/api/client';
import type {
	ApiEnvelope,
	CreateEventRequest,
	CreateEventResponse,
	ListEventsRequest,
	EventOccurrenceResponse
} from '$lib/types/api';

export function createEvent(payload: CreateEventRequest) {
	return api.post<ApiEnvelope<CreateEventResponse>>('/events', payload);
}

export function listEvents(payload: ListEventsRequest) {
	return api.post<ApiEnvelope<EventOccurrenceResponse[]>>('/events/list', payload);
}
