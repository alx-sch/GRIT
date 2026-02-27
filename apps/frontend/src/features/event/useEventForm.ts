import { DRAFT_KEY } from '@/features/event/DraftSaver';
 import { getEventImageUrl } from '@/lib/image_utils';
 import { EventFormSchema, type EventFormFields } from '@/schema/event';
 import { eventService } from '@/services/eventService';
 import { EventBase } from '@/types/event';
 import { LocationBase } from '@/types/location';
 import { CreateEventSchema } from '@grit/schema';
 import { zodResolver } from '@hookform/resolvers/zod';
 import { isAxiosError } from 'axios';
 import { useEffect, useState } from 'react';
 import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
 import { useNavigate } from 'react-router-dom';
 import { toast } from 'sonner';

interface UseEventFormProps {
	initialData?: EventBase;
	locations: LocationBase[];
}

export function useEventForm({initialData, locations} : UseEventFormProps) {
	

}
