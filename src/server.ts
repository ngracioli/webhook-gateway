import { Elysia } from 'elysia';
import { webhookController } from '@/webhooks/webhook.controller';
import { startEventProcessor } from '@/infra/event-processor';

const app = new Elysia();

app.use(webhookController());

startEventProcessor();

app.listen(3000);

console.log('Server is running on http://localhost:3000');
