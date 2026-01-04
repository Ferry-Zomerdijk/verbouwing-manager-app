interface QueuedMutation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
}

const QUEUE_KEY = 'renovatie-offline-queue';

export function addToQueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): QueuedMutation {
  const queue = getQueue();
  const newMutation: QueuedMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  queue.push(newMutation);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return newMutation;
}

export function getQueue(): QueuedMutation[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter(m => m.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export function getQueueLength(): number {
  return getQueue().length;
}
