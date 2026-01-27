import { CreateEventSchema } from '@grit/schema';
import z from 'zod/v4';

const today = new Date();
today.setHours(0, 0, 0, 0);

export const EventFormSchema = CreateEventSchema.extend({
  startAt: z
    .date({
      error: 'Start date is required',
    })
    .min(today, 'Start date must be in the future'),
}).refine((data) => data.endAt >= data.startAt, {
  message: 'End date must be after start date',
  path: ['endAt'],
});

export type EventFormFields = z.infer<typeof EventFormSchema>;
