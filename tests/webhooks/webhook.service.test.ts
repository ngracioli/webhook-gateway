import '../infra/prisma.setup';

import { expect, it } from 'bun:test';
import { WebhookService } from '@/webhooks/webhook.service';
import { prisma } from '@/infra/prisma';

it('rejects signatures that do not follow sha256=<hex> and does not persist events', async () => {
  // Ensure secret exists so validator checks prefix rather than missing-secret branch
  process.env.TEST_WEBHOOK_SECRET = 'test-secret';

  let ingestCalled = false;
  const fakeEventService = {
    ingestEvent: async () => {
      ingestCalled = true;
      throw new Error('ingestEvent should not be called for invalid signature');
    },
  };

  const svc = new WebhookService(fakeEventService as any);

  const rawBody = JSON.stringify({ id: 'evt_123', type: 'created' });

  try {
    await svc.handleWebhook({
      provider: 'test',
      rawBody,
      signature: 'abcd123',
    });
    throw new Error('Expected handleWebhook to throw for invalid signature');
  } catch (err) {
    expect(String(err)).toContain('Invalid webhook signature');
  }

  const events = await prisma.webhookEvent.findMany();
  expect(events.length).toBe(0);
  expect(ingestCalled).toBe(false);
});

it('rejects when signature is valid but payload JSON is invalid and does not persist', async () => {
  process.env.TEST_WEBHOOK_SECRET = 'test-secret';

  let ingestCalled = false;
  const fakeEventService = {
    ingestEvent: async () => {
      ingestCalled = true;
      throw new Error('ingestEvent should not be called for invalid payload');
    },
  };

  const svc = new WebhookService(fakeEventService as any);

  const rawBody = '{ invalid json';

  // compute HMAC sha256 over the raw body using the same secret the validator expects
  const crypto = await import('node:crypto');
  const sig = crypto
    .createHmac('sha256', process.env.TEST_WEBHOOK_SECRET as string)
    .update(rawBody)
    .digest('hex');

  const signature = `sha256=${sig}`;

  try {
    await svc.handleWebhook({ provider: 'test', rawBody, signature });
    throw new Error('Expected handleWebhook to throw for invalid JSON payload');
  } catch (err) {
    expect(String(err)).toContain('Invalid JSON payload');
  }

  const events = await prisma.webhookEvent.findMany();
  expect(events.length).toBe(0);
  expect(ingestCalled).toBe(false);
});
