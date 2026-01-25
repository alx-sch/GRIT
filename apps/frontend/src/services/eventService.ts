import api from '@/lib/api';
import type { Event } from '@/types/event';

interface GetEventsParams {
  search?: string;
  startFrom?: string;
  startUntil?: string;
}

export const eventService = {
  getEvents: async (params?: GetEventsParams): Promise<Event[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.startFrom) queryParams.set('start_from', params.startFrom);
    if (params?.startUntil) queryParams.set('start_until', params.startUntil);

    const queryString = queryParams.toString();
    const url = queryString ? `events?${queryString}` : '/events';
    const response = await api.get<Event[]>(url);
    return response.data;
  },

  getEvent: async (id: string): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    // TODO parse once schema is available unified for front and backend
    return response.data;
  },
};
