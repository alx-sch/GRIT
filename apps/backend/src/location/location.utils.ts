import { BadRequestException } from '@nestjs/common';
import { ReqLocationGetAllDto } from '@/location/location.schema';

/**
 * ==================================================
 * CURSOR ENCODING / DECODING
 * ==================================================
 *
 * Cursors are encoded to a single Base64 string to:
 * 1. Hide raw database values (names and IDs) from the URL.
 * 2. Prevent users from accidentally modifying the cursor and breaking pagination.
 *
 * Example WITHOUT encoding:
 * GET /locations?limit=20&cursor=Grit Launch Party|41
 *
 * Example WITH encoding:
 * GET /locations?limit=20&cursor=MjAyNS0wMS0yMlQxMDowMDowMFo=
 */

export function locationEncodeCursor(name: string | null, id: number) {
  const safeName = name ?? '';
  const str = `${safeName}|${String(id)}`;
  return Buffer.from(str).toString('base64');
}

export function locationDecodeCursor(cursor: string): { name: string | null; id: number } {
  const [nameStr, idStr] = Buffer.from(cursor, 'base64').toString('utf-8').split('|');
  return { name: nameStr, id: parseInt(idStr, 10) };
}

/* *
 * Constructs a Prisma-compatible filter for cursor-based pagination.
 *
 * When fetching locations, `locationGet()` sorts them by:
 *   1. `name` ascending (a-z, 'null' values always come last).
 *   2. `id` ascending as a "tie-breaker" for locations with identical names.
 *
 * The `cursor` represents the point where the previous page ended. This
 * function validates and converts it into a filter that ensures the next
 * query resumes fetching locations after the last location seen.
 * */
export function locationCursorFilter(input: ReqLocationGetAllDto) {
  const { cursor } = input;
  let cursorFilter = {};

  if (cursor) {
    try {
      const { name, id } = locationDecodeCursor(cursor);

      if (name !== null && typeof name !== 'string') {
        throw new Error('Invalid cursor: name must be string or null');
      }
      if (typeof id !== 'number' || isNaN(id)) {
        throw new Error('Invalid cursor: id must be a number');
      }

      cursorFilter = {
        OR: [
          name === null ? { name: null, id: { gt: id } } : { name: { gt: name } },
          name !== null ? { name, id: { gt: id } } : {},
        ],
      };
    } catch {
      throw new BadRequestException('Invalid cursor provided');
    }
  }

  return cursorFilter;
}
