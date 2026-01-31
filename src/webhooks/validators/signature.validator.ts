import crypto from 'node:crypto';

type ValidateSignatureInput = {
  provider: string;
  rawBody: string;
  headers: Record<string, string | undefined>;
};

export function validateSignature(input: ValidateSignatureInput): boolean {
  const secret = getWebhookSecret(input.provider);
  const signatureHeader =
    input.headers['x-signature'] ?? input.headers['x-webhook-signature'];

  console.log('Validating signature:', {
    provider: input.provider,
    signatureHeader,
    secretExists: !!secret,
  });

  if (!signatureHeader || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(input.rawBody)
    .digest('hex');

  if (expectedSignature.length !== signatureHeader.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signatureHeader)
  );
}

function getWebhookSecret(provider: string): string | null {
  switch (provider) {
    case 'test':
      return process.env.TEST_WEBHOOK_SECRET ?? null;
    default:
      return null;
  }
}
