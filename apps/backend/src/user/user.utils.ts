import { BadRequestException } from '@nestjs/common';
import { ReqUserGetAllDto } from '@/user/user.schema';

/**
 * ==================================================
 * CURSOR ENCODING / DECODING
 * ==================================================
 *
 * Cursors are encoded to a single Base64 string to:
 * 1. Hide raw database values (createdAt dates and IDs) from the URL.
 * 2. Prevent users from accidentally modifying the cursor and breaking pagination.
 *
 * Example WITHOUT encoding:
 * GET /users?limit=20&cursor=2025-01-22T10:00:00.000Z|41
 *
 * Example WITH encoding:
 * GET /users?limit=20&cursor=MjAyNS0wMS0yMlQxMDowMDowMFo=
 */

export function userEncodeCursor(createdAt: Date, id: number) {
  const str = `${createdAt.toISOString()}|${String(id)}`;
  return Buffer.from(str).toString('base64');
}

export function userDecodeCursor(cursor: string): { createdAt: Date; id: number } {
  const [createdAtStr, idStr] = Buffer.from(cursor, 'base64').toString('utf-8').split('|');
  return { createdAt: new Date(createdAtStr), id: parseInt(idStr, 10) };
}

/* *
 * Constructs a Prisma-compatible filter for cursor-based pagination.
 *
 * When fetching users, `userGet()` sorts them by:
 *   1. `createdAt` ascending (oldest users first).
 *   2. `id` ascending as a "tie-breaker" for users with identical createdAt times.
 *
 * The `cursor` represents the point where the previous page ended. This
 * function validates and converts it into a filter that ensures the next
 * query resumes fetching users after the last user seen.
 * */
export function userCursorFilter(input: ReqUserGetAllDto) {
  const { cursor } = input;
  let cursorFilter = {};

  if (cursor) {
    try {
      const { createdAt, id } = userDecodeCursor(cursor);
      if (!(createdAt instanceof Date) || isNaN(createdAt.getTime()) || typeof id !== 'number') {
        throw new Error('Invalid cursor');
      }
      cursorFilter = {
        OR: [{ createdAt: { gt: createdAt } }, { createdAt, id: { gt: id } }],
      };
    } catch {
      throw new BadRequestException('Invalid cursor provided');
    }
  }
  return cursorFilter;
}
