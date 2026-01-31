import { createZodDto } from 'nestjs-zod';
import { ReqChatMessagePostSchema, ReqChatJoinSchema } from '@grit/schema';
import { z } from 'zod';

export const IntChatMessageSchema = z.object({
  id: z.uuid(),
  eventId: z.number().int().positive(),
  authorId: z.number().int().positive(),
  text: z.string().min(1),
  sentAt: z.date(),
});
export class IntChatMessageDto extends createZodDto(IntChatMessageSchema) {}

// Dtos from shared schema
export class ReqChatMessagePostDto extends createZodDto(ReqChatMessagePostSchema) {}
export class ReqChatJoinSchemaDto extends createZodDto(ReqChatJoinSchema) {}
