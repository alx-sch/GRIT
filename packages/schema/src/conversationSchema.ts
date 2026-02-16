import { z } from 'zod';

const conversationTypes = z.enum(['EVENT', 'DIRECT', 'GROUP']);

const event = z.object({
  id: z.number().int().positive(),
  startAt: z.string(),
  title: z.string(),
  imageKey: z.string().optional().nullable(),
});

const user = z.object({
  id: z.number().int().positive(),
  avatarKey: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
});

const messages = z.array(
  z.object({
    id: z.uuid(),
    author: user,
    createdAt: z.string(),
    text: z.string(),
  })
);

const participants = z.array(
  z.object({
    user: user,
  })
);

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
  updatedAt: z.string().or(z.date()),
  event: event,
  messages: messages.optional(),
  participants: participants,
});
export type ResConversationSingle = z.infer<typeof ResConversationSingleSchema>;

export const ResConversationOverviewSchema = z.array(ResConversationSingleSchema);
export type ResConversationOverview = z.infer<typeof ResConversationOverviewSchema>;
