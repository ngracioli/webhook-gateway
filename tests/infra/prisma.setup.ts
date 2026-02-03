// Silence application logs during test runs; tests may still stub or capture logger.
process.env.TEST_SILENCE_LOGS = 'true';

import { afterAll, beforeAll, beforeEach } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

// Simple isolated test DB per full test run
const dbDir = path.join(process.cwd(), 'tests', '.db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbFile = path.join(dbDir, 'test.sqlite');

// Ensure a fresh DB for this run
try {
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
} catch (err) {
  console.error(
    'tests/infra/prisma.setup: failed to remove existing test DB file',
    {
      dbFile,
      error: err instanceof Error ? err.message : String(err),
    }
  );
}

process.env.DATABASE_URL = process.env.DATABASE_URL ?? `file:${dbFile}`;

import { prisma } from '../../src/infra/prisma';

beforeAll(async () => {
  // Connect Prisma (migrations are intentionally omitted here — keep setup minimal)
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean events between tests; if the table doesn't exist yet, ignore the error
  try {
    await prisma.webhookEvent.deleteMany({});
  } catch (err) {
    console.error(
      'tests/infra/prisma.setup: failed to clean webhookEvent table before test',
      { error: err instanceof Error ? err.message : 'unknown' }
    );
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  // Remove the test sqlite file to leave no artifacts
  try {
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  } catch {
    console.error(
      'tests/infra/prisma.setup: failed to remove test DB file during teardown',
      {
        dbFile,
      }
    );
  }
});
