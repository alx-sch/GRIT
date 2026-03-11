import { createZodDto } from 'nestjs-zod';
import {
  ReqInviteSchema,
  ReqUpdateInviteSchema,
  ResInviteSchema,
  ResListInvitesSchema,
} from '@grit/schema';

export class ReqInviteDto extends createZodDto(ReqInviteSchema) {}
export class ReqUpdateInviteDto extends createZodDto(ReqUpdateInviteSchema) {}
export class ResInviteDto extends createZodDto(ResInviteSchema) {}
export class ResListInvitesDto extends createZodDto(ResListInvitesSchema) {}
