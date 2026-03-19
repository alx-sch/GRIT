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
 *   1. createdAt descending (newest friendships/friends first)
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
        OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { gt: id } }],
      };
    } catch {
      throw new BadRequestException('Invalid cursor provided');
    }
  }

  return cursorFilter;
}

/**
 * ==================================================
 * CURSOR ENCODING / DECODING FOR ALPHABETICAL SORTING
 * ==================================================
 *
 * Encodes: name|id
 * Example: "Alice|550e8400-e29b-41d4-a716-446655440000"
 */

export function friendNameEncodeCursor(name: string, id: string) {
  const str = `${name}|${id}`;
  return Buffer.from(str).toString('base64');
}

export function friendNameDecodeCursor(cursor: string): { name: string; id: string } {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');

  // Find the last pipe in case a user's name somehow contains a pipe
  const lastPipeIndex = decoded.lastIndexOf('|');
  if (lastPipeIndex === -1) {
    throw new Error('Invalid cursor format');
  }

  const name = decoded.substring(0, lastPipeIndex);
  const id = decoded.substring(lastPipeIndex + 1);
  return { name, id };
}

/**
 * Constructs a Prisma-compatible filter for alphabetical cursor-based pagination.
 *
 * Sorts friends by:
 * 1. friend.name ascending (A to Z)
 * 2. id ascending as a tie-breaker
 */
export function friendNameCursorFilter(input: ReqFriendsGetAllDto) {
  const { cursor } = input;
  let cursorFilter = {};

  if (cursor) {
    try {
      const { name, id } = friendNameDecodeCursor(cursor);

      if (!name || typeof name !== 'string') {
        throw new Error('Invalid cursor: name must be a valid string');
      }
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid cursor: id must be a string');
      }

      cursorFilter = {
        OR: [
          // Name is alphabetically greater (comes after)
          { friend: { name: { gt: name } } },
          // Name is identical, break tie with ID
          { friend: { name }, id: { gt: id } },
        ],
      };
    } catch {
      throw new BadRequestException('Invalid cursor provided');
    }
  }

  return cursorFilter;
}
