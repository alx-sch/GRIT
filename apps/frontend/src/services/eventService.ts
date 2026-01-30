import api from '@/lib/api';
import type { EventBase, EventResponse } from '@/types/event';

interface GetEventsParams {
  search?: string;
  startFrom?: string;
  startUntil?: string;
  limit?: string;
  authorId?: string;
  cursor?: string;
  locationId?: string;
}

interface CreateEventPayload {
  title: string;
  content?: string;
  startAt: string;
  endAt: string;
  isPublic: boolean;
  isPublished: boolean;
  locationId?: number;
}

export const eventService = {
  getEvents: async (params?: GetEventsParams): Promise<EventResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.startFrom) queryParams.set('start_from', params.startFrom);
    if (params?.startUntil) queryParams.set('start_until', params.startUntil);
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.authorId) queryParams.set('authorId', params.authorId);
    if (params?.cursor) queryParams.set('cursor', params.cursor);
    if (params?.locationId) queryParams.set('location_id', params.locationId);
    const queryString = queryParams.toString();
    const url = queryString ? `events?${queryString}` : '/events';
    const response = await api.get<EventResponse>(url);
    return response.data;
  },

  postEvent: async (data: CreateEventPayload): Promise<EventBase> => {
    const response = await api.post<EventBase>('/events', data);
    return response.data;
  },
};
