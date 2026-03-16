import { createZodDto } from 'nestjs-zod';
import {
  ReqFriendRequestSchema,
  ReqFriendRequestsGetAllSchema,
  ReqFriendsGetAllSchema,
  ResFriendRequestSchema,
  ResFriendSchema,
  ResListFriendRequestSchema,
  ResListFriendSchema,
} from '@grit/schema';
import { z } from 'zod';

const ResFriendshipStatusSchemaInternal = z.object({
  status: z.enum(['none', 'pending_sent', 'pending_received', 'friends', 'self']),
});

export class ReqFriendRequestDto extends createZodDto(ReqFriendRequestSchema) {}
export class ReqFriendRequestsGetAllDto extends createZodDto(ReqFriendRequestsGetAllSchema) {}
export class ReqFriendsGetAllDto extends createZodDto(ReqFriendsGetAllSchema) {}
export class ResFriendRequestDto extends createZodDto(ResFriendRequestSchema) {}
export class ResFriendDto extends createZodDto(ResFriendSchema) {}
export class ResListFriendRequestDto extends createZodDto(ResListFriendRequestSchema) {}
export class ResListFriendDto extends createZodDto(ResListFriendSchema) {}
export class ResFriendshipStatusDto extends createZodDto(ResFriendshipStatusSchemaInternal) {}
export class ResFriendshipStatusDtoInternal extends createZodDto(
  ResFriendshipStatusSchemaInternal
) {}
