import { Prisma } from '@prisma/client';

/**
 * Encodes a cursor for invite pagination
 * Format: base64(createdAt:id)
 */
export function invitesEncodeCursor(createdAt: Date, id: string): string {
  const cursor = `${createdAt.toISOString()}:${id}`;
  return Buffer.from(cursor).toString('base64');
}

/**
 * Decodes a cursor and returns a Prisma filter for pagination
 */
export function invitesCursorFilter(input: { cursor?: string }): Prisma.EventInviteWhereInput {
  if (!input.cursor) return {};

  try {
    const decoded = Buffer.from(input.cursor, 'base64').toString('utf-8');
    const [createdAtStr, id] = decoded.split(':');

    if (!createdAtStr || !id) return {};

    const createdAt = new Date(createdAtStr);
    if (isNaN(createdAt.getTime())) return {};

    return {
      OR: [{ createdAt: { lt: createdAt } }, { createdAt: createdAt, id: { lt: id } }],
    };
  } catch {
    return {};
  }
}
