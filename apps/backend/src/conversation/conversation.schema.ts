import { createZodDto } from 'nestjs-zod';
import { ReqConversationCreateSchema } from '@grit/schema';
import { z } from 'zod';

export class ReqConversationCreateDto extends createZodDto(ReqConversationCreateSchema) {}
