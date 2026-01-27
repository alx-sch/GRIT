import { z } from 'zod/v4';
import { ResAuthLoginSchema, ResAuthMeSchema } from '@/schema/auth';

export type ResAuthLoginDto = z.infer<typeof ResAuthLoginSchema>;
export type ResAuthMeDto = z.infer<typeof ResAuthMeSchema>;
