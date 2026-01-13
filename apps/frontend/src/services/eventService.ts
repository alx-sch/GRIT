import api from '@/lib/api';
import type { Event } from '@/types/event';

interface GetEventsParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const eventService = {
  getEvents: async (params?: GetEventsParams): Promise<Event[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.dateFrom) queryParams.set('date_from', params.dateFrom);
    if (params?.dateTo) queryParams.set('date_to', params.dateTo);

    const queryString = queryParams.toString();
    const url = queryString ? `events?${queryString}` : '/events';
    const response = await api.get<Event[]>(url);
    return response.data;
  },
};
