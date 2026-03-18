import { createZodDto } from 'nestjs-zod';
import { ReqConversationCreateSchema } from '@grit/schema';

export class ReqConversationCreateDto extends createZodDto(ReqConversationCreateSchema) {}
