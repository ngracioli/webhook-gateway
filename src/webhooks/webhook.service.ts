import type { EventService } from '@/events/event.service';
import { validateSignature } from '@/webhooks/validators/signature.validator';

type WebhookInput = {
  provider: string;
  rawBody: string;
  headers: Record<string, string | undefined>;
  payload: unknown;
};

export class WebhookService {
  constructor(private readonly eventService: EventService) {}

  async handleWebhook(input: WebhookInput) {
    const isValid = validateSignature({
      provider: input.provider,
      rawBody: input.rawBody,
      headers: input.headers,
    });

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const eventId = this.extractEventId(input.payload);
    const eventType = this.extractEventType(input.payload);

    return this.eventService.ingestEvent({
      provider: input.provider,
      id: eventId,
      eventType,
      payload: input.payload,
    });
  }

  private extractEventId(payload: unknown): string {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid payload');
    }

    const record = payload as Record<string, unknown>;

    if (typeof record.id !== 'string') {
      throw new Error('Invalid payload: missing event id');
    }

    return record.id;
  }

  private extractEventType(payload: unknown): string {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid payload');
    }

    const record = payload as Record<string, unknown>;

    if (typeof record.type !== 'string') {
      throw new Error('Invalid payload: missing event type');
    }

    return record.type;
  }
}
