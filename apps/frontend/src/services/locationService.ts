import api from '@/lib/api';
import type { Location } from '@/types/location';

export const locationService = {
  getLocations: async (): Promise<Location[]> => {
    const response = await api.get<Location[]>('/locations');
    return response.data;
  },
};
