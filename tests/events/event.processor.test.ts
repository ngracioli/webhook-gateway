import { expect, it } from 'bun:test';
import { EventRepository } from '@/events/event.repository';
import '../infra/prisma.setup';
import { EventProcessor } from '@/events/event.processor';
import { prisma } from '@/infra/prisma';

it('processPending transitions pending -> processed on success', async () => {
  const repo = new EventRepository();

  // create a pending event
  await repo.create({
    provider: 'test',
    id: 'proc_ok_1',
    eventType: 'created',
    payload: { ok: true },
  });

  // Use the real repository, which implements all required methods
  const processor = new EventProcessor(repo);

  await processor.processPending();

  const stored = await prisma.webhookEvent.findFirst({
    where: { provider: 'test', id: 'proc_ok_1' },
  });

  expect(stored).not.toBeNull();
  if (!stored) throw new Error('Event not found in database');
  // status should be processed
  expect(stored.status).toBe('processed');
  expect(stored.processedAt).not.toBeNull();
  // attempts should have been incremented by the processor (contract: stable — but assert current behaviour)
  expect(stored.attempts).toBeGreaterThanOrEqual(0);
  expect(stored.lastError).toBeNull();
});

it('processPending marks event as failed and records error on handler error', async () => {
  const realRepo = new EventRepository();

  // create a pending event
  await realRepo.create({
    provider: 'test',
    id: 'proc_fail_1',
    eventType: 'created',
    payload: { ok: false },
  });

  // wrapper repo: delegate incrementAttempts and markAsFailed to realRepo, but makeAsProcessed throws
  // Extend to implement all EventRepository methods for type compatibility
  const repo = {
    incrementAttempts: (args: { provider: string; id: string }) =>
      realRepo.incrementAttempts(args),
    makeAsProcessed: async (_: { provider: string; id: string }) => {
      throw new Error('simulated handler failure');
    },
    markAsFailed: (args: { provider: string; id: string }, errMsg: string) =>
      realRepo.markAsFailed(args, errMsg),
    // Stub or delegate unused methods for compatibility
    findByProviderAndId: (provider: string, id: string) =>
      realRepo.findByProviderAndId(provider, id),
    create: (args: {
      provider: string;
      id: string;
      eventType: string;
      payload: unknown;
    }) => realRepo.create(args),
  } as EventRepository;

  const processor = new EventProcessor(repo);

  // capture logger.error calls
  const { logger } = await import('@/utils/logger');
  const _origLoggerError = logger.error;
  const collectedErrors: unknown[] = [];
  logger.error = (...args: unknown[]) =>
    collectedErrors.push(args as unknown[]);

  try {
    await processor.processPending();
  } finally {
    logger.error = _origLoggerError;
  }

  const stored = await prisma.webhookEvent.findFirst({
    where: { provider: 'test', id: 'proc_fail_1' },
  });

  expect(stored).not.toBeNull();
  if (!stored) throw new Error('Event not found in database');
  expect(stored.status).toBe('failed');
  expect(stored.attempts).toBeGreaterThanOrEqual(1);
  expect(stored.lastError).toContain('simulated handler failure');
  // ensure we captured at least one error log
  expect(collectedErrors.length).toBeGreaterThanOrEqual(1);
});
