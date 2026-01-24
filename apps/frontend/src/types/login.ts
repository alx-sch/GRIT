import { z } from 'zod/v4';
import { ResAuthLoginSchema, ResAuthMeSchema, FormAuthLoginSchema } from '@/schema/login';

export type ResAuthLoginDto = z.infer<typeof ResAuthLoginSchema>;
export type ResAuthMeDto = z.infer<typeof ResAuthMeSchema>;
export type FormAuthLoginDto = z.infer<typeof FormAuthLoginSchema>;
