import { CreateEventSchema } from '@grit/schema';
import { EventBase } from '@/types/event';

/**
 * Validates an event to ensure it meets all requirements for publishing
 * @param event - The event to validate
 * @returns Object with validation result and error messages
 */
export const validateEventForPublish = (event: EventBase) => {
  const payload = {
    title: event.title,
    startAt: new Date(event.startAt).toISOString(),
    endAt: new Date(event.endAt).toISOString(),
    isPublished: true,
    isPublic: event.isPublic,
    content: event.content ?? undefined,
    locationId: event.location?.id ?? undefined,
  };

  const result = CreateEventSchema.safeParse(payload);

  if (!result.success) {
    const errorMessages = result.error.issues.map((err) => {
      const field = err.path.join('.');
      return `${field}: ${err.message}`;
    });

    return {
      isValid: false,
      errors: errorMessages,
    };
  }

  return {
    isValid: true,
    errors: [],
  };
};
