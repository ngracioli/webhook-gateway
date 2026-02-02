import crypto from 'node:crypto';

const SECRET = process.env.TEST_WEBHOOK_SECRET ?? 'test-secret';
const url = 'http://localhost:3000/webhooks/test';

const payload = {
  id: 'evt-123',
  type: 'user.created',
  data: { name: 'Alice' },
};

const rawBody = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(rawBody)
  .digest('hex');

async function send() {
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

  console.log(`sent: ${statusLabel} (HTTP ${res.status})`);
  if (res.status >= 400) console.log('response body:', text);
}

(async () => {
  await send();
})();
