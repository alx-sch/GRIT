import { z } from 'zod';

const conversationTypes = z.enum(['EVENT', 'DIRECT', 'GROUP']);

const event = z.object({
  id: z.number().int().positive(),
  startAt: z.iso.datetime(),
  title: z.string(),
  imageKey: z.string().optional().nullable(),
});

const user = z.object({
  id: z.number().int().positive(),
  name: z.string().optional().nullable(),
  avatarKey: z.string().optional().nullable(),
});

const messageSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  text: z.string(),
  createdAt: z.iso.datetime(),
  author: user,
});

const participants = z.array(
  z.object({
    user: user,
  })
);

export const ResConversationStateSchema = z.object({
  lastMessage: messageSchema.nullable(),
  lastReadAt: z.iso.datetime().nullable(),
});
export type ResConversationState = z.infer<typeof ResConversationStateSchema>;

export const ResConversationsLastMessagesSchema = z.record(z.uuid(), ResConversationStateSchema);
export type ResConversationsLastMessages = z.infer<typeof ResConversationsLastMessagesSchema>;

export const ConversationBaseSchema = z.object({
  id: z.uuid(),
  type: conversationTypes,
  title: z.string().optional().nullable(),
  eventId: z.uuid().optional().nullable(),
});
export type ConversationBase = z.infer<typeof ConversationBaseSchema>;

export const ReqConversationCreateSchema = z.object({
  type: conversationTypes,
  eventId: z.number().int().positive().optional(),
  directId: z.number().int().positive().optional(),
  groupIds: z.array(z.number().int().positive()).optional(),
});
export type ReqConversationCreate = z.infer<typeof ReqConversationCreateSchema>;

export const ResConversationSingleIdSchema = z.object({
  id: z.string(),
});
export type ResConversationSingleId = z.infer<typeof ResConversationSingleIdSchema>;

export const ResConversationSingleSchema = z.object({
  id: z.string(),
  title: z.string().optional().nullable(),
  type: conversationTypes,
  updatedAt: z.iso.datetime(),
  event: event,
  participants: participants,
});
export type ResConversationSingle = z.infer<typeof ResConversationSingleSchema>;

export const ResConversationOverviewSchema = z.array(ResConversationSingleSchema);
export type ResConversationOverview = z.infer<typeof ResConversationOverviewSchema>;
