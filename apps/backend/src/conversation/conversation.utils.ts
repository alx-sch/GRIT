import { Prisma } from '@prisma/client';

/**
 * Encodes a cursor for conversation pagination
 * Format: base64(updatedAt:id)
 */
export function conversationEncodeCursor(updatedAt: Date, id: string): string {
  const cursor = `${updatedAt.toISOString()}:${id}`;
  return Buffer.from(cursor).toString('base64');
}

/**
 * Decodes a cursor and returns a Prisma filter for pagination
 */
export function conversationCursorFilter(input: {
  cursor?: string;
}): Prisma.ConversationWhereInput {
  if (!input.cursor) return {};

  try {
    const decoded = Buffer.from(input.cursor, 'base64').toString('utf-8');
    const [updatedAtStr, id] = decoded.split(':');

    if (!updatedAtStr || !id) return {};

    const updatedAt = new Date(updatedAtStr);
    if (isNaN(updatedAt.getTime())) return {};

    return {
      OR: [{ updatedAt: { lt: updatedAt } }, { updatedAt: updatedAt, id: { lt: id } }],
    };
  } catch {
    return {};
  }
}
