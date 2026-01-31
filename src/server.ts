import { Elysia } from 'elysia';
import { webhookController } from '@/webhooks/webhook.controller';

const app = new Elysia();

app.use(webhookController());

app.listen(3000);

console.log('Server is running on http://localhost:3000');
