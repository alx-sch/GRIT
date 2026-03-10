import api from '@/lib/api';

export interface AdminUser {
  id: number;
  name: string;
  avatarKey?: string | null;
  isAdmin: boolean;
  email: string;
}

export interface AdminLocation {
  id: number;
  name: string;
  city?: string;
  country?: string;
}

export interface AdminEvent {
  id: number;
  title: string;
  startAt: string;
  isPublished: boolean;
}

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
    const response = await api.get<AdminLocation[]>(`/locations/admin`);
    return response.data;
  },

  async deleteLocation(locationId: number) {
    return api.delete(`/locations/${locationId}`);
  },

  // Events
  async getAllEvents() {
    const response = await api.get<AdminEvent[]>(`/events/admin`);
    return response.data;
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
