import { EventProcessor } from '@/events/event.processor';
import { EventRepository } from '@/events/event.repository';

const PROCESS_INTERVAL_MS = 5000; // Process every 5 seconds

let processorInterval: Timer | null = null;

export function startEventProcessor(): void {
  const eventRepository = new EventRepository();
  const eventProcessor = new EventProcessor(eventRepository);

  processorInterval = setInterval(async () => {
    try {
      await eventProcessor.processPending();
    } catch (error) {
      console.error('Event processor error:', error);
    }
  }, PROCESS_INTERVAL_MS);

  console.log('Event processor started');
}

export function stopEventProcessor(): void {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log('Event processor stopped');
  }
}
