import api from '@/lib/api';
import type { Location } from '@/types/location';

export const locationService = {
  getLocations: async (): Promise<Location[]> => {
    const response = await api.get<Location[]>('/locations');
    return response.data;
  },

  postLocation: async (data: FormData): Promise<Location> => {
    const response = await api.post<Location>('/locations', data);
    return response.data;
  },
};
