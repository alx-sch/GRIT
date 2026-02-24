import { createZodDto } from 'nestjs-zod';
import {
  ReqFriendRequestSchema,
  ResFriendRequestSchema,
  ResFriendSchema,
  ResListFriendRequestSchema,
  ResListFriendSchema,
} from '@grit/schema';

// Request DTOs
export class ReqFriendRequestDto extends createZodDto(ReqFriendRequestSchema) {}

// Response DTOs
export class ResFriendRequestDto extends createZodDto(ResFriendRequestSchema) {}
export class ResFriendDto extends createZodDto(ResFriendSchema) {}
export class ResListFriendRequestDto extends createZodDto(ResListFriendRequestSchema) {}
export class ResListFriendDto extends createZodDto(ResListFriendSchema) {}
