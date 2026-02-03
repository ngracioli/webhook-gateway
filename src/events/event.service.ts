import type { WebhookEvent } from '@prisma/client';
import type { EventRepository } from './event.repository';
import { logger } from '@/utils/logger';

type CreateEventInput = {
  provider: string;
  id: string;
  eventType: string;
  payload: unknown;
};

type CreateEventResult =
  | { status: 'created'; event: WebhookEvent }
  | { status: 'duplicate'; event: WebhookEvent };

export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async ingestEvent(input: CreateEventInput): Promise<CreateEventResult> {
    const existingEvent = await this.eventRepository.findByProviderAndId(
      input.provider,
      input.id
    );

    if (existingEvent) {
      logger.warn('Duplicate event ingestion detected', {
        provider: input.provider,
        id: input.id,
      });
      return { status: 'duplicate', event: existingEvent };
    }

    const createdEvent = await this.eventRepository.create({
      provider: input.provider,
      id: input.id,
      eventType: input.eventType,
      payload: input.payload,
    });
    return { status: 'created', event: createdEvent };
  }
}
