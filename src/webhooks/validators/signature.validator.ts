import crypto from 'node:crypto';

type ValidateSignatureInput = {
  provider: string;
  rawBody: string;
  signature?: string | null;
};

export function validateSignature(input: ValidateSignatureInput): boolean {
  const secret = getWebhookSecret(input.provider);
  const signature = input.signature ?? null;

  console.log('Validating signature (require sha256= prefix):', {
    provider: input.provider,
    signatureProvided: !!signature,
    secretExists: !!secret,
  });

  if (!signature || !secret) return false;

  // Require `sha256=` prefix strictly
  if (!signature.startsWith('sha256=')) return false;

  const sig = signature.slice('sha256='.length);

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(input.rawBody)
    .digest('hex');

  if (expectedSignature.length !== sig.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(sig, 'hex')
    );
  } catch {
    return false;
  }
}

function getWebhookSecret(provider: string): string | null {
  switch (provider) {
    case 'test':
      return process.env.TEST_WEBHOOK_SECRET ?? null;
    default:
      return null;
  }
}
