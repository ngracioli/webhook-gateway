import { Elysia } from 'elysia';
import { EventRepository } from '@/events/event.repository';
import { EventService } from '@/events/event.service';
import { WebhookService } from '@/webhooks/webhook.service';

export function webhookController() {
  const eventRepository = new EventRepository();
  const eventService = new EventService(eventRepository);
  const webhookService = new WebhookService(eventService);

  return new Elysia({ prefix: '/webhooks' }).post(
    '/:provider',
    async ({ params, request, headers }) => {
      const rawBody = await request.text();
      console.log('Received webhook:', { provider: params.provider, rawBody });
      const payload = JSON.parse(rawBody);

      try {
        const result = await webhookService.handleWebhook({
          provider: params.provider,
          rawBody,
          headers: headers as Record<string, string | undefined>,
          payload,
        });
        return {
          ok: true,
          result,
        };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('signature')) {
            return new Response('Invalid signature', { status: 401 });
          }

          return new Response(`Webhook handling error: ${error.message}`, {
            status: 400,
          });
        }

        return new Response('Internal error', { status: 500 });
      }
    }
  );
}
