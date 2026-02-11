import {z} from 'zod';

export const ResUserEventSchema = z.object({title: z.string()});
export const ResUserEventsSchema = z.array(ResUserEventSchema);
export type ResUserEvents = z.infer<typeof ResUserEventsSchema>;

export const ResUserBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable(),
  email: z.email(),
  avatarKey: z.string().nullable(),
  isConfirmed: z.boolean().default(false),
  attending: z.array(ResUserEventSchema).default([]),
});
export type ResUserBase = z.infer<typeof ResUserBaseSchema>;

// Paginated response
export const ResUserGetAllSchema = z.object({
  data: z.array(ResUserBaseSchema),
  pagination:
      z.object({nextCursor: z.string().nullable(), hasMore: z.boolean()}),
});
export type ResUserGetAll = z.infer<typeof ResUserGetAllSchema>;
