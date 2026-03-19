import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import slugify from 'slugify';
import { deu, eng, fra, removeStopwords, spa } from 'stopword';

import { ReqEventGetPublishedDto } from './event.schema';

/**
 * ==================================================
 * CURSOR ENCODING / DECODING
 * ==================================================
 *
 * Cursors are encoded to a single Base64 string to:
 * 1. Hide raw database values (startAt dates and IDs) from the URL.
 * 2. Prevent users from accidentally modifying the cursor and breaking
 * pagination.
 *
 * Example WITHOUT encoding:
 * GET /events?limit=20&cursor=2025-01-22T10:00:00.000Z|41
 *
 * Example WITH encoding:
 * GET /events?limit=20&cursor=MjAyNS0wMS0yMlQxMDowMDowMFo=
 */

export function eventEncodeCursor(
  startAt: Date,
  id: number,
  sort: string,
  title?: string,
  attendeeCount?: number
) {
  const str = `${startAt.toISOString()}|${String(id)}|${sort}|${title ?? ''}|${String(attendeeCount ?? 0)}`;
  return Buffer.from(str).toString('base64');
}

export function eventDecodeCursor(cursor: string): {
  startAt: Date;
  id: number;
  sort: string;
  title?: string;
  attendeeCount?: number;
} {
  const parts = Buffer.from(cursor, 'base64').toString('utf-8').split('|');
  const [startAtStr, idStr, sort, title, attendeeCountStr] = parts;
  return {
    startAt: new Date(startAtStr),
    id: parseInt(idStr, 10),
    sort: sort || 'date-asc',
    title: title || undefined,
    attendeeCount: attendeeCountStr ? parseInt(attendeeCountStr, 10) : undefined,
  };
}

/**
 * ==================================================
 * HELPER FUNCTIONS FOR EVENTGETPUBLISHED()
 * ==================================================
 */

// For filtering the events by start time, author id, search keywords etc.
export function eventSearchFilter(input: ReqEventGetPublishedDto, userId?: number) {
  // Base filter: published events that are either:
  // 1. Public events (visible to everyone)
  // 2. Private events where the user is the author
  // 3. Private events where the user is attending
  // 4. Private events where the user is invited
  const visibilityFilter: Prisma.EventWhereInput = userId
    ? {
        OR: [
          { isPublic: true },
          { authorId: userId },
          { attendees: { some: { userId } } },
          { invites: { some: { receiverId: userId } } },
        ],
      }
    : { isPublic: true };

  const where: Prisma.EventWhereInput = {
    isPublished: true,
    ...visibilityFilter,
  };

  if (input.search) {
    where.AND = [
      {
        OR: [
          { title: { contains: input.search, mode: 'insensitive' } },
          { content: { contains: input.search, mode: 'insensitive' } },
        ],
      },
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
 * Handles different sort modes with appropriate comparison operators.
 * The cursor encodes the last item seen and the sort mode used.
 * */
export function eventCursorFilter(input: ReqEventGetPublishedDto): Prisma.EventWhereInput {
  const { cursor, sort } = input;

  if (!cursor) return {};

  try {
    const decoded = eventDecodeCursor(cursor);
    const { startAt, id, title, attendeeCount } = decoded;
    const cursorSort = (decoded.sort || sort) ?? 'date-asc';

    if (!(startAt instanceof Date) || isNaN(startAt.getTime()) || typeof id !== 'number') {
      throw new Error('Invalid cursor');
    }

    // Build filter based on sort mode
    switch (cursorSort) {
      case 'date-dsc':
        // Descending by date: get events with earlier dates
        return {
          OR: [{ startAt: { lt: startAt } }, { startAt, id: { lt: id } }],
        };

      case 'alpha-asc':
        // Ascending by title: get events with titles after current
        if (!title) {
          throw new Error('Title missing from cursor for alpha-asc sort');
        }
        return {
          OR: [
            { title: { gt: title, mode: 'insensitive' } },
            { title: { equals: title, mode: 'insensitive' }, startAt: { gt: startAt } },
            { title: { equals: title, mode: 'insensitive' }, startAt, id: { gt: id } },
          ],
        };

      case 'alpha-dsc':
        // Descending by title: get events with titles before current
        if (!title) {
          throw new Error('Title missing from cursor for alpha-dsc sort');
        }
        return {
          OR: [
            { title: { lt: title, mode: 'insensitive' } },
            { title: { equals: title, mode: 'insensitive' }, startAt: { gt: startAt } },
            { title: { equals: title, mode: 'insensitive' }, startAt, id: { gt: id } },
          ],
        };

      case 'popularity':
        // Descending by attendeeCount: get events with fewer attendees
        // For ties, sort by startAt asc, then id asc
        if (attendeeCount === undefined) {
          throw new Error('Attendee count missing from cursor for popularity sort');
        }
        return {
          OR: [
            { attendeeCount: { lt: attendeeCount } },
            { attendeeCount, startAt: { gt: startAt } },
            { attendeeCount, startAt, id: { gt: id } },
          ],
        };

      case 'date-asc':
      default:
        // Ascending by date (default): get events with later dates
        return {
          OR: [{ startAt: { gt: startAt } }, { startAt, id: { gt: id } }],
        };
    }
  } catch {
    throw new BadRequestException('Invalid cursor provided');
  }
}

/**
 * ==================================================
 * HELPER FUNCTIONS (GENERAL)
 * ==================================================
 */

// "nanoid" uses '-' and '_' --> exclude these by using a custom alphabet
const generateNanoId = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  3
);

/**
 * Generates a unique, URL-friendly slug for an event.
 * Combines the title with a random suffix to support anonymous sharing and
 * prevent URL guessing.
 *
 * Example:
 * - Title: "   💕 A cool Valentine's Party for Singles and more in Berlin!! 💕"
 * - Slug: "cool-valentines-party-singles-berlin-Ua9tkY"
 */
export function eventGenerateSlug(title: string): string {
  const words = title.split(/\s+/);

  // Remove common words (a, the and so on; multiple languages)
  const languagePack = [...eng, ...deu, ...fra, ...spa];
  const filteredWords = removeStopwords(words, languagePack);

  // Rejoin and create base slug
  const cleanTitle = filteredWords.join(' ');
  let base = slugify(cleanTitle, {
    lower: true,
    strict: true, // Strips emojis/symbols
    trim: true,
  });

  // Limit the "text" part to 40 chars to keep URL managable, cut at hyphen
  if (base.length > 40) {
    base = base.substring(0, 40).replace(/-+$/, '');
  }

  // Use a fallback if the title was only special characters/emojis
  const prefix = base || 'event';

  // nanoid(6) gives ~68 billion possibilities, plenty for uniqueness
  // and makes the "anonymous link" secure enough.
  return `${prefix}-${generateNanoId()}`;
}
