import { Elysia } from 'elysia';
import { startEventProcessor } from '@/infra/event-processor';
import { logger } from '@/utils/logger';
import { webhookController } from '@/webhooks/webhook.controller';

const app = new Elysia();

app.use(webhookController());

startEventProcessor();

app.listen(3000);

logger.log('Server is running on http://localhost:3000');
