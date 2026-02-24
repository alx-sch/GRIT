import { BadRequestException } from '@nestjs/common';
import { ReqFriendsGetAllDto } from '@/friends/friends.schema';

/**
 * ==================================================
 * CURSOR ENCODING / DECODING FOR FRIENDS
 * ==================================================
 *
 * Cursors are encoded to a single Base64 string to:
 * 1. Hide raw database values from the URL.
 * 2. Prevent users from accidentally modifying the cursor and breaking pagination.
 *
 * Encodes: createdAt|id
 * Example: "2026-02-24T12:45:30.000Z|550e8400-e29b-41d4-a716-446655440000"
 * Encoded: "MjAyNi0wMi0yNFQxMjo0NTozMC4wMDBafDU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMA=="
 */

export function friendsEncodeCursor(createdAt: Date, id: string) {
  const str = `${createdAt.toISOString()}|${id}`;
  return Buffer.from(str).toString('base64');
}

export function friendsDecodeCursor(cursor: string): { createdAt: Date; id: string } {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  const [createdAtStr, id] = decoded.split('|');
  return { createdAt: new Date(createdAtStr), id };
}

/**
 * Constructs a Prisma-compatible filter for cursor-based pagination.
 *
 * Sorts friends by:
 *   1. createdAt ascending (oldest friendships first)
 *   2. id ascending as a tie-breaker
 */
export function friendsCursorFilter(input: ReqFriendsGetAllDto) {
  const { cursor } = input;
  let cursorFilter = {};

  if (cursor) {
    try {
      const { createdAt, id } = friendsDecodeCursor(cursor);

      if (!(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
        throw new Error('Invalid cursor: createdAt must be a valid date');
      }
      if (typeof id !== 'string') {
        throw new Error('Invalid cursor: id must be a string');
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
