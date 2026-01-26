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
 * GET /events?limit=20&cursor=MjAyNS0wMS0yMlQxMDowMDowMFo=|41
 */

export function encodeCursor(startAt: Date, id: number) {
  const str = `${startAt.toISOString()}|${id}`;
  return Buffer.from(str).toString('base64');
}

export function decodeCursor(cursor: string): { startAt: Date; id: number } {
  const [startAtStr, idStr] = Buffer.from(cursor, 'base64').toString('utf-8').split('|');
  return { startAt: new Date(startAtStr), id: parseInt(idStr, 10) };
}
