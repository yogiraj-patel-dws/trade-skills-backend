const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  async set(key, value, expireInSeconds = null) {
    await this.connect();
    if (expireInSeconds) {
      return await this.client.setEx(key, expireInSeconds, JSON.stringify(value));
    }
    return await this.client.set(key, JSON.stringify(value));
  }

  async get(key) {
    await this.connect();
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key) {
    await this.connect();
    return await this.client.del(key);
  }

  async exists(key) {
    await this.connect();
    return await this.client.exists(key);
  }
}

module.exports = new RedisClient();