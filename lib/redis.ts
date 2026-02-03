import { createClient, RedisClientType } from 'redis';

let publisherClient: RedisClientType | null = null;

// Track subscriber instances per channel for proper cleanup
const subscriberInstances: Map<string, RedisClientType> = new Map();

/**
 * Get or create Redis publisher client
 */
export async function getRedisPublisher(): Promise<RedisClientType | null> {
  if (!publisherClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('REDIS_URL not configured, pub/sub features disabled');
      return null;
    }

    try {
      const client = createClient({ url: redisUrl });
      client.on('error', (err) => console.error('Redis Publisher Error:', err));
      await client.connect();
      publisherClient = client as RedisClientType;
    } catch (error) {
      console.error('Failed to connect Redis publisher:', error);
      return null;
    }
  }
  return publisherClient;
}

/**
 * Create a new subscriber client for a specific subscription
 * Each subscription gets its own client for proper isolation and cleanup
 */
async function createSubscriberClient(): Promise<RedisClientType | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('REDIS_URL not configured, pub/sub features disabled');
    return null;
  }

  try {
    const client = createClient({ url: redisUrl });
    client.on('error', (err) => console.error('Redis Subscriber Error:', err));
    await client.connect();
    return client as RedisClientType;
  } catch (error) {
    console.error('Failed to connect Redis subscriber:', error);
    return null;
  }
}

/**
 * Publish a message to a Redis channel
 */
export async function publishMessage(channel: string, message: string): Promise<void> {
  try {
    const publisher = await getRedisPublisher();
    if (!publisher) {
      console.warn('Redis not available, skipping publish');
      return;
    }
    await publisher.publish(channel, message);
  } catch (error) {
    console.error('Error publishing message:', error);
  }
}

/**
 * Subscribe to a Redis channel with a unique subscription ID
 * Returns the subscription ID for later unsubscribe
 */
export async function subscribeToChannel(
  channel: string,
  callback: (message: string) => void,
  subscriptionId?: string
): Promise<string | null> {
  const subId = subscriptionId || `${channel}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const subscriber = await createSubscriberClient();
    if (!subscriber) {
      console.warn('Redis not available, skipping subscribe');
      return null;
    }

    await subscriber.subscribe(channel, (message) => {
      callback(message);
    });

    // Store the subscriber instance for cleanup
    subscriberInstances.set(subId, subscriber);
    console.log(`Subscribed to ${channel} with ID: ${subId}`);
    
    return subId;
  } catch (error) {
    console.error('Error subscribing to channel:', error);
    return null;
  }
}

/**
 * Unsubscribe from a Redis channel using subscription ID
 */
export async function unsubscribeFromChannel(subscriptionId: string): Promise<void> {
  try {
    const subscriber = subscriberInstances.get(subscriptionId);
    if (subscriber) {
      await subscriber.unsubscribe();
      await subscriber.quit();
      subscriberInstances.delete(subscriptionId);
      console.log(`Unsubscribed and cleaned up: ${subscriptionId}`);
    }
  } catch (error) {
    console.error('Error unsubscribing from channel:', error);
    // Still remove from map to prevent memory leak
    subscriberInstances.delete(subscriptionId);
  }
}

/**
 * Get count of active subscriptions (for monitoring)
 */
export function getActiveSubscriptionCount(): number {
  return subscriberInstances.size;
}

/**
 * Disconnect all Redis clients (for graceful shutdown)
 */
export async function disconnectRedis(): Promise<void> {
  try {
    // Disconnect all subscriber instances
    const entries = Array.from(subscriberInstances.entries());
    for (const [id, subscriber] of entries) {
      try {
        await subscriber.quit();
      } catch {
        // Ignore errors during cleanup
      }
      subscriberInstances.delete(id);
    }

    // Disconnect publisher
    if (publisherClient) {
      await publisherClient.quit();
      publisherClient = null;
    }
  } catch (error) {
    console.error('Error disconnecting Redis:', error);
  }
}
