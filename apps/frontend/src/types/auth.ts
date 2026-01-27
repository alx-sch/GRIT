import { z } from 'zod/v4';
import { ResAuthLoginSchema, ResAuthMeSchema } from '@/schema/auth';

export type ResAuthLoginInput = z.infer<typeof ResAuthLoginSchema>;
export type ResAuthMeInput = z.infer<typeof ResAuthMeSchema>;
