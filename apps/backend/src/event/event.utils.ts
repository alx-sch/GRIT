import { ReqEventGetPublishedDto } from './event.schema';
import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

/**
 * ==================================================
 * CURSOR ENCODING / DECODING
 * ==================================================
 *
 * Cursors are encoded to a single Base64 string to:
 * 1. Hide raw database values (startAt dates and IDs) from the URL.
 * 2. Prevent frontend users from accidentally modifying the cursor and breaking pagination.
 *
 * Example WITHOUT encoding:
 * GET /events?limit=20&cursor=2025-01-22T10:00:00.000Z|41
 *
 * Example WITH encoding:
 * GET /events?limit=20&cursor=MjAyNS0wMS0yMlQxMDowMDowMFo=
 */

export function encodeCursor(startAt: Date, id: number) {
  const str = `${startAt.toISOString()}|${id}`;
  return Buffer.from(str).toString('base64');
}

export function decodeCursor(cursor: string): { startAt: Date; id: number } {
  const [startAtStr, idStr] = Buffer.from(cursor, 'base64').toString('utf-8').split('|');
  return { startAt: new Date(startAtStr), id: parseInt(idStr, 10) };
}

/**
 * ==================================================
 * HELPER FUNCTIONS FOR EVENTGETPUBLISHED()
 * ==================================================
 */

// For filtering the events by start time, author id, search keywords etc.
export function eventSearchFilter(input: ReqEventGetPublishedDto) {
  const where: Prisma.EventWhereInput = { isPublished: true };

  if (input.search) {
    where.OR = [
      { title: { contains: input.search, mode: 'insensitive' } },
      { content: { contains: input.search, mode: 'insensitive' } },
    ];
  }
  if (input.author_id) where.authorId = input.author_id;
  if (input.start_from || input.start_until) {
    where.startAt = {};
    if (input.start_from) where.startAt.gte = input.start_from;
    if (input.start_until) where.startAt.lte = input.start_until;
  }
  if (input.location_id) where.locationId = input.location_id;

  return where;
}

/* *
 * Constructs a Prisma-compatible filter for cursor-based pagination.
 *
 * When fetching published events, `getPublishedEvents()` sorts events by:
 *   1. `startAt` ascending (earliest events first)
 *   2. `id` ascending as a "tie-breaker" for events with identical start times
 *
 * The `cursor` represents the point where the previous page ended. This
 * function validates and converts it into a filter that ensures the next
 * query resumes fetching events after the last event seen.
 * */
export function eventCursorFilter(input: ReqEventGetPublishedDto) {
  const { limit, cursor } = input;
  let cursorFilter = {};

  if (cursor) {
    try {
      const { startAt, id } = decodeCursor(cursor);
      if (!(startAt instanceof Date) || isNaN(startAt.getTime()) || typeof id !== 'number') {
        throw new Error('Invalid cursor');
      }
      cursorFilter = {
        OR: [{ startAt: { gt: startAt } }, { startAt, id: { gt: id } }],
      };
    } catch {
      throw new BadRequestException('Invalid cursor provided');
    }
  }
  return cursorFilter;
}
