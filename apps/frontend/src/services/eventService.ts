import api from '@/lib/api';
import type { Event } from '@/types/event';

export const eventService = {
	getEvents: async (): Promise<Event[]> => {
		const response = await api.get<Event[]>('/events');
		return response.data;
	}
}
