import api from '@/lib/api';
import { EventBase } from '@/types/event';
import { LocationBase } from '@/types/location';

export interface AdminUser {
  id: number;
  name: string;
  avatarKey?: string | null;
  isAdmin: boolean;
  email: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

const ADMIN_FETCH_LIMIT = 100;

export const adminService = {
  // Users
  async getAllUsers(): Promise<AdminUser[]> {
    const response = await api.get<AdminUser[]>(`/users/admin`);
    return response.data;
  },

  async deleteUser(userId: number) {
    return api.delete(`/users/${userId}`);
  },

  async deleteUserAvatar(userId: number) {
    return api.delete(`/users/${userId}/avatar`);
  },

  // Locations
  async getAllLocations() {
    const response = await api.get<PaginatedResponse<LocationBase>>(
      `/locations?limit=${ADMIN_FETCH_LIMIT}`
    );
    return response.data.data;
  },

  async deleteLocation(locationId: number) {
    return api.delete(`/locations/${locationId}`);
  },

  // Events
  async getAllEvents() {
    const response = await api.get<PaginatedResponse<EventBase>>(
      `/events?limit=${ADMIN_FETCH_LIMIT}`
    );
    return response.data.data;
  },

  async deleteEvent(eventId: number) {
    return api.delete(`/events/${eventId}`);
  },

  async deleteEventImage(eventId: number) {
    return api.delete(`/events/${eventId}/image`);
  },

  async deleteEventFile(eventId: number, fileId: number) {
    return api.delete(`/events/${eventId}/files/${fileId}`);
  },
};
