import api from '@/lib/api';
import type { LocationBase, LocationResponse } from '@/types/location';
import { CreateLocationInput } from '@grit/schema';

interface GetLocationsParams {
  limit?: string;
  cursor?: string;
}

export const locationService = {
  getLocations: async (params?: GetLocationsParams): Promise<LocationResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.cursor) queryParams.set('cursor', params.cursor);
    const queryString = queryParams.toString();
    const url = queryString ? `/locations?${queryString}` : '/locations';
    const response = await api.get<LocationResponse>(url);
    return response.data;
  },

  postLocation: async (data: CreateLocationInput): Promise<LocationBase> => {
    const response = await api.post<LocationBase>('/locations', data);
    return response.data;
  },
};
