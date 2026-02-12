import api from '@/lib/api';
import type { EventBase, EventResponse } from '@/types/event';
import { CreateEventInput, PatchEventInput } from '@grit/schema';

interface GetEventsParams {
  search?: string;
  startFrom?: string;
  startUntil?: string;
  limit?: string;
  authorId?: string;
  cursor?: string;
  locationId?: string;
  sort?: string;
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
    if (params?.sort) queryParams.set('sort', params.sort);
    const queryString = queryParams.toString();
    const url = queryString ? `events?${queryString}` : '/events';
    const response = await api.get<EventResponse>(url);
    return response.data;
  },

  getEvent: async (id: string): Promise<EventBase> => {
    const response = await api.get<EventBase>(`/events/${id}`);
    return response.data;
  },

  postEvent: async (data: CreateEventInput): Promise<EventBase> => {
    const response = await api.post<EventBase>('/events', data);
    return response.data;
  },

  patchEvent: async (id: string, data: PatchEventInput): Promise<EventBase> => {
    const response = await api.patch<EventBase>(`/events/${id}`, data);
    return response.data;
  },

  uploadEventImage: async (
    eventId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<EventBase> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.patch<EventBase>(
      `/events/${String(eventId)}/upload-image`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / (e.total ?? 1))),
      }
    );
    return response.data;
  },
};
