import api from '@/lib/api';
import type { Event } from '@/types/event';

interface GetEventsParams {
  search?: string;
  startFrom?: string;
  startUntil?: string;
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
  getEvents: async (params?: GetEventsParams): Promise<Event[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.startFrom) queryParams.set('start_from', params.startFrom);
    if (params?.startUntil) queryParams.set('start_until', params.startUntil);
    if (params?.locationId) queryParams.set('location_id', params.locationId);
    const queryString = queryParams.toString();
    const url = queryString ? `events?${queryString}` : '/events';
    const response = await api.get<Event[]>(url);
    return response.data;
  },

  postEvent: async (data: CreateEventPayload): Promise<Event> => {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },
};
