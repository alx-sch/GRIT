import {BadRequestException} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {customAlphabet} from 'nanoid';
import slugify from 'slugify';
import {deu, eng, fra, removeStopwords, spa} from 'stopword';

import {ReqEventGetPublishedDto} from './event.schema';

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

export function eventEncodeCursor(startAt: Date, id: number) {
  const str = `${startAt.toISOString()}|${String(id)}`;
  return Buffer.from(str).toString('base64');
}

export function eventDecodeCursor(cursor: string): {startAt: Date; id: number} {
  const [startAtStr, idStr] =
      Buffer.from(cursor, 'base64').toString('utf-8').split('|');
  return {startAt: new Date(startAtStr), id: parseInt(idStr, 10)};
}

/**
 * ==================================================
 * HELPER FUNCTIONS FOR EVENTGETPUBLISHED()
 * ==================================================
 */

// For filtering the events by start time, author id, search keywords etc.
export function eventSearchFilter(
    input: ReqEventGetPublishedDto, userId?: number) {
  const visibilityFilter: Prisma.EventWhereInput = userId ? {
    OR: [
      {isPublic: true},
      {authorId: userId},
      {attendees: {some: {userId}}},
    ],
  } :
                                                            {isPublic: true};

  const where:
      Prisma.EventWhereInput = {isPublished: true, AND: [visibilityFilter]};

  if (input.search) {
    where.OR = [
      {title: {contains: input.search, mode: 'insensitive'}},
      {content: {contains: input.search, mode: 'insensitive'}},
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
  const {cursor} = input;
  let cursorFilter = {};

  if (cursor) {
    try {
      const {startAt, id} = eventDecodeCursor(cursor);
      if (!(startAt instanceof Date) || isNaN(startAt.getTime()) ||
          typeof id !== 'number') {
        throw new Error('Invalid cursor');
      }
      cursorFilter = {
        OR: [{startAt: {gt: startAt}}, {startAt, id: {gt: id}}],
      };
    } catch {
      throw new BadRequestException('Invalid cursor provided');
    }
  }
  return cursorFilter;
}

/**
 * ==================================================
 * HELPER FUNCTIONS (GENERAL)
 * ==================================================
 */

const generateNanoId = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 6);

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
    strict: true,  // Strips emojis/symbols
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
