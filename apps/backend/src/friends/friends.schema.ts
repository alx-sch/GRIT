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

export class ReqFriendRequestDto extends createZodDto(ReqFriendRequestSchema) {}
export class ReqFriendRequestsGetAllDto extends createZodDto(ReqFriendRequestsGetAllSchema) {}
export class ReqFriendsGetAllDto extends createZodDto(ReqFriendsGetAllSchema) {}

export class ResFriendRequestDto extends createZodDto(ResFriendRequestSchema) {}
export class ResFriendDto extends createZodDto(ResFriendSchema) {}
export class ResListFriendRequestDto extends createZodDto(ResListFriendRequestSchema) {}
export class ResListFriendDto extends createZodDto(ResListFriendSchema) {}
