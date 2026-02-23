import { createZodDto } from 'nestjs-zod';
import {
  ReqFriendRequestSchema,
  ReqFriendActionSchema,
  ResFriendRequestSchema,
  ResFriendSchema,
  ResListFriendRequestSchema,
} from '@grit/schema';

// Request DTOs
export class ReqFriendRequestDto extends createZodDto(ReqFriendRequestSchema) {}
export class ReqFriendActionDto extends createZodDto(ReqFriendActionSchema) {}

// Response DTOs
export class ResFriendRequestDto extends createZodDto(ResFriendRequestSchema) {}
export class ResFriendDto extends createZodDto(ResFriendSchema) {}
export class ResListFriendRequestDto extends createZodDto(ResListFriendRequestSchema) {}
