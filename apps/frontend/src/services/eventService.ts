import api from '@/lib/api';
import type {Event} from '@/types/event';

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
  getEvents: async(params?: GetEventsParams): Promise<Event[]> => {
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

  postEvent: async(data: CreateEventPayload): Promise<Event> => {
    console.log('eventService.postEvent called with:', data);
    console.log('api object:', api);
    console.log('About to call api.post...');

    try {
      const response = await api.post<Event>('/events', data);
      console.log('api.post response:', response);
      return response.data;
    } catch (err: unknown) {
      console.error('api.post error:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {response?: {data?: unknown; status?: number}};
        console.error('Backend error response:', axiosErr.response?.data);
        console.error('Status:', axiosErr.response?.status);
      }
      throw err;
    }
  }
};
