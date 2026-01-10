import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

// --- ZOD SCHEMAS ---

export const ResUserBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullish(),
  avatarKey: z.string().nullish(),
});

export const ResUserPostSchema = ResUserBaseSchema.extend({
  email: z.email(),
});

export const ReqUserPostSchema = z.object({
  name: z.string().nullish(),
  email: z.email({ message: 'Invalid email address' }),
  avatarKey: z.string().nullish(),
});

// --- RESPONSE DTOs (Output) ---

export class ResUserBaseDto extends createZodDto(ResUserBaseSchema) {
  @ApiProperty({ example: 124 })
  id!: number;

  @ApiProperty({ example: 'AliceInWonderland', nullable: true })
  name?: string | null;

  @ApiProperty({ example: '1767968574321-825fc7de.jpg', nullable: true })
  avatarKey?: string | null;
}

export class ResUserPostDto extends ResUserBaseDto {
  @ApiProperty({ example: 'alice@example.com' })
  email!: string;
}

// --- REQUEST DTOs (Input) ---

export class ReqUserPostDto extends createZodDto(ReqUserPostSchema) {
  @ApiProperty({ required: false, example: 'AliceInWonderland' })
  name?: string;

  @ApiProperty({ example: 'alice@example.com' })
  email!: string;

  @ApiProperty({ required: false, example: '1767968574321-825fc7de.jpg' })
  avatarKey?: string;
}

// --- UTILITY DTOs ---

export class ReqUserAvatarUploadDto extends createZodDto(z.object({ file: z.any() })) {}
export class ReqUserGetAllDto extends createZodDto(z.strictObject({})) {}
