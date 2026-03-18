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

export const ReqChatGetInitialHistorySchema = z.strictObject({
  conversationId: z.uuid(),
});
export class ReqChatGetInitialHistoryDto extends createZodDto(ReqChatGetInitialHistorySchema) {}

export const ReqChatLoadMoreHistorySchema = z.strictObject({
  cursorSentAt: z.iso.datetime(),
  cursorId: z.uuid(),
  conversationId: z.uuid(),
});
export class ReqChatLoadMoreHistoryDto extends createZodDto(ReqChatLoadMoreHistorySchema) {}

export const ReqChatConversationReadSchema = z.strictObject({
  conversationId: z.uuid(),
});
export class ReqChatConversationReadDto extends createZodDto(ReqChatConversationReadSchema) {}

export const ReqChatDeleteMessageSchema = z.strictObject({
  messageId: z.uuid(),
  conversationId: z.uuid(),
});
export class ReqChatDeleteMessageDto extends createZodDto(ReqChatDeleteMessageSchema) {}

// Dtos from shared schema
export class ReqChatMessagePostDto extends createZodDto(ReqChatMessagePostSchema) {}
export class ReqChatJoinDto extends createZodDto(ReqChatJoinSchema) {}

/**
 * Note that there is also ResChatMessageSchema and ReqSocketCreationSchema which will be
 * imported directly from grit schema package as we don't need a Dto for it.
 */
