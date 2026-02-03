import { logger } from '@/utils/logger';
import crypto from 'node:crypto';

const SECRET = process.env.TEST_WEBHOOK_SECRET ?? 'test-secret';
const url = 'http://localhost:3000/webhooks/test';

const payload = {
  id: 'evt-123',
  type: 'user.created',
  data: { name: 'Alice' },
};

const rawBody = JSON.stringify(payload);
const signatureHex = crypto
  .createHmac('sha256', SECRET)
  .update(rawBody)
  .digest('hex');
const signature = `sha256=${signatureHex}`;

async function sendHttp() {
  logger.log('Sending webhook with details:', {
    url,
    payload,
    rawBody,
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
    },
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
    },
    body: rawBody,
  });

  const text = await res.text();
  let statusLabel = 'unknown';
  try {
    const json = JSON.parse(text);
    statusLabel = json.result?.status ?? json.status ?? 'unknown';
  } catch (_) {
    // ignore parse errors, keep statusLabel as 'unknown'
  }

  logger.log(`sent: ${statusLabel} (HTTP ${res.status})`);
  if (res.status >= 400) logger.log('response body:', text);
}

(async () => {
  await sendHttp();
})();
