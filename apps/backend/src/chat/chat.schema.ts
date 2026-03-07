import { createZodDto } from 'nestjs-zod';
import { ReqChatMessagePostSchema, ReqChatJoinSchema } from '@grit/schema';
import { z } from 'zod';

// Only internal usage
export const IntChatMessageSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  authorId: z.number().int().positive(),
  text: z.string().min(1),
});
export class IntChatMessageDto extends createZodDto(IntChatMessageSchema) {}

// Dtos from shared schema
export class ReqChatMessagePostDto extends createZodDto(ReqChatMessagePostSchema) {}
export class ReqChatJoinDto extends createZodDto(ReqChatJoinSchema) {}

/**
 * Note that there is also ResChatMessageSchema and ReqSocketCreationSchema which will be
 * imported directly from grit schema package as we don't need a Dto for it.
 */
