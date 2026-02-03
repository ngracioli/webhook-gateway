import { EventStatus, type WebhookEvent } from '@prisma/client';
import { prisma } from '@/infra/prisma';
import { logger } from '@/utils/logger';
import type { EventRepository } from './event.repository';

export class EventProcessor {
  constructor(private readonly eventRepository: EventRepository) {}

  async processPending(): Promise<void> {
    const pendingEvents = await prisma.webhookEvent.findMany({
      where: {
        status: EventStatus.pending,
      },
    });

    for (const event of pendingEvents) {
      await this.processEvent(event);
    }
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    try {
      await this.eventRepository.incrementAttempts({
        provider: event.provider,
        id: event.id,
      });

      logger.info(
        `Processing event (noop): ${event.provider}:${event.id} ${event.eventType}`
      );

      await this.eventRepository.makeAsProcessed({
        provider: event.provider,
        id: event.id,
      });

      logger.info(`Event processed: ${event.provider}:${event.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.eventRepository.markAsFailed(
        {
          provider: event.provider,
          id: event.id,
        },
        errorMessage
      );

      logger.error(`Event failed: ${event.provider}:${event.id}`, error);
    }
  }
}
