import { EventStatus, type Prisma, type WebhookEvent } from '@prisma/client';
import { prisma } from '@/infra/prisma';

export class EventRepository {
  async findByProviderAndId(
    provider: string,
    id: string
  ): Promise<WebhookEvent | null> {
    return prisma.webhookEvent.findFirst({
      where: {
        provider,
        id: id,
      },
    });
  }

  async create(data: {
    provider: string;
    id: string;
    eventType: string;
    payload: unknown;
  }): Promise<WebhookEvent> {
    return prisma.webhookEvent.create({
      data: {
        provider: data.provider,
        id: data.id,
        eventType: data.eventType,
        payload: data.payload as Prisma.InputJsonValue,
        status: EventStatus.pending,
      },
    });
  }

  async makeAsProcessed(eventId: {
    provider: string;
    id: string;
  }): Promise<void> {
    await prisma.webhookEvent.update({
      where: {
        provider_id: eventId,
      },
      data: {
        status: EventStatus.processed,
        processedAt: new Date(),
      },
    });
  }

  async markAsFailed(
    eventId: { provider: string; id: string },
    errorMessage: string
  ): Promise<void> {
    await prisma.webhookEvent.update({
      where: {
        provider_id: eventId,
      },
      data: {
        status: EventStatus.failed,
        lastError: errorMessage,
      },
    });
  }

  async incrementAttempts(eventId: {
    provider: string;
    id: string;
  }): Promise<void> {
    await prisma.webhookEvent.update({
      where: {
        provider_id: eventId,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }
}
