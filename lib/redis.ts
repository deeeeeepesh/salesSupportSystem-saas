import { createClient } from 'redis';

// Redis clients for pub/sub
let publisherClient: ReturnType<typeof createClient> | null = null;
let subscriberClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Redis publisher client
 */
export async function getRedisPublisher() {
  if (!publisherClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('REDIS_URL not configured, pub/sub features will be disabled');
      return null;
    }

    publisherClient = createClient({ url: redisUrl });
    publisherClient.on('error', (err) => console.error('Redis Publisher Error:', err));
    await publisherClient.connect();
  }
  return publisherClient;
}

/**
 * Get or create Redis subscriber client
 */
export async function getRedisSubscriber() {
  if (!subscriberClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('REDIS_URL not configured, pub/sub features will be disabled');
      return null;
    }

    subscriberClient = createClient({ url: redisUrl });
    subscriberClient.on('error', (err) => console.error('Redis Subscriber Error:', err));
    await subscriberClient.connect();
  }
  return subscriberClient;
}

/**
 * Publish a message to a Redis channel
 */
export async function publishMessage(channel: string, message: string) {
  try {
    const publisher = await getRedisPublisher();
    if (!publisher) {
      console.warn('Redis not available, skipping publish');
      return;
    }
    await publisher.publish(channel, message);
    console.log(`Published to ${channel}:`, message);
  } catch (error) {
    console.error('Error publishing message:', error);
  }
}

/**
 * Subscribe to a Redis channel
 */
export async function subscribeToChannel(
  channel: string,
  callback: (message: string) => void
) {
  try {
    const subscriber = await getRedisSubscriber();
    if (!subscriber) {
      console.warn('Redis not available, skipping subscribe');
      return;
    }
    
    await subscriber.subscribe(channel, callback);
    console.log(`Subscribed to ${channel}`);
  } catch (error) {
    console.error('Error subscribing to channel:', error);
  }
}

/**
 * Disconnect Redis clients
 */
export async function disconnectRedis() {
  try {
    if (publisherClient) {
      await publisherClient.quit();
      publisherClient = null;
    }
    if (subscriberClient) {
      await subscriberClient.quit();
      subscriberClient = null;
    }
  } catch (error) {
    console.error('Error disconnecting Redis:', error);
  }
}
