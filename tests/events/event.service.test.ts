import '../infra/prisma.setup';

import { expect, it } from 'bun:test';
import { EventRepository } from '@/events/event.repository';
import { EventService } from '@/events/event.service';
import { prisma } from '@/infra/prisma';

it('preserves idempotency when creating duplicate events', async () => {
  const repo = new EventRepository();
  const svc = new EventService(repo);

  const provider = 'test';
  const eventId = 'evt_123';

  const payload = { value: 1 };

  const first = await svc.ingestEvent({
    provider,
    id: eventId,
    eventType: 'created',
    payload,
  });

  expect(first.status).toBe('created');

  const second = await svc.ingestEvent({
    provider,
    id: eventId,
    eventType: 'created',
    payload,
  });

  expect(second.status).toBe('duplicate');

  const all = await prisma.webhookEvent.findMany({ where: { provider } });
  expect(all.length).toBe(1);

  const stored = all[0];
  expect(stored).toBeDefined();
  expect(stored?.status).toBe('pending');
  expect(stored?.attempts).toBe(0);
});
